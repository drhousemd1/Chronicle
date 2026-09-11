import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";
import { buildSkillCatalog, compareSkillCatalog } from "./sync-chronicle-skills.mjs";

const roots = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), "chronicle-skills-")); roots.push(root);
  const skill = path.join(root, "skills", "fixture"); mkdirSync(path.join(skill, "references"), { recursive: true });
  writeFileSync(path.join(skill, "SKILL.md"), "---\nname: fixture\ndescription: Read the approved source.\n---\n# Fixture\nKeep every instruction.\n");
  writeFileSync(path.join(skill, "references", "detail.md"), "# Detail\nA required recovery instruction.\n");
  const manifest = { schemaVersion: 1, skills: [{ id: "fixture", displayName: "Shared Fixture", classification: "Shared", usage: "Only when selected.", source: { kind: "personal", directory: "fixture" }, supportingFiles: ["references/detail.md"] }] };
  return { root, skill, manifest, options: { codexHome: root, syncedAt: "2026-09-06T00:00:00.000Z" } };
}

test("preserves the complete entrypoint and supporting instructions", () => {
  const f = fixture(); const catalog = buildSkillCatalog(f.manifest, f.options);
  assert.match(catalog.entries[0].source.text, /Keep every instruction\./);
  assert.equal(catalog.entries[0].supportingFiles[0].text, "# Detail\nA required recovery instruction.\n");
  assert.deepEqual(compareSkillCatalog(catalog, structuredClone(catalog)), []);
});

test("rejects invalid manifest identity and detects changed tab order", () => {
  const f = fixture();
  const invalid = structuredClone(f.manifest); delete invalid.skills[0].id;
  assert.throws(() => buildSkillCatalog(invalid, f.options), /Invalid or duplicate skill ID/);
  invalid.skills[0].id = "fixture"; delete invalid.skills[0].usage;
  assert.throws(() => buildSkillCatalog(invalid, f.options), /Missing usage boundary/);
  f.manifest.skills.push({ ...f.manifest.skills[0], id: "second" });
  const expected = buildSkillCatalog(f.manifest, f.options);
  const reordered = structuredClone(expected); reordered.entries.reverse();
  assert.match(compareSkillCatalog(expected, reordered).join("\n"), /order has changed/);
});

test("detects missing, extra, altered primary and altered supporting content", () => {
  const f = fixture(); const catalog = buildSkillCatalog(f.manifest, f.options);
  const missing = structuredClone(catalog); missing.entries = [];
  assert.match(compareSkillCatalog(catalog, missing).join("\n"), /Missing approved skill/);
  const extra = structuredClone(catalog); extra.entries.push({ ...extra.entries[0], id: "unexpected" });
  assert.match(compareSkillCatalog(catalog, extra).join("\n"), /Unexpected catalog skill/);
  const altered = structuredClone(catalog); altered.entries[0].source.text = "Truncated text";
  assert.match(compareSkillCatalog(catalog, altered).join("\n"), /Stale skill/);
  writeFileSync(path.join(f.skill, "references/detail.md"), "Changed source instructions\n");
  assert.match(compareSkillCatalog(buildSkillCatalog(f.manifest, f.options), catalog).join("\n"), /Stale skill/);
});

test("refuses a missing or escaping source without overwriting a reading copy", () => {
  const f = fixture(); f.manifest.skills[0].supportingFiles = ["references/missing.md"];
  assert.throws(() => buildSkillCatalog(f.manifest, f.options), /ENOENT/);
  writeFileSync(path.join(f.root, "outside.md"), "Outside the skill package");
  f.manifest.skills[0].supportingFiles = ["../../outside.md"];
  assert.throws(() => buildSkillCatalog(f.manifest, f.options), /escapes its source package/);
});

test("resolves the current installed plugin version and detects an update", () => {
  const f = fixture(); f.manifest.skills[0].source = { kind: "plugin", pluginId: "fixture@market", entrypoint: "skills/fixture/SKILL.md" };
  f.manifest.skills[0].supportingFiles = [];
  const installed = { installed: [{ pluginId: "fixture@market", name: "fixture", marketplaceName: "market", version: "1", installed: true }] };
  for (const version of ["1", "2"]) {
    const dir = path.join(f.root, "plugins/cache/market/fixture", version, "skills/fixture"); mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "SKILL.md"), `---\nname: fixture\ndescription: Version ${version}.\n---\nFull version ${version}.\n`);
  }
  const old = buildSkillCatalog(f.manifest, { ...f.options, installedPlugins: installed });
  installed.installed[0].version = "2";
  const current = buildSkillCatalog(f.manifest, { ...f.options, installedPlugins: installed });
  assert.match(current.entries[0].source.text, /Full version 2/);
  assert.match(compareSkillCatalog(current, old).join("\n"), /Stale skill/);
  assert.throws(() => buildSkillCatalog(f.manifest, { ...f.options, installedPlugins: { installed: [] } }), /missing or ambiguous/);
});
