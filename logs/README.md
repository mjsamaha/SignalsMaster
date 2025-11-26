# Logs Directory

This directory contains execution logs from automation scripts.

## File Types

- **`test-workflow-*.log`** - Complete console output from test workflow executions
- **`test-workflow-*.html`** - Visual summary reports from test workflow executions
- **`git-push-*.log`** - Complete console output from git commit/push operations
- **`git-push-*.html`** - Visual summary reports from git commit/push operations

## Filename Format

`{script-name}-YYYY-MM-DD-HHmmss.{ext}`

Example: `test-workflow-2025-11-25-195711.log`

## Retention

These files are git-ignored and exist only on your local machine. You can safely delete old logs at any time.

## Usage

- **Text logs (.log)**: Full transcript of script execution, useful for detailed debugging
- **HTML reports (.html)**: Visual dashboard with test results, execution times, and status indicators

## Viewing HTML Reports

Simply open the `.html` files in any web browser to view the formatted report with:

- Overall status (PASSED/FAILED)
- Test counts and durations
- Timeline of execution
- Links to detailed reports (Playwright)
- Path to full text log

## Auto-Generated

Both log types are automatically created every time you run:

- `npm run test:all` (creates test-workflow logs)
- `npm run commit:push` (creates git-push logs)

No manual intervention required!
