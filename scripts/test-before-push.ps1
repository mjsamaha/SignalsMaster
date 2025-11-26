<#
.SYNOPSIS
    Automated testing workflow script with branch validation and multi-stage test execution.

.DESCRIPTION
    This script automates the local testing workflow by:
    - Validating branch naming conventions (feat/, fix/, test/, etc.)
    - Hard-blocking execution on master/main branches
    - Bootstrap mode: detecting and auto-installing missing test dependencies
    - Running tests sequentially (Jest → Testing Library → Playwright) with fail-fast
    - Auto-starting dev server for E2E tests (stops automatically when done)
    - Auto-staging and committing with conventional commit messages on success
    - Respecting existing security hooks and git workflow

.PARAMETER NoE2E
    Skip Playwright E2E tests (useful for quick unit/component testing).

.PARAMETER WhatIf
    Preview what would happen without executing tests or git commands (dry-run mode).

.PARAMETER NoBootstrap
    Skip automatic installation of missing test dependencies.

.PARAMETER Message
    Custom commit message. If not provided, uses "tests passing" with conventional prefix.

.EXAMPLE
    .\test-before-push.ps1
    Run all tests sequentially, then commit on success

.EXAMPLE
    .\test-before-push.ps1 -NoE2E
    Run only Jest unit and component tests (skip Playwright)

.EXAMPLE
    .\test-before-push.ps1 -WhatIf
    Preview branch validation and test plan without execution

.EXAMPLE
    .\test-before-push.ps1 -Message "Add FlagService tests"
    Run tests and commit with custom message

.NOTES
    Author: SignalsMaster Team
    Date: November 25, 2025
    Version: 1.0.0

    Branch Pattern Requirements:
    - feat/ or feature/  : Feature development
    - fix/ or bug/       : Bug fixes
    - test/              : Test additions
    - refactor/          : Code refactoring
    - perf/              : Performance improvements
    - docs/              : Documentation
    - style/             : Code style changes
    - chore/             : Maintenance tasks
    - ci/                : CI/CD changes
    - exp/               : Experimental features
    - hotfix/            : Production hotfixes
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory=$false, HelpMessage="Skip Playwright E2E tests")]
    [switch]$NoE2E,

    [Parameter(Mandatory=$false, HelpMessage="Skip automatic dependency installation")]
    [switch]$NoBootstrap,

    [Parameter(Mandatory=$false, HelpMessage="Custom commit message")]
    [string]$Message = "tests passing"
)

# ============================================================================
# LOGGING SETUP
# ============================================================================

$timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
$logsDir = Join-Path $PSScriptRoot "..\logs"
$logFile = Join-Path $logsDir "test-workflow-$timestamp.log"
$htmlFile = Join-Path $logsDir "test-workflow-$timestamp.html"

# Ensure logs directory exists
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

# Start transcript for full text log
Start-Transcript -Path $logFile -Append | Out-Null

# Script-level variables for HTML report
$script:testResults = @{
    StartTime = Get-Date
    Branch = ""
    UnitTests = @{ Passed = 0; Failed = 0; Duration = 0; Output = "" }
    ComponentTests = @{ Passed = 0; Failed = 0; Duration = 0; Output = "" }
    E2ETests = @{ Passed = 0; Failed = 0; Skipped = 0; Duration = 0; Output = "" }
    CommitMessage = ""
    Success = $false
}

# ============================================================================
# HELPER FUNCTIONS (Reused from git-commit-push.ps1)
# ============================================================================

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-ColorOutput "===============================================================" "Cyan"
    Write-ColorOutput "  $Text" "Cyan"
    Write-ColorOutput "===============================================================" "Cyan"
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "[SUCCESS] $Message" "Green"
}

function Write-Warning2 {
    param([string]$Message)
    Write-ColorOutput "[WARNING] $Message" "Yellow"
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-ColorOutput "[ERROR] $Message" "Red"
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "[INFO] $Message" "Cyan"
}

function Test-GitRepository {
    try {
        git rev-parse --git-dir 2>&1 | Out-Null
        return $LASTEXITCODE -eq 0
    }
    catch {
        return $false
    }
}

function Get-CurrentBranch {
    $branch = git branch --show-current
    return $branch.Trim()
}

function Get-BranchPrefix {
    param([string]$Branch)

    $prefixMap = @{
        'feat/'     = 'feat'
        'feature/'  = 'feat'
        'hotfix/'   = 'hotfix'
        'bug/'      = 'fix'
        'fix/'      = 'fix'
        'refactor/' = 'refactor'
        'perf/'     = 'perf'
        'docs/'     = 'docs'
        'ci/'       = 'ci'
        'exp/'      = 'chore'
        'test/'     = 'test'
        'style/'    = 'style'
        'chore/'    = 'chore'
    }

    foreach ($pattern in $prefixMap.Keys) {
        if ($Branch -like "$pattern*") {
            return $prefixMap[$pattern]
        }
    }

    return $null
}

function Get-TicketNumber {
    param([string]$Branch)

    if ($Branch -match '([a-zA-Z]+-\d+(-\d+)*)') {
        return $matches[1]
    }

    return $null
}

function Apply-BranchPrefix {
    param(
        [string]$Message,
        [string]$Branch
    )

    $prefix = Get-BranchPrefix -Branch $Branch
    $ticket = Get-TicketNumber -Branch $Branch

    $conventionalPrefixes = @('feat:', 'feat(', 'fix:', 'fix(', 'docs:', 'docs(',
                              'style:', 'style(', 'refactor:', 'refactor(', 'perf:', 'perf(',
                              'test:', 'test(', 'build:', 'build(', 'ci:', 'ci(', 'chore:', 'chore(')
    $hasPrefix = $false

    foreach ($convPrefix in $conventionalPrefixes) {
        if ($Message -like "$convPrefix*") {
            $hasPrefix = $true
            break
        }
    }

    if ($hasPrefix) {
        return $Message
    }

    if ($null -ne $prefix) {
        if ($null -ne $ticket) {
            $formattedMessage = "$prefix($ticket): $Message"
            return $formattedMessage
        }
        else {
            $formattedMessage = "${prefix}: $Message"
            return $formattedMessage
        }
    }

    return $Message
}

# ============================================================================
# TEST-SPECIFIC FUNCTIONS
# ============================================================================

function Test-BranchNaming {
    param([string]$Branch)

    # HARD BLOCK: Refuse to run on master/main
    if ($Branch -eq "master" -or $Branch -eq "main") {
        Write-Host ""
        Write-ColorOutput "===============================================================" "Red"
        Write-ColorOutput "  TESTS CANNOT RUN ON MASTER/MAIN - CHECKOUT FEATURE BRANCH   " "Red"
        Write-ColorOutput "===============================================================" "Red"
        Write-Host ""
        Write-ErrorMsg "Testing on master/main is prohibited for safety."
        Write-Info "Please checkout a feature branch:"
        Write-Host "  git checkout -b feat/your-feature-name" -ForegroundColor Gray
        Write-Host "  git checkout -b fix/bug-description" -ForegroundColor Gray
        Write-Host "  git checkout -b test/test-description" -ForegroundColor Gray
        Write-Host ""
        return $false
    }

    # Validate branch follows naming convention
    $prefix = Get-BranchPrefix -Branch $Branch

    if ($null -eq $prefix) {
        Write-Host ""
        Write-ColorOutput "===============================================================" "Red"
        Write-ColorOutput "           INVALID BRANCH NAMING CONVENTION                    " "Red"
        Write-ColorOutput "===============================================================" "Red"
        Write-Host ""
        Write-ErrorMsg "Branch '$Branch' does not follow required naming convention."
        Write-Info "Valid patterns:"
        Write-Host "  feat/    feature/    - Feature development" -ForegroundColor Gray
        Write-Host "  fix/     bug/        - Bug fixes" -ForegroundColor Gray
        Write-Host "  test/               - Test additions" -ForegroundColor Gray
        Write-Host "  refactor/           - Code refactoring" -ForegroundColor Gray
        Write-Host "  perf/               - Performance improvements" -ForegroundColor Gray
        Write-Host "  docs/               - Documentation" -ForegroundColor Gray
        Write-Host "  style/              - Code style changes" -ForegroundColor Gray
        Write-Host "  chore/              - Maintenance tasks" -ForegroundColor Gray
        Write-Host "  ci/                 - CI/CD changes" -ForegroundColor Gray
        Write-Host "  hotfix/             - Production hotfixes" -ForegroundColor Gray
        Write-Host "  exp/                - Experimental features" -ForegroundColor Gray
        Write-Host ""
        Write-Info "Example: git checkout -b feat/add-tests"
        Write-Host ""
        return $false
    }

    return $true
}

function Generate-HTMLReport {
    $endTime = Get-Date
    $totalDuration = ($endTime - $script:testResults.StartTime).TotalSeconds

    # Build HTML content without special characters that confuse PowerShell parser
    $html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Test Report</title><style>"
    $html += "body{font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:2rem}"
    $html += ".header{background:#1e293b;padding:2rem;border-radius:12px;margin-bottom:2rem}"
    $html += ".card{background:#1e293b;padding:1.5rem;border-radius:12px;border:1px solid #334155;margin-bottom:1rem}"
    $html += ".stat{font-size:2rem;font-weight:700;color:#10b981}"
    $html += "</style></head><body><div style='max-width:1200px;margin:0 auto'>"

    $statusText = if ($script:testResults.Success) { "PASSED" } else { "FAILED" }
    $statusColor = if ($script:testResults.Success) { "#10b981" } else { "#ef4444" }

    $html += "<div class='header'><h1>Test Workflow Report</h1>"
    $html += "<div>Branch: $($script:testResults.Branch)</div>"
    $html += "<div>Started: $($script:testResults.StartTime.ToString('yyyy-MM-dd HH:mm:ss'))</div>"
    $html += "<div>Duration: $($totalDuration.ToString('0.0'))s</div>"
    $html += "<div style='display:inline-block;padding:0.5rem 1rem;border-radius:6px;font-weight:600;background:$statusColor;color:white;margin-top:1rem'>$statusText</div></div>"

    $html += "<div class='card'><h2>Unit Tests</h2>"
    $html += "<div class='stat'>$($script:testResults.UnitTests.Passed)</div>"
    $html += "<div>Passed - $($script:testResults.UnitTests.Duration.ToString('0.0'))s</div></div>"

    $html += "<div class='card'><h2>Component Tests</h2>"
    $html += "<div class='stat'>$($script:testResults.ComponentTests.Passed)</div>"
    $html += "<div>Passed - $($script:testResults.ComponentTests.Duration.ToString('0.0'))s</div></div>"

    $html += "<div class='card'><h2>E2E Tests</h2>"
    $html += "<div class='stat'>$($script:testResults.E2ETests.Passed)</div>"
    $html += "<div>Passed - $($script:testResults.E2ETests.Duration.ToString('0.0'))s</div>"
    if ($script:testResults.E2ETests.Skipped -gt 0) {
        $html += "<div>Skipped: $($script:testResults.E2ETests.Skipped)</div>"
    }
    $html += "</div>"

    $html += "<div style='background:#334155;padding:1rem;border-radius:8px;margin-top:1rem'>"
    $html += "<strong>Full Text Log:</strong> <code>$logFile</code></div>"

    $html += "<div style='text-align:center;color:#64748b;margin-top:2rem;padding-top:2rem;border-top:1px solid #334155'>"
    $html += "<p>Generated by test-before-push.ps1 - $($endTime.ToString('yyyy-MM-dd HH:mm:ss'))</p></div>"
    $html += "</div></body></html>"

    $html | Out-File -FilePath $htmlFile -Encoding UTF8
    Write-Info "HTML report saved: $htmlFile"
}

function Test-TestInfrastructure {
    Write-Info "Checking test infrastructure..."

    $missingPackages = @()

    # Check for Jest
    $jestCheck = npm list jest --depth=0 2>&1
    if ($LASTEXITCODE -ne 0) {
        $missingPackages += "jest@^29.7.0"
        $missingPackages += "@types/jest@^29.5.11"
        $missingPackages += "ts-jest@^29.1.1"
        $missingPackages += "jest-environment-jsdom@^29.7.0"
    }

    # Check for Testing Library
    $tlCheck = npm list @testing-library/angular --depth=0 2>&1
    if ($LASTEXITCODE -ne 0) {
        $missingPackages += "@testing-library/angular@^17.3.1"
        $missingPackages += "@testing-library/jest-dom@^6.1.5"
        $missingPackages += "@testing-library/user-event@^14.5.1"
    }

    # Check for Playwright
    $pwCheck = npm list @playwright/test --depth=0 2>&1
    if ($LASTEXITCODE -ne 0) {
        $missingPackages += "@playwright/test@^1.40.1"
    }

    if ($missingPackages.Count -gt 0) {
        Write-Host ""
        Write-Warning2 "Missing test infrastructure detected"
        Write-Info "Required packages:"
        $missingPackages | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
        Write-Host ""

        if ($NoBootstrap) {
            Write-ErrorMsg "Bootstrap mode disabled. Please install packages manually:"
            Write-Host "  npm install --save-dev $($missingPackages -join ' ')" -ForegroundColor Gray
            return $false
        }

        Write-Info "Auto-installing missing packages..."
        Write-Host ""

        npm install --save-dev @($missingPackages)

        if ($LASTEXITCODE -ne 0) {
            Write-ErrorMsg "Failed to install test dependencies"
            return $false
        }

        Write-Success "Test dependencies installed successfully"

        # Check if Playwright browsers need installation
        $playwrightInstalled = $missingPackages | Where-Object { $_ -like "@playwright/test*" }
        if ($playwrightInstalled) {
            Write-Info "Installing Playwright browsers..."
            npx playwright install

            if ($LASTEXITCODE -ne 0) {
                Write-Warning2 "Playwright browser installation failed. E2E tests may not work."
            }
            else {
                Write-Success "Playwright browsers installed"
            }
        }

        Write-Host ""
    }
    else {
        Write-Success "Test infrastructure is ready"
    }

    return $true
}

function Invoke-UnitTests {
    Write-Header "RUNNING UNIT TESTS (Jest)"

    Write-Info "Executing: npm run test:unit"
    $startTime = Get-Date
    $output = npm run test:unit 2>&1 | Tee-Object -Variable testOutput
    $endTime = Get-Date

    $script:testResults.UnitTests.Duration = ($endTime - $startTime).TotalSeconds
    $script:testResults.UnitTests.Output = $testOutput -join "`n"

    # Parse test results from output
    if ($testOutput -match '(\d+) passed' -and $matches) {
        $script:testResults.UnitTests.Passed = [int]$matches[1]
    } else {
        $script:testResults.UnitTests.Passed = 0
    }

    if ($LASTEXITCODE -ne 0) {
        $script:testResults.UnitTests.Failed = 1
        Write-Host ""
        Write-ErrorMsg "Unit tests failed"
        Write-Host ""
        return $false
    }

    Write-Host ""
    Write-Success "Unit tests passed"
    Write-Host ""
    return $true
}

function Invoke-ComponentTests {
    Write-Header "RUNNING COMPONENT TESTS (Testing Library)"

    Write-Info "Executing: npm run test:component"
    $startTime = Get-Date
    $output = npm run test:component 2>&1 | Tee-Object -Variable testOutput
    $endTime = Get-Date

    $script:testResults.ComponentTests.Duration = ($endTime - $startTime).TotalSeconds
    $script:testResults.ComponentTests.Output = $testOutput -join "`n"

    # Parse test results from output
    if ($testOutput -match '(\d+) passed' -and $matches) {
        $script:testResults.ComponentTests.Passed = [int]$matches[1]
    } else {
        $script:testResults.ComponentTests.Passed = 0
    }

    if ($LASTEXITCODE -ne 0) {
        $script:testResults.ComponentTests.Failed = 1
        Write-Host ""
        Write-ErrorMsg "Component tests failed"
        Write-Host ""
        return $false
    }

    Write-Host ""
    Write-Success "Component tests passed"
    Write-Host ""
    return $true
}

function Start-DevServer {
    Write-Info "Starting development server in background..."

    # Start the Ionic dev server using ionic serve
    # Find the path to ionic executable
    $ionicPath = Join-Path $PWD.Path "node_modules\.bin\ionic.cmd"

    if (-not (Test-Path $ionicPath)) {
        $ionicPath = "ionic"  # Fall back to global ionic if local not found
    }

    $serverProcess = Start-Process cmd -ArgumentList "/c", "$ionicPath serve" -PassThru -WindowStyle Hidden -WorkingDirectory $PWD.Path

    Write-Info "Waiting for server to be ready on http://localhost:8100..."
    Write-Host "  (Ionic dev server typically takes 20-40 seconds to start)" -ForegroundColor Gray

    $maxAttempts = 120  # Wait up to 2 minutes for Ionic/Angular
    $attempt = 0
    $serverReady = $false

    while ($attempt -lt $maxAttempts -and -not $serverReady) {
        Start-Sleep -Seconds 1
        $attempt++

        # Check if process is still running
        if ($serverProcess.HasExited) {
            Write-ErrorMsg "Server process terminated unexpectedly (exit code: $($serverProcess.ExitCode))"
            return $null
        }

        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8100" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $serverReady = $true
            }
        }
        catch {
            # Server not ready yet, continue waiting
        }

        # Show progress every 10 seconds
        if ($attempt % 10 -eq 0) {
            Write-Host "  Still waiting... ($attempt seconds elapsed)" -ForegroundColor Gray
        }
    }

    if ($serverReady) {
        Write-Success "Dev server ready on http://localhost:8100"
        return $serverProcess
    }
    else {
        Write-ErrorMsg "Server failed to start within $maxAttempts seconds"
        if (-not $serverProcess.HasExited) {
            Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
        }
        return $null
    }
}

function Stop-DevServer {
    param($ServerProcess)

    if ($null -ne $ServerProcess) {
        Write-Info "Stopping development server..."

        # Kill the PowerShell process and all its children
        if (-not $ServerProcess.HasExited) {
            Stop-Process -Id $ServerProcess.Id -Force -ErrorAction SilentlyContinue
        }

        # Also kill any remaining node processes on port 8100
        Start-Sleep -Seconds 2
        $processesToKill = Get-NetTCPConnection -LocalPort 8100 -ErrorAction SilentlyContinue |
                          Select-Object -ExpandProperty OwningProcess -Unique

        foreach ($processId in $processesToKill) {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }

        Write-Success "Dev server stopped"
    }
}

function Invoke-E2ETests {
    Write-Header "RUNNING E2E TESTS (Playwright)"

    # Check if server is already running
    $serverAlreadyRunning = $false
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8100" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $serverAlreadyRunning = $true
            Write-Info "Dev server already running on http://localhost:8100"
        }
    }
    catch {
        # Server not running, will start it
    }

    $serverProcess = $null

    try {
        # Start server if not already running
        if (-not $serverAlreadyRunning) {
            $serverProcess = Start-DevServer

            if ($null -eq $serverProcess) {
                Write-ErrorMsg "Cannot run E2E tests without dev server"
                return $false
            }

            Write-Host ""
        }

        Write-Info "Executing: npm run test:e2e"
        Write-Host ""
        $startTime = Get-Date
        $output = & npm run test:e2e 2>&1 | Tee-Object -Variable testOutput
        $endTime = Get-Date
        Write-Host ""

        $script:testResults.E2ETests.Duration = ($endTime - $startTime).TotalSeconds
        $script:testResults.E2ETests.Output = $testOutput -join "`n"

        # Parse test results from output
        if ($testOutput -match '(\d+) passed' -and $matches) {
            $script:testResults.E2ETests.Passed = [int]$matches[1]
        } else {
            $script:testResults.E2ETests.Passed = 0
        }
        if ($testOutput -match '(\d+) skipped' -and $matches) {
            $script:testResults.E2ETests.Skipped = [int]$matches[1]
        } else {
            $script:testResults.E2ETests.Skipped = 0
        }

        if ($LASTEXITCODE -ne 0) {
            $script:testResults.E2ETests.Failed = 1
            Write-Host ""
            Write-ErrorMsg "E2E tests failed"
            Write-Host ""
            return $false
        }

        Write-Host ""
        Write-Success "E2E tests passed"

        # Open the Playwright HTML report in browser
        $reportPath = Join-Path $PWD.Path "playwright-report\index.html"
        if (Test-Path $reportPath) {
            Write-Info "Opening Playwright test report in browser..."
            Start-Process $reportPath
        }

        Write-Host ""
        return $true
    }
    finally {
        # Only stop server if we started it
        if (-not $serverAlreadyRunning -and $null -ne $serverProcess) {
            Write-Host ""
            Stop-DevServer -ServerProcess $serverProcess
        }
    }
}

function Show-TestPreview {
    param([string]$Branch, [bool]$SkipE2E)

    Write-Header "DRY-RUN PREVIEW MODE"

    Write-Info "Current Branch: $Branch"

    $prefix = Get-BranchPrefix -Branch $Branch
    $ticket = Get-TicketNumber -Branch $Branch

    if ($null -ne $prefix) {
        $prefixInfo = "Branch Type: Auto-prefix detected ($prefix"
        if ($null -ne $ticket) {
            $prefixInfo += " with scope: $ticket"
        }
        $prefixInfo += ")"
        Write-Info $prefixInfo
    }

    Write-Host ""
    Write-Info "Test Execution Plan:"
    Write-Host "  1. Jest Unit Tests (sequential)" -ForegroundColor Gray
    Write-Host "  2. Testing Library Component Tests (sequential)" -ForegroundColor Gray
    if (-not $SkipE2E) {
        Write-Host "  3. Playwright E2E Tests (sequential)" -ForegroundColor Gray
    }
    else {
        Write-Host "  3. Playwright E2E Tests [SKIPPED via -NoE2E]" -ForegroundColor DarkGray
    }

    Write-Host ""
    Write-Info "On Success:"
    Write-Host "  - Stage all changes (git add -A)" -ForegroundColor Gray

    $commitMsg = Apply-BranchPrefix -Message $Message -Branch $Branch
    Write-Host "  - Commit with message: '$commitMsg'" -ForegroundColor Gray
    Write-Host "  - Stop (no automatic push)" -ForegroundColor Gray

    Write-Host ""
    Write-Info "To execute: Remove -WhatIf flag"
    Write-Host ""
}

# ============================================================================
# MAIN SCRIPT
# ============================================================================

Write-Host ""
Write-ColorOutput "===============================================================" "Cyan"
Write-ColorOutput "           TEST AUTOMATION WORKFLOW SCRIPT                     " "Cyan"
Write-ColorOutput "           SignalsMaster - Local Testing                      " "Cyan"
Write-ColorOutput "===============================================================" "Cyan"
Write-Host ""

# Pre-flight validation
if (-not (Test-GitRepository)) {
    Write-ErrorMsg "Not a git repository"
    exit 1
}

$currentBranch = Get-CurrentBranch
$script:testResults.Branch = $currentBranch

if (-not (Test-BranchNaming -Branch $currentBranch)) {
    Stop-Transcript | Out-Null
    exit 1
}

Write-Success "Branch validation passed: $currentBranch"
Write-Host ""

# WhatIf preview mode
if ($WhatIfPreference) {
    Show-TestPreview -Branch $currentBranch -SkipE2E $NoE2E
    exit 0
}

# Bootstrap check
if (-not (Test-TestInfrastructure)) {
    Write-ErrorMsg "Test infrastructure not ready"
    exit 1
}

Write-Host ""

# Sequential test execution with fail-fast
$testsStartTime = Get-Date

# Stage 1: Unit Tests
if (-not (Invoke-UnitTests)) {
    Write-ErrorMsg "❌ Test workflow aborted at unit tests stage"
    Stop-Transcript | Out-Null
    Generate-HTMLReport
    exit 1
}

# Stage 2: Component Tests
if (-not (Invoke-ComponentTests)) {
    Write-ErrorMsg "❌ Test workflow aborted at component tests stage"
    Stop-Transcript | Out-Null
    Generate-HTMLReport
    exit 1
}

# Stage 3: E2E Tests (optional)
if (-not $NoE2E) {
    if (-not (Invoke-E2ETests)) {
        Write-ErrorMsg "❌ Test workflow aborted at E2E tests stage"
        Stop-Transcript | Out-Null
        Generate-HTMLReport
        exit 1
    }
}
else {
    Write-Info "Skipping E2E tests (-NoE2E flag set)"
    $script:testResults.E2ETests.Skipped = -1  # Indicate fully skipped
    Write-Host ""
}

$testsEndTime = Get-Date
$testsDuration = $testsEndTime - $testsStartTime

Write-Header "ALL TESTS PASSED ✅"

Write-Success "Test execution completed in $($testsDuration.TotalSeconds.ToString('0.0'))s"
Write-Host ""

# Auto-commit with conventional commit message
Write-Info "Staging changes..."
git add -A

if ($LASTEXITCODE -ne 0) {
    Write-ErrorMsg "Failed to stage changes"
    exit 1
}

$commitMsg = Apply-BranchPrefix -Message $Message -Branch $currentBranch
$script:testResults.CommitMessage = $commitMsg
$script:testResults.Success = $true

Write-Info "Committing with message: '$commitMsg'"
git commit -m $commitMsg

if ($LASTEXITCODE -ne 0) {
    Write-ErrorMsg "Failed to commit changes"
    $script:testResults.Success = $false
    Stop-Transcript | Out-Null
    Generate-HTMLReport
    exit 1
}

Write-Host ""
Write-Success "✅ Tests passed and changes committed"
Write-Host ""

Write-Info "Next steps:"
Write-Host "  - Review commit: git show HEAD" -ForegroundColor Gray
Write-Host "  - Push to remote: git push origin $currentBranch" -ForegroundColor Gray
Write-Host "  - Or use: npm run commit:push" -ForegroundColor Gray
Write-Host ""

Write-ColorOutput "===============================================================" "Green"
Write-ColorOutput "  OPERATION COMPLETE" "Green"
Write-ColorOutput "===============================================================" "Green"
Write-Host ""

# Stop transcript and generate HTML report
Stop-Transcript | Out-Null
Generate-HTMLReport

Write-Host ""
Write-Info "Reports generated:"
Write-Host "  📄 Text log: $logFile" -ForegroundColor Gray
Write-Host "  🌐 HTML report: $htmlFile" -ForegroundColor Gray
Write-Host ""
