import path from "node:path";
import { fileURLToPath } from "node:url";

import { verifyGraphifyToolchain } from "./verify-toolchain";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
verifyGraphifyToolchain(repositoryRoot, {
  checkEnvironment: process.argv.includes("--environment"),
}).then((result) => {
  console.log(
    `Chronicle Graphify toolchain verified: ${result.version}, ${result.pinnedFiles} inert upstream files${result.environmentChecked ? ", local environment verified" : ""}.`,
  );
}).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
