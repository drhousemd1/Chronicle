import definitions from "../../../docs/ui-guide/catalog.json";
import { parseUiGuide, type UiGuideDefinition } from "./document";

export const uiGuideCatalog: UiGuideDefinition[] = definitions;
const sources = import.meta.glob<string>(["/docs/ui-guide/*.md", "!/docs/ui-guide/README.md"], { eager: true, query: "?raw", import: "default" });
const images = import.meta.glob<string>("/src/assets/ui-guide/**/*.png", { eager: true, query: "?url", import: "default" });

export function getUiGuide(id: string) {
  const definition = uiGuideCatalog.find(guide => guide.id === id);
  const markdown = definition ? sources[`/${definition.source}`] : undefined;
  if (!definition || !markdown) return null;
  return { ...definition, sections: parseUiGuide(markdown, definition) };
}

export function resolveUiGuideImage(source: string): string {
  if (!source.startsWith("../../src/assets/ui-guide/")) throw new Error(`Unsupported UI guide image: ${source}`);
  const asset = images[source.slice(5)];
  if (!asset) throw new Error(`Missing UI guide image: ${source}`);
  return asset;
}
