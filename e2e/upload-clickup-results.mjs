import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const CLICKUP_API_BASE_URL = 'https://api.clickup.com/api/v2';
const RESULTS_FILE = 'e2e/test-results/results.json';
const TEST_RESULTS_DIR = 'e2e/test-results';

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function runUrl(runId) {
  const repository = process.env.GITHUB_REPOSITORY;
  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';

  return repository ? `${serverUrl}/${repository}/actions/runs/${runId}` : undefined;
}

function mimeTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === '.json') {
    return 'application/json';
  }

  if (extension === '.jpg' || extension === '.jpeg') {
    return 'image/jpeg';
  }

  return 'image/png';
}

function uploadName(kind, filePath, runId, runAttempt) {
  const relativePath = path.relative(process.cwd(), filePath);
  const safePath = relativePath.replace(/[^a-zA-Z0-9._-]+/g, '-');

  return `playwright-${kind}-run-${runId}-attempt-${runAttempt}-${safePath}`;
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findScreenshots(directory) {
  if (!(await pathExists(directory))) {
    return [];
  }

  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return findScreenshots(fullPath);
      }

      return /\.(png|jpe?g)$/i.test(entry.name) ? [fullPath] : [];
    }),
  );

  return files.flat();
}

async function ensureResultsFile(resultsFile, runId, runAttempt) {
  if (await pathExists(resultsFile)) {
    return resultsFile;
  }

  await fs.mkdir(path.dirname(resultsFile), { recursive: true });
  await fs.writeFile(
    resultsFile,
    `${JSON.stringify(
      {
        generatedBy: 'e2e/upload-clickup-results.mjs',
        status: 'missing-playwright-json-results',
        message: 'Playwright JSON results were not found; this placeholder keeps the CI run grouped in ClickUp.',
        runId,
        runAttempt,
        generatedAt: new Date().toISOString(),
        runUrl: runUrl(runId),
      },
      null,
      2,
    )}\n`,
  );

  return resultsFile;
}

async function uploadAttachment({ apiToken, taskId, filePath, fileName }) {
  const fileBuffer = await fs.readFile(filePath);
  const formData = new FormData();
  formData.append('attachment', new Blob([fileBuffer], { type: mimeTypeFor(filePath) }), fileName);

  const response = await fetch(`${CLICKUP_API_BASE_URL}/task/${encodeURIComponent(taskId)}/attachment`, {
    method: 'POST',
    headers: {
      Authorization: apiToken,
    },
    body: formData,
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`ClickUp attachment upload failed for ${fileName}: ${response.status} ${response.statusText} ${responseText}`);
  }
}

async function createRunComment({ apiToken, taskId, runId, runAttempt, attachments }) {
  const lines = [
    `Playwright E2E run ${runId} attempt ${runAttempt} completed.`,
    runUrl(runId) ? `GitHub Actions run: ${runUrl(runId)}` : undefined,
    `Attached files tagged with run ${runId}:`,
    ...attachments.map((attachment) => `- ${attachment}`),
  ].filter(Boolean);

  const response = await fetch(`${CLICKUP_API_BASE_URL}/task/${encodeURIComponent(taskId)}/comment`, {
    method: 'POST',
    headers: {
      Authorization: apiToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      comment_text: lines.join('\n'),
      notify_all: false,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`ClickUp run comment failed: ${response.status} ${response.statusText} ${responseText}`);
  }
}

async function main() {
  const apiToken = requiredEnv('CLICKUP_API_TOKEN');
  const taskId = requiredEnv('CLICKUP_TASK_ID');
  const runId = requiredEnv('CLICKUP_RUN_ID');
  const runAttempt = process.env.GITHUB_RUN_ATTEMPT || '1';
  const resultsFile = path.resolve(await ensureResultsFile(path.resolve(RESULTS_FILE), runId, runAttempt));
  const screenshots = await findScreenshots(path.resolve(TEST_RESULTS_DIR));
  const uploads = [
    { kind: 'results', filePath: resultsFile },
    ...screenshots.map((filePath) => ({ kind: 'screenshot', filePath })),
  ];
  const uploadedNames = [];

  for (const upload of uploads) {
    const fileName = uploadName(upload.kind, upload.filePath, runId, runAttempt);
    await uploadAttachment({ apiToken, taskId, filePath: upload.filePath, fileName });
    uploadedNames.push(fileName);
  }

  await createRunComment({ apiToken, taskId, runId, runAttempt, attachments: uploadedNames });
  console.log(`Uploaded ${uploadedNames.length} Playwright E2E file(s) to ClickUp task ${taskId}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
