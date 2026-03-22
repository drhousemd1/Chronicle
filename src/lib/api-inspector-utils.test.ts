import { describe, expect, it } from "vitest";
import { apiInspectorMapRegistry } from "@/data/api-inspector-map-registry";
import {
  parseApiArchitecturePackage,
  serializeApiArchitecturePackage,
  validateApiArchitectureRegistry,
} from "@/lib/api-inspector-utils";

const cloneRegistry = () => JSON.parse(JSON.stringify(apiInspectorMapRegistry));

describe("api-inspector-utils", () => {
  it("validates the baseline registry with no errors", () => {
    const issues = validateApiArchitectureRegistry(cloneRegistry());
    const errors = issues.filter((issue) => issue.severity === "error");
    expect(errors.length).toBe(0);
  });

  it("flags missing file references as an error", () => {
    const registry = cloneRegistry();
    registry.phases[0].sections[0].items[0].fileRefs = [];
    const issues = validateApiArchitectureRegistry(registry);
    expect(issues.some((issue) => issue.id.includes("item-fileref-missing"))).toBe(true);
  });

  it("flags broken cross references as an error", () => {
    const registry = cloneRegistry();
    registry.phases[0].sections[0].items[0].crossRefs = [
      {
        badge: "99",
        targetItemId: "missing-item-id",
        label: "Broken target",
        tooltip: "broken",
      },
    ];
    const issues = validateApiArchitectureRegistry(registry);
    expect(issues.some((issue) => issue.id.includes("cross-ref-missing-target"))).toBe(true);
  });

  it("supports package export/import round-trip", () => {
    const registry = cloneRegistry();
    const serialized = serializeApiArchitecturePackage(registry);
    const parsed = parseApiArchitecturePackage(serialized);
    expect(parsed.packageType).toBe("chronicle-api-architecture-map");
    expect(parsed.packageVersion).toBe(1);
    expect(parsed.registry.meta.id).toBe(registry.meta.id);
    expect(parsed.registry.phases.length).toBe(registry.phases.length);
  });

  it("rejects invalid package payloads", () => {
    expect(() =>
      parseApiArchitecturePackage(
        JSON.stringify({
          packageType: "chronicle-api-architecture-map",
          packageVersion: 999,
          registry: {},
        }),
      ),
    ).toThrowError(/Invalid package format/i);
  });
});

