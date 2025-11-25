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

    # Map branch patterns to conventional commit prefixes
    $prefixMap = @{
        'feat/'     = 'feat: '
        'feature/'  = 'feat: '
        'hotfix/'   = 'hotfix: '
        'bug/'      = 'fix: '
        'fix/'      = 'fix: '
        'refactor/' = 'refactor: '
        'perf/'     = 'perf: '
        'docs/'     = 'docs: '
        'ci/'       = 'ci: '
        'exp/'      = 'chore: '
        'test/'     = 'test: '
        'style/'    = 'style: '
        'chore/'    = 'chore: '
    }

    foreach ($pattern in $prefixMap.Keys) {
        if ($Branch -like "$pattern*") {
            return $prefixMap[$pattern]
        }
    }

    return $null
}

function Apply-BranchPrefix {
    param(
        [string]$Message,
        [string]$Branch
    )

    $prefix = Get-BranchPrefix -Branch $Branch

    if ($null -eq $prefix) {
        return $Message
    }

    # Check if message already has a conventional commit prefix
    $conventionalPrefixes = @('feat:', 'fix:', 'docs:', 'style:', 'refactor:', 'perf:', 'test:', 'build:', 'ci:', 'chore:', 'revert:', 'hotfix:')
    $hasPrefix = $false

    foreach ($convPrefix in $conventionalPrefixes) {
        if ($Message -like "$convPrefix*") {
            $hasPrefix = $true
            break
        }
    }

    if (-not $hasPrefix) {
        return "$prefix$Message"
    }

    return $Message
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

    # Show branch type
    $prefix = Get-BranchPrefix -Branch $Branch
    if ($null -ne $prefix) {
        Write-Info "Branch Type: Auto-prefix detected ($prefix)"
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
    exit 1
}

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
    exit 1
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
        exit 1
    }

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
