import { describe, expect, it } from "vitest";
import {
  getSchemaReferenceSearchIndex,
  schemaReferenceObjects,
  splitSchemaReferenceAccess,
  type SchemaReferenceRow,
} from "./supabase-schema-reference";

const sensitivityValues = new Set(["High", "Medium", "Low"]);
const yesNoValues = new Set(["Yes", "No"]);
const accessValues = new Set(["Admin", "None", "Owner", "Public", "Signed-in", "System"]);

function allRows(): SchemaReferenceRow[] {
  return schemaReferenceObjects.flatMap((object) => [...object.rows]);
}

describe("supabase schema reference data", () => {
  it("ports the full approved mock-up object set", () => {
    expect(schemaReferenceObjects).toHaveLength(46);
    expect(schemaReferenceObjects.filter((object) => object.type === "table")).toHaveLength(45);
    expect(schemaReferenceObjects.filter((object) => object.type === "storage")).toHaveLength(1);
    expect(schemaReferenceObjects.reduce((total, object) => total + object.rows.length, 0)).toBe(521);
  });

  it("keeps controlled table values stable", () => {
    for (const row of allRows()) {
      expect(sensitivityValues.has(row.sensitivity), row.field).toBe(true);
      expect(yesNoValues.has(row.rawExposure), row.field).toBe(true);
      expect(yesNoValues.has(row.feedsUi), row.field).toBe(true);
      for (const accessCell of [row.read, row.write, row.update, row.delete]) {
        for (const accessValue of splitSchemaReferenceAccess(accessCell)) {
          expect(accessValues.has(accessValue), row.field + ": " + accessCell).toBe(true);
        }
      }
    }
  });

  it("does not reintroduce rejected access actors", () => {
    const accessText = allRows()
      .flatMap((row) => [row.read, row.write, row.update, row.delete])
      .join(" ");

    expect(accessText).not.toContain("Reporter");
    expect(accessText).not.toContain("Published");
  });

  it("keeps App Location tied to front-end feed state", () => {
    for (const row of allRows()) {
      if (row.feedsUi === "No") expect(row.appLocation, row.field).toBe("None");
      if (row.feedsUi === "Yes") expect(row.appLocation, row.field).not.toBe("None");
    }
  });

  it("searching reports only matches the reports object", () => {
    const matches = schemaReferenceObjects.filter((object) => getSchemaReferenceSearchIndex(object).includes("reports"));
    expect(matches.map((object) => object.name)).toEqual(["reports"]);
  });
});
