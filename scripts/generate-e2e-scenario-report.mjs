import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const inputPath = process.env.PLAYWRIGHT_JSON_OUTPUT_NAME ?? path.join('test-results', 'results.json');
const outputJsonPath =
  process.env.E2E_SCENARIO_REPORT_JSON ?? path.join('test-results', 'scenario-report.json');
const outputMarkdownPath =
  process.env.E2E_SCENARIO_REPORT_MD ?? path.join('test-results', 'scenario-report.md');

function extractTags(title) {
  return Array.from(title.matchAll(/@\w+/g), (match) => match[0].toLowerCase());
}

function extractPriority(title) {
  const priorityTag = extractTags(title).find((tag) => ['@high', '@medium', '@low'].includes(tag));
  return priorityTag ? priorityTag.slice(1) : 'unlabeled';
}

function cleanScenarioName(title) {
  return title.replace(/@\w+/g, '').replace(/\s+/g, ' ').trim() || 'scenario';
}

function flattenSpecs(suite, parentTitles = []) {
  const suiteTitle = suite.title?.trim();
  const nextParentTitles = suiteTitle ? [...parentTitles, suiteTitle] : parentTitles;
  const specs = [];

  for (const spec of suite.specs ?? []) {
    specs.push({
      ...spec,
      parentTitles: nextParentTitles,
    });
  }

  for (const childSuite of suite.suites ?? []) {
    specs.push(...flattenSpecs(childSuite, nextParentTitles));
  }

  return specs;
}

function summarizeSpec(spec) {
  const tags = extractTags(spec.title ?? '');
  const priority = extractPriority(spec.title ?? '');
  const scenario = cleanScenarioName(spec.title ?? '');
  const file = spec.file ?? null;
  const line = spec.line ?? null;
  const column = spec.column ?? null;
  const tests = spec.tests ?? [];
  const resultStatuses = [];
  let durationMs = 0;
  let retries = 0;

  for (const test of tests) {
    const results = test.results ?? [];
    retries += Math.max(0, results.length - 1);
    for (const result of results) {
      if (typeof result.duration === 'number') {
        durationMs += result.duration;
      }
      if (result.status) {
        resultStatuses.push(result.status);
      }
    }
  }

  const fallbackStatuses = tests.map((test) => test.status).filter(Boolean);
  const statuses = resultStatuses.length > 0 ? resultStatuses : fallbackStatuses;

  let status = 'unknown';
  if (statuses.some((value) => value === 'failed')) {
    status = 'failed';
  } else if (statuses.some((value) => value === 'timedOut')) {
    status = 'timedOut';
  } else if (statuses.some((value) => value === 'interrupted')) {
    status = 'interrupted';
  } else if (statuses.some((value) => value === 'passed')) {
    status = 'passed';
  } else if (statuses.length > 0 && statuses.every((value) => value === 'skipped')) {
    status = 'skipped';
  }

  return {
    scenario,
    title: spec.title ?? '',
    priority,
    tags,
    status,
    ok: status === 'passed',
    file,
    line,
    column,
    durationMs,
    retries,
    suite: spec.parentTitles,
  };
}

function makeSummary(scenarios) {
  const summary = {
    total: scenarios.length,
    passed: 0,
    failed: 0,
    timedOut: 0,
    interrupted: 0,
    skipped: 0,
    unknown: 0,
    high: 0,
    medium: 0,
    low: 0,
    unlabeled: 0,
  };

  for (const scenario of scenarios) {
    summary[scenario.status] = (summary[scenario.status] ?? 0) + 1;
    summary[scenario.priority] = (summary[scenario.priority] ?? 0) + 1;
  }

  return summary;
}

function toMarkdown(report) {
  const lines = [
    '# Scenario Report',
    '',
    `- Total scenarios: ${report.summary.total}`,
    `- Passed: ${report.summary.passed}`,
    `- Failed: ${report.summary.failed}`,
    `- Timed out: ${report.summary.timedOut}`,
    `- Interrupted: ${report.summary.interrupted}`,
    `- Skipped: ${report.summary.skipped}`,
    `- High priority: ${report.summary.high}`,
    `- Medium priority: ${report.summary.medium}`,
    `- Low priority: ${report.summary.low}`,
    `- Unlabeled: ${report.summary.unlabeled}`,
    '',
    '| Priority | Status | Scenario | File |',
    '| --- | --- | --- | --- |',
  ];

  for (const scenario of report.scenarios) {
    lines.push(
      `| ${scenario.priority} | ${scenario.status} | ${scenario.scenario.replace(/\|/g, '\\|')} | ${scenario.file ?? ''} |`,
    );
  }

  lines.push('');
  return lines.join('\n');
}

const raw = await readFile(inputPath, 'utf8');
const parsed = JSON.parse(raw);
const rootSuites = parsed.suites ?? [];
const scenarios = rootSuites.flatMap((suite) => flattenSpecs(suite)).map(summarizeSpec);
const report = {
  generatedAt: new Date().toISOString(),
  run: {
    repository: process.env.GITHUB_REPOSITORY ?? '',
    branch: process.env.GITHUB_REF_NAME ?? '',
    runId: process.env.GITHUB_RUN_ID ?? '',
    runNumber: process.env.GITHUB_RUN_NUMBER ?? '',
    runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? '',
    workflow: process.env.GITHUB_WORKFLOW ?? '',
    scenarioVersion: process.env.E2E_SCENARIO_VERSION ?? '',
    playwrightExitCode: process.env.PLAYWRIGHT_EXIT_CODE ?? '',
  },
  summary: makeSummary(scenarios),
  scenarios,
};

await mkdir(path.dirname(outputJsonPath), { recursive: true });
await writeFile(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
await writeFile(outputMarkdownPath, `${toMarkdown(report)}\n`, 'utf8');
