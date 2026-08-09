#!/usr/bin/env node

import { spawn } from "node:child_process";

const FORWARDED_SIGNALS = ["SIGINT", "SIGTERM", "SIGHUP"];

let commandStarted = false;
let child = null;
let terminalSignal = null;

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
  if (process.connected) process.disconnect();
}

function finish(exitCode, signal) {
  if (process.connected) process.disconnect();
  if (signal) {
    for (const forwardedSignal of FORWARDED_SIGNALS) {
      process.removeAllListeners(forwardedSignal);
    }
    process.kill(process.pid, signal);
    return;
  }
  process.exitCode = exitCode ?? 1;
}

for (const signal of FORWARDED_SIGNALS) {
  process.on(signal, () => {
    terminalSignal = signal;
    if (child && child.exitCode === null && child.signalCode === null) {
      child.kill(signal);
      return;
    }
    finish(null, signal);
  });
}

process.once("disconnect", () => {
  if (!commandStarted) {
    process.exitCode = 125;
  }
});

process.once("message", (message) => {
  if (
    !message ||
    typeof message !== "object" ||
    message.type !== "start" ||
    typeof message.command !== "string" ||
    message.command.length === 0 ||
    !Array.isArray(message.arguments) ||
    message.arguments.some((argument) => typeof argument !== "string")
  ) {
    fail("Knowledge certification supervisor received an invalid start request.");
    return;
  }
  commandStarted = true;
  child = spawn(message.command, message.arguments, {
    cwd: process.cwd(),
    env: process.env,
    shell: false,
    stdio: "inherit",
  });
  child.once("error", (error) => {
    fail(error instanceof Error ? error.message : String(error));
  });
  child.once("exit", (exitCode, signal) => {
    finish(exitCode, signal ?? terminalSignal);
  });
});

if (!process.send) {
  fail("Knowledge certification supervisor requires an IPC parent.");
} else {
  process.send({ type: "ready", pid: process.pid });
}
