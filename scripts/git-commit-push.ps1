<#
.SYNOPSIS
    Automated Git commit and push script with branch-aware prefixing and production deployment warnings.

.DESCRIPTION
    This script automates the git workflow by:
    - Auto-staging all files (git add -A)
    - Prompting for commit message and optional description
    - Auto-prefixing commit messages based on branch naming conventions
    - Warning before committing/pushing to master/main (triggers production deployment)
    - Respecting existing Husky security hooks (pre-commit and pre-push with Gitleaks)
    - Supporting dry-run preview mode with -WhatIf

.PARAMETER Message
    The commit message. If not provided, prompts interactively.

.PARAMETER Description
    Optional extended commit description (second paragraph).

.PARAMETER Push
    Automatically push to remote after successful commit.

.PARAMETER Force
    Bypass git hooks with --no-verify (NOT RECOMMENDED - bypasses security checks).

.PARAMETER WhatIf
    Preview what would happen without executing git commands (dry-run mode).

.PARAMETER NoBranchCheck
    Skip the master/main branch protection warnings.

.EXAMPLE
    .\git-commit-push.ps1
    Interactive mode - prompts for commit message

.EXAMPLE
    .\git-commit-push.ps1 -Message "Add new feature" -Push
    Commit with message and push to current branch

.EXAMPLE
    .\git-commit-push.ps1 -WhatIf
    Preview staged files and commit details without executing

.EXAMPLE
    .\git-commit-push.ps1 -Message "Update docs" -Description "Added API documentation" -Push
    Commit with message and description, then push

.NOTES
    Author: SignalsMaster Team
    Date: November 25, 2025
    Version: 1.0.0
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory=$false, HelpMessage="Commit message")]
    [string]$Message,

    [Parameter(Mandatory=$false, HelpMessage="Optional extended commit description")]
    [string]$Description,

    [Parameter(Mandatory=$false, HelpMessage="Automatically push after commit")]
    [switch]$Push,

    [Parameter(Mandatory=$false, HelpMessage="Bypass git hooks (NOT RECOMMENDED)")]
    [switch]$Force,

    [Parameter(Mandatory=$false, HelpMessage="Skip master/main branch protection warnings")]
    [switch]$NoBranchCheck
)

# ============================================================================
# LOGGING SETUP
# ============================================================================

$timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
$logsDir = Join-Path $PSScriptRoot "..\logs"
$logFile = Join-Path $logsDir "git-push-$timestamp.log"
$htmlFile = Join-Path $logsDir "git-push-$timestamp.html"

# Ensure logs directory exists
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

# Start transcript for full text log
Start-Transcript -Path $logFile -Append | Out-Null

# Script-level variables for HTML report
$script:gitResults = @{
    StartTime = Get-Date
    Branch = ""
    CommitMessage = ""
    CommitDescription = ""
    FilesChanged = 0
    Insertions = 0
    Deletions = 0
    Pushed = $false
    HooksRan = $true
    Success = $false
}

# ============================================================================
# HELPER FUNCTIONS
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
    Write-ColorOutput "═══════════════════════════════════════════════════════════════" "Cyan"
    Write-ColorOutput "  $Text" "Cyan"
    Write-ColorOutput "═══════════════════════════════════════════════════════════════" "Cyan"
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

function Get-GitStatus {
    $status = git status --short
    return $status
}

function Get-CurrentBranch {
    $branch = git branch --show-current
    return $branch.Trim()
}

function Get-BranchPrefix {
    param([string]$Branch)

    # Map branch patterns to conventional commit prefixes (without colon for scope support)
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

    # Extract ticket/issue numbers from branch names
    # Matches patterns like: alpha-2411-008, JIRA-123, PROJ-456, etc.
    # Looks for word-number combinations separated by hyphens

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

    # Check if message already has a conventional commit prefix with or without scope
    $conventionalPrefixes = @('feat:', 'feat(', 'fix:', 'fix(', 'docs:', 'docs(', 'style:', 'style(', 'refactor:', 'refactor(', 'perf:', 'perf(', 'test:', 'test(', 'build:', 'build(', 'ci:', 'ci(', 'chore:', 'chore(', 'revert:', 'revert(', 'hotfix:', 'hotfix(', 'master:', 'master(', 'main:', 'main(')
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

    # Handle master/main branches - use branch name as prefix
    if ($Branch -eq "master" -or $Branch -eq "main") {
        $formattedMessage = "$Branch" + ": $Message"
        return $formattedMessage
    }

    # Handle feature branches with conventional commit prefixes
    if ($null -ne $prefix) {
        # Build the prefix with optional scope (ticket number)
        if ($null -ne $ticket) {
            $formattedMessage = "$prefix($ticket)" + ": $Message"
            return $formattedMessage
        }
        else {
            $formattedMessage = "$prefix" + ": $Message"
            return $formattedMessage
        }
    }

    return $Message
}

function Generate-GitHTMLReport {
    $endTime = Get-Date
    $totalDuration = ($endTime - $script:gitResults.StartTime).TotalSeconds

    # Build HTML content
    $html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Git Push Report</title><style>"
    $html += "body{font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:2rem}"
    $html += ".header{background:#1e293b;padding:2rem;border-radius:12px;margin-bottom:2rem}"
    $html += ".card{background:#1e293b;padding:1.5rem;border-radius:12px;border:1px solid #334155;margin-bottom:1rem}"
    $html += ".stat{font-size:2rem;font-weight:700;text-align:center;padding:1rem;background:#0f172a;border-radius:8px}"
    $html += "</style></head><body><div style='max-width:1000px;margin:0 auto'>"

    $statusText = if ($script:gitResults.Success) { "SUCCESS" } else { "FAILED" }
    $statusColor = if ($script:gitResults.Success) { "#10b981" } else { "#ef4444" }

    $html += "<div class='header'><h1>Git Push Report</h1>"
    $html += "<div>Branch: $($script:gitResults.Branch)</div>"
    $html += "<div>Timestamp: $($script:gitResults.StartTime.ToString('yyyy-MM-dd HH:mm:ss'))</div>"
    $html += "<div>Duration: $($totalDuration.ToString('0.0'))s</div>"
    $html += "<div style='display:inline-block;padding:0.5rem 1rem;border-radius:6px;font-weight:600;background:$statusColor;color:white;margin-top:1rem'>$statusText</div></div>"

    $html += "<div class='card'><h2>Commit Details</h2>"
    $html += "<div style='background:#0f172a;padding:1rem;border-radius:6px;border-left:4px solid #3b82f6;font-family:monospace'>$($script:gitResults.CommitMessage)</div>"
    if ($script:gitResults.CommitDescription) {
        $html += "<p style='margin-top:1rem;color:#94a3b8'>$($script:gitResults.CommitDescription)</p>"
    }
    $html += "<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:1rem'>"
    $html += "<div class='stat'>$($script:gitResults.FilesChanged)<div style='color:#94a3b8;font-size:0.85rem;margin-top:0.5rem'>Files Changed</div></div>"
    $html += "<div class='stat' style='color:#10b981'>+$($script:gitResults.Insertions)<div style='color:#94a3b8;font-size:0.85rem;margin-top:0.5rem'>Insertions</div></div>"
    $html += "<div class='stat' style='color:#ef4444'>-$($script:gitResults.Deletions)<div style='color:#94a3b8;font-size:0.85rem;margin-top:0.5rem'>Deletions</div></div>"
    $html += "</div></div>"

    $pushStatus = if ($script:gitResults.Pushed) { "Pushed to remote" } else { "Not pushed" }
    $hooksStatus = if ($script:gitResults.HooksRan) { "Security checks passed" } else { "Hooks bypassed" }

    $html += "<div class='card'><h2>Operation Status</h2>"
    $html += "<div>$pushStatus</div><div>$hooksStatus</div></div>"

    $html += "<div style='background:#334155;padding:1rem;border-radius:8px'>"
    $html += "<strong>Full Text Log:</strong> <code>$logFile</code></div>"

    $html += "<div style='text-align:center;color:#64748b;margin-top:2rem;padding-top:2rem;border-top:1px solid #334155'>"
    $html += "<p>Generated by git-commit-push.ps1 - $($endTime.ToString('yyyy-MM-dd HH:mm:ss'))</p></div>"
    $html += "</div></body></html>"

    $html | Out-File -FilePath $htmlFile -Encoding UTF8
    Write-Info "HTML report saved: $htmlFile"
}

function Show-Preview {
    param(
        [string]$Branch,
        [string]$Message,
        [string]$Description,
        [bool]$WillPush
    )

    Write-Header "DRY-RUN PREVIEW MODE"

    Write-Info "Current Branch: $Branch"

    # Show branch type and ticket number
    if ($Branch -eq "master" -or $Branch -eq "main") {
        $branchPrefix = "$Branch" + ":"
        Write-Info "Branch Type: Production branch - will prefix with '$branchPrefix'"
    }
    else {
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
    }

    # Check if master/main
    if ($Branch -eq "master" -or $Branch -eq "main") {
        Write-Warning2 "WARNING: This is the PRODUCTION branch!"
        Write-Warning2 "    Pushing to '$Branch' will trigger automatic Firebase deployment"
    }

    Write-Host ""
    Write-ColorOutput "Files to be staged:" "Yellow"
    $status = Get-GitStatus
    if ($status) {
        $status | ForEach-Object {
            Write-Host "  $_"
        }
    }
    else {
        Write-ColorOutput "  (no changes detected)" "Gray"
    }

    Write-Host ""
    Write-ColorOutput "Final commit message:" "Yellow"
    Write-Host "  $Message"

    if ($Description) {
        Write-Host ""
        Write-ColorOutput "Commit description:" "Yellow"
        Write-Host "  $Description"
    }

    Write-Host ""
    if ($WillPush) {
        Write-ColorOutput "Actions that would be executed:" "Yellow"
        Write-Host "  1. git add -A"
        Write-Host "  2. git commit -m `"$Message`"" -NoNewline
        if ($Description) { Write-Host " -m `"$Description`"" -NoNewline }
        Write-Host ""
        Write-Host "  3. git push origin $Branch"

        if ($Branch -eq "master" -or $Branch -eq "main") {
            Write-Host "  4. 🚀 Firebase production deployment triggered (via GitHub Actions)"
        }
    }
    else {
        Write-ColorOutput "Actions that would be executed:" "Yellow"
        Write-Host "  1. git add -A"
        Write-Host "  2. git commit -m `"$Message`"" -NoNewline
        if ($Description) { Write-Host " -m `"$Description`"" -NoNewline }
        Write-Host ""
        Write-Host "  3. (push not requested)"
    }

    Write-Host ""
    Write-Info "Run without -WhatIf to execute these actions"
}

function Confirm-MasterBranch {
    param([string]$Branch)

    if ($Branch -eq "master" -or $Branch -eq "main") {
        Write-Host ""
        Write-ColorOutput "╔═══════════════════════════════════════════════════════════════╗" "Red"
        Write-ColorOutput "║                    PRODUCTION WARNING                         ║" "Red"
        Write-ColorOutput "╚═══════════════════════════════════════════════════════════════╝" "Red"
        Write-Host ""
        Write-Warning2 "You are about to commit to the '$Branch' branch!"
        Write-Warning2 "Pushing to this branch will trigger:"
        Write-Warning2 "  -> Automatic Firebase production deployment"
        Write-Warning2 "  -> GitHub Actions security scanning"
        Write-Warning2 "  -> Live environment updates"
        Write-Host ""

        $confirmation = Read-Host "Are you sure you want to continue? (yes/no)"

        if ($confirmation -ne "yes" -and $confirmation -ne "y") {
            Write-Info "Operation cancelled by user"
            exit 0
        }

        Write-Host ""
    }
}

# ============================================================================
# MAIN SCRIPT EXECUTION
# ============================================================================

Write-Header "Git Commit & Push Automation"

# Validate we're in a git repository
if (-not (Test-GitRepository)) {
    Write-ErrorMsg "Not a git repository. Please run this script from within a git repository."
    exit 1
}

# Get current branch
$currentBranch = Get-CurrentBranch
if (-not $currentBranch) {
    Write-ErrorMsg "Could not determine current branch."
    Stop-Transcript | Out-Null
    exit 1
}

$script:gitResults.Branch = $currentBranch
Write-Info "Current branch: $currentBranch"

# Check for changes
$gitStatus = Get-GitStatus
if (-not $gitStatus -and -not $WhatIfPreference) {
    Write-Warning2 "No changes detected in working directory."
    $proceed = Read-Host "Do you want to continue anyway? (yes/no)"
    if ($proceed -ne "yes" -and $proceed -ne "y") {
        Write-Info "Operation cancelled"
        exit 0
    }
}

# Master/main branch protection warning (unless -NoBranchCheck)
if (-not $NoBranchCheck -and -not $WhatIfPreference) {
    Confirm-MasterBranch -Branch $currentBranch
}

# Get commit message if not provided
if (-not $Message) {
    Write-Host ""
    Write-ColorOutput "Enter commit message:" "Yellow"
    $Message = Read-Host

    if (-not $Message -or $Message.Trim() -eq "") {
        Write-ErrorMsg "Commit message cannot be empty."
        exit 1
    }
}

# Get optional description if not provided
if (-not $Description) {
    Write-Host ""
    Write-ColorOutput "Enter optional description (press Enter to skip):" "Yellow"
    $Description = Read-Host
}

# Apply branch-aware prefix
$originalMessage = $Message
$Message = Apply-BranchPrefix -Message $Message -Branch $currentBranch

if ($Message -ne $originalMessage) {
    Write-Info "Auto-prefixed message: $Message"
}

# WhatIf mode - preview and exit
if ($WhatIfPreference) {
    Show-Preview -Branch $currentBranch -Message $Message -Description $Description -WillPush $Push
    exit 0
}

# ============================================================================
# EXECUTE GIT COMMANDS
# ============================================================================

Write-Host ""
Write-Header "Executing Git Commands"

# Stage all files
Write-Info "Staging all files (git add -A)..."
git add -A

if ($LASTEXITCODE -ne 0) {
    Write-ErrorMsg "Failed to stage files."
    exit 1
}

Write-Success "Files staged successfully"

# Commit with message and optional description
Write-Host ""
Write-Info "Committing changes..."

$commitArgs = @("-m", $Message)

if ($Description -and $Description.Trim() -ne "") {
    $commitArgs += @("-m", $Description)
}

if ($Force) {
    Write-Warning2 "FORCING COMMIT - Bypassing security hooks!"
    Write-Warning2 "    This will skip Gitleaks and other pre-commit checks"
    $commitArgs += "--no-verify"
}

& git commit @commitArgs

if ($LASTEXITCODE -ne 0) {
    Write-ErrorMsg "Commit failed!"
    Write-Host ""
    Write-Warning2 "This may be due to:"
    Write-Warning2 "  -> Pre-commit hooks detected issues (Gitleaks found secrets)"
    Write-Warning2 "  -> Commit message validation failed"
    Write-Warning2 "  -> No changes to commit"
    Write-Host ""
    Write-Info "Review the error messages above and fix any issues"
    Write-Info "Use -Force to bypass hooks (NOT RECOMMENDED for security reasons)"
    $script:gitResults.Success = $false
    $script:gitResults.HooksRan = -not $Force
    Stop-Transcript | Out-Null
    Generate-GitHTMLReport
    exit 1
}

# Capture commit stats
$script:gitResults.CommitMessage = $Message
$script:gitResults.CommitDescription = $Description
$script:gitResults.HooksRan = -not $Force

$commitStats = git show --stat --format="" HEAD
if ($commitStats -match '(\d+) files? changed') {
    $script:gitResults.FilesChanged = [int]$matches[1]
}
if ($commitStats -match '(\d+) insertions?') {
    $script:gitResults.Insertions = [int]$matches[1]
}
if ($commitStats -match '(\d+) deletions?') {
    $script:gitResults.Deletions = [int]$matches[1]
}

Write-Success "Commit successful!"
Write-Host ""

# Push to remote if requested
if ($Push) {
    # Additional warning for master/main push
    if (($currentBranch -eq "master" -or $currentBranch -eq "main") -and -not $NoBranchCheck) {
        Write-Host ""
        Write-ColorOutput "╔═══════════════════════════════════════════════════════════════╗" "Yellow"
        Write-ColorOutput "║           PRODUCTION DEPLOYMENT WILL BE TRIGGERED             ║" "Yellow"
        Write-ColorOutput "╚═══════════════════════════════════════════════════════════════╝" "Yellow"
        Write-Host ""

        $pushConfirm = Read-Host "Push to '$currentBranch' and deploy to production? (yes/no)"

        if ($pushConfirm -ne "yes" -and $pushConfirm -ne "y") {
            Write-Info "Push cancelled. Commit is saved locally."
            Write-Info "You can push later with: git push origin $currentBranch"
            exit 0
        }
    }

    Write-Info "Pushing to remote (git push origin $currentBranch)..."

    if ($Force) {
        git push origin $currentBranch --no-verify
    }
    else {
        git push origin $currentBranch
    }

    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "Push failed!"
        Write-Host ""
        Write-Warning2 "This may be due to:"
        Write-Warning2 "  -> Pre-push hooks detected issues (Gitleaks found secrets)"
        Write-Warning2 "  -> Network connectivity issues"
        Write-Warning2 "  -> Remote rejected the push"
        Write-Warning2 "  -> Branch protection rules"
        Write-Host ""
        Write-Info "Your commit is saved locally"
        Write-Info "You can try pushing again later with: git push origin $currentBranch"
        $script:gitResults.Success = $false
        $script:gitResults.Pushed = $false
        Stop-Transcript | Out-Null
        Generate-GitHTMLReport
        exit 1
    }

    $script:gitResults.Pushed = $true
    Write-Success "Push successful!"

    # Show deployment notice for master/main
    if ($currentBranch -eq "master" -or $currentBranch -eq "main") {
        Write-Host ""
        Write-ColorOutput "╔═══════════════════════════════════════════════════════════════╗" "Green"
        Write-ColorOutput "║              PRODUCTION DEPLOYMENT INITIATED             ║" "Green"
        Write-ColorOutput "╚═══════════════════════════════════════════════════════════════╝" "Green"
        Write-Host ""
        Write-Success "GitHub Actions will now:"
        Write-Success "  - Run security scans (Gitleaks, TruffleHog)"
        Write-Success "  - Build production bundle"
        Write-Success "  - Deploy to Firebase Hosting"
        Write-Host ""
        Write-Info "Monitor deployment: https://github.com/mjsamaha/SignalsMaster/actions"
    }
}
else {
    Write-Info "Commit successful (not pushed)"
    Write-Info "To push later, run: git push origin $currentBranch"
}

Write-Host ""
Write-Header "Operation Complete"

# Generate reports
$script:gitResults.Success = $true
Stop-Transcript | Out-Null
Generate-GitHTMLReport

Write-Host ""
Write-Info "Reports generated:"
Write-Host "  📄 Text log: $logFile" -ForegroundColor Gray
Write-Host "  🌐 HTML report: $htmlFile" -ForegroundColor Gray
Write-Host ""
