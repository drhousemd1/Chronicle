import { rootAndToolingArchitectureFiles } from "./root-and-tooling";
import { documentationArchitectureFiles } from "./documentation";
import type { ManualArchitectureFile } from "./types";
import { uiPrimitiveArchitectureFiles } from "./ui-primitives";
import { applicationShellArchitectureFiles } from "./application-shell";
import { adminFinanceArchitectureFiles } from "./admin-finance";
import { adminGuideArchitectureFiles } from "./admin-guides";
import { chronicleControlArchitectureFiles } from "./chronicle-controls";
import { chronicleBuilderSectionArchitectureFiles } from "./chronicle-builder-sections";
import { chronicleArcArchitectureFiles } from "./chronicle-arc";
import { chronicleMediaGalleryArchitectureFiles } from "./chronicle-media-gallery";
import { chronicleLibrarySessionThemeArchitectureFiles } from "./chronicle-library-session-theme";
import { chronicleChatInterfaceArchitectureFiles } from "./chronicle-chat-interface";
import { characterBuilderEditorArchitectureFiles } from "./character-builder-editor";
import { storyBuilderArchitectureFiles } from "./story-builder";
import { chatDebugArchitectureFiles } from "./chat-debug";
import { chatRuntimeFoundationArchitectureFiles } from "./chat-runtime-foundations";
import { chatRuntimeStateAndSourceArchitectureFiles } from "./chat-runtime-state-and-source";
import { chatRuntimeSupportAndValidationArchitectureFiles } from "./chat-runtime-support-and-validation";
import { validationEvidenceArchitectureFiles } from "./validation-evidence";
import { applicationHookArchitectureFiles } from "./application-hooks";
import { applicationContractAndIntegrationArchitectureFiles } from "./application-contracts-and-integrations";
import { pageArchitectureFiles } from "./pages";
import { adminGalleryFinanceServiceArchitectureFiles } from "./services-admin-gallery-and-finance";
import { aiAndRuntimeServiceArchitectureFiles } from "./services-ai-and-runtime";
import { persistenceServiceArchitectureFiles } from "./services-persistence";
import { adminDocumentationLibraryArchitectureFiles } from "./libraries-admin-documentation";
import { domainAndImportLibraryArchitectureFiles } from "./libraries-domain-and-import";
import { dataRegistryArchitectureFiles } from "./data-registries";
import { repositoryEntrypointAndScriptArchitectureFiles } from "./repository-entrypoints-and-scripts";
import { staticAssetArchitectureFiles } from "./static-assets";
import { supabaseFunctionArchitectureFiles } from "./supabase-functions";
import { supabaseJanuaryMigrationArchitectureFiles } from "./supabase-migrations-2026-01";
import { supabaseFebruaryMigrationArchitectureFiles } from "./supabase-migrations-2026-02";
import { supabaseMarchMigrationArchitectureFiles } from "./supabase-migrations-2026-03";
import { supabaseAprilMigrationArchitectureFiles } from "./supabase-migrations-2026-04";
import { supabaseMayMigrationArchitectureFiles } from "./supabase-migrations-2026-05";
import { supabaseJuneMigrationArchitectureFiles } from "./supabase-migrations-2026-06";
import { supabaseJulyMigrationArchitectureFiles } from "./supabase-migrations-2026-07";

export const manualArchitectureFiles: readonly ManualArchitectureFile[] = [
  ...rootAndToolingArchitectureFiles,
  ...documentationArchitectureFiles,
  ...uiPrimitiveArchitectureFiles,
  ...applicationShellArchitectureFiles,
  ...adminFinanceArchitectureFiles,
  ...adminGuideArchitectureFiles,
  ...chronicleControlArchitectureFiles,
  ...chronicleBuilderSectionArchitectureFiles,
  ...chronicleArcArchitectureFiles,
  ...chronicleMediaGalleryArchitectureFiles,
  ...chronicleLibrarySessionThemeArchitectureFiles,
  ...chronicleChatInterfaceArchitectureFiles,
  ...characterBuilderEditorArchitectureFiles,
  ...storyBuilderArchitectureFiles,
  ...chatDebugArchitectureFiles,
  ...chatRuntimeFoundationArchitectureFiles,
  ...chatRuntimeStateAndSourceArchitectureFiles,
  ...chatRuntimeSupportAndValidationArchitectureFiles,
  ...validationEvidenceArchitectureFiles,
  ...applicationHookArchitectureFiles,
  ...applicationContractAndIntegrationArchitectureFiles,
  ...pageArchitectureFiles,
  ...adminGalleryFinanceServiceArchitectureFiles,
  ...aiAndRuntimeServiceArchitectureFiles,
  ...persistenceServiceArchitectureFiles,
  ...adminDocumentationLibraryArchitectureFiles,
  ...domainAndImportLibraryArchitectureFiles,
  ...dataRegistryArchitectureFiles,
  ...repositoryEntrypointAndScriptArchitectureFiles,
  ...staticAssetArchitectureFiles,
  ...supabaseFunctionArchitectureFiles,
  ...supabaseJanuaryMigrationArchitectureFiles,
  ...supabaseFebruaryMigrationArchitectureFiles,
  ...supabaseMarchMigrationArchitectureFiles,
  ...supabaseAprilMigrationArchitectureFiles,
  ...supabaseMayMigrationArchitectureFiles,
  ...supabaseJuneMigrationArchitectureFiles,
  ...supabaseJulyMigrationArchitectureFiles,
];

export const manualArchitectureFileByPath = new Map<string, ManualArchitectureFile>(
  manualArchitectureFiles.map((file) => [file.path, file] as const),
);

if (manualArchitectureFileByPath.size !== manualArchitectureFiles.length) {
  throw new Error("Manual App Architecture registry contains duplicate file paths.");
}
