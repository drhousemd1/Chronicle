import { runRepositoryGraphHistoryCommand } from "./history-cli";

runRepositoryGraphHistoryCommand(process.cwd(), process.argv.slice(2)).catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message.split(process.cwd()).join("<repository>").replace(/\/Users\/[^/]+/g, "/Users/<redacted>"));
  process.exitCode = 1;
});
