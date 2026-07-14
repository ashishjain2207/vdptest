# E2E Execution Result

- Status: **FAILED**
- Workflow: `Playwright E2E`
- Run: `17`
- Branch: `main`
- Playwright exit code: `1`
- Playwright results JSON found: `false`
- Analysis source: `deterministic`
- Azure OpenAI configured: `false`
- Source scenario count: `0`
- Executed tests: `0`
- Passed tests: `0`
- Failed tests: `1`
- Matched failed tests: `0`
- Extra executed tests not in source scenarios: `1`
- Source scenarios not covered: `0`
- Report link: https://github.com/ashishjain2207/vdptest/tree/testresults/testrun/17/playwright-report
- CI/CD build: https://github.com/ashishjain2207/vdptest/actions/runs/29318717203
- Artifact root: https://github.com/ashishjain2207/vdptest/tree/testresults/testrun/17

## Failure Buckets

| Failure type | Count |
|---|---:|
| reporting_or_execution_error | 1 |

## Failed Scenarios

| Failed test | Source scenario match | In source? | Failure type | Reason | Artifact |
|---|---|---:|---|---|---|
| Playwright execution failed before failures were parsed | Not matched | No | reporting_or_execution_error | The Playwright command failed before writing the JSON report, so CI could not extract individual failed scenarios. |  |

## Passed Scenarios

| Passed test | Source scenario match | In source? | Status |
|---|---|---:|---|
| none | none | Yes | none |

## Extra Executed Scenarios Not In Test Case Scenario Attachment

| Executed test | Status | Spec | Reason |
|---|---|---|---|
| Playwright execution failed before failures were parsed | failed | playwright-results | The Playwright command failed before writing the JSON report, so CI could not extract individual failed scenarios. |

## Source Scenarios Not Covered In This Run

| Source scenario | Reason |
|---|---|
| none | All source scenarios were covered or no source scenario attachment was provided. |

## Extra Failed Tests Not In Test Case Scenario Attachment

- Playwright execution failed before failures were parsed

## Scenarios From Attachment Without Failure In This Run

All source scenarios either failed or no source scenario attachment was provided.
