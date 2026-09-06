import { printableRepositoryGraphError, runRepositoryGraphCommand } from "./cli";

runRepositoryGraphCommand(process.cwd(), process.argv.slice(2)).catch((error) => {
  console.error(printableRepositoryGraphError(error));
  process.exitCode = 1;
});
