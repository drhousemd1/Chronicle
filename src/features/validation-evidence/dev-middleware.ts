import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

import {
  buildValidationEvidenceLedgerSnapshot,
  readRawReportForExecution,
} from './ledger-file';
import { readValidationSourceIdentity } from './source-identity';

const LEDGER_PATH = '/__validation-evidence/roleplay-pipeline-ledger.json';
const REPORT_PATH = '/__validation-evidence/report';

function isLoopbackRequest(request: IncomingMessage) {
  const address = request.socket.remoteAddress ?? '';
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}

function sendJson(response: ServerResponse, status: number, value: unknown) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(`${JSON.stringify(value, null, 2)}\n`);
}

export function validationEvidenceDevPlugin(): Plugin {
  return {
    name: 'chronicle-validation-evidence-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const requestUrl = new URL(request.url ?? '/', 'http://localhost');
        if (requestUrl.pathname !== LEDGER_PATH && requestUrl.pathname !== REPORT_PATH) {
          next();
          return;
        }
        if (request.method !== 'GET') {
          sendJson(response, 405, { error: 'method_not_allowed' });
          return;
        }
        if (!isLoopbackRequest(request)) {
          sendJson(response, 403, { error: 'validation_evidence_is_local_only' });
          return;
        }

        try {
          if (requestUrl.pathname === LEDGER_PATH) {
            sendJson(response, 200, await buildValidationEvidenceLedgerSnapshot(await readValidationSourceIdentity(server.config.root)));
            return;
          }

          const executionId = requestUrl.searchParams.get('executionId') ?? '';
          if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(executionId)) {
            sendJson(response, 400, { error: 'invalid_execution_id' });
            return;
          }
          const report = await readRawReportForExecution(executionId);
          if (report === null) {
            sendJson(response, 404, { error: 'report_not_found' });
            return;
          }
          sendJson(response, 200, report);
        } catch {
          sendJson(response, 500, { error: 'validation_evidence_unavailable' });
        }
      });
    },
  };
}
