---
description: Manual workflow for code review focusing on code quality, security, and architecture
auto_execution_mode: 1
---

# Code Review Workflow

## Quick Start
Manual workflow for code review focusing on code quality, security, and architecture.

## Change Detection

### Quick Script
```bash
#!/bin/bash
CURRENT_BRANCH=$(git branch --show-current)

if [[ "$CURRENT_BRANCH" == "master" ]] || [[ "$CURRENT_BRANCH" == version/* ]]; then
    # Scenario 1: master/version branches - only staged/unstaged
    echo "Files to review:"
    (git diff --cached --name-only; git diff --name-only) | sort -u
else
    # Scenario 2: feature branches - all changes since branching
    PARENT_BRANCH=$(git show-branch | grep '*' | grep -v "$CURRENT_BRANCH" | head -n1 | sed 's/.*\[\(.*\)\].*/\1/' | sed 's/[\^~].*//')
    [[ -z "$PARENT_BRANCH" ]] && PARENT_BRANCH="master"

    MERGE_BASE=$(git merge-base HEAD $PARENT_BRANCH)
    echo "Files to review:"
    (git diff --name-only $MERGE_BASE..HEAD; git diff --cached --name-only; git diff --name-only) | sort -u
fi
```

**Manual override:** Replace `PARENT_BRANCH="master"` with actual parent branch if auto-detection fails.

## Review Categories

### 1. Security ⚠️ CRITICAL
- [ ] No hardcoded secrets/credentials
- [ ] Input validation and sanitization
- [ ] Secure data storage/transmission
- [ ] Proper authentication/authorization

### 2. Code Quality 🔍 HIGH
- [ ] CodeStyle compliance (`.windsurf/rules`)
- [ ] Naming conventions
- [ ] Code readability and structure
- [ ] SOLID principles adherence

### 3. Architecture & Design 🏗️ HIGH
- [ ] Architectural patterns (MVVM/MVP)
- [ ] Separation of concerns
- [ ] Dependency injection
- [ ] Module boundaries

### 4. Performance & Resources ⚡ HIGH
- [ ] Memory management and leak prevention
- [ ] Thread safety
- [ ] Resource cleanup
- [ ] Efficient data structures

### 5. Platform-Specific 📱 MEDIUM
- [ ] **Android/iOS**: Platform guidelines, lifecycle management
- [ ] **Native**: Memory safety, RAII principles
- [ ] **Cross-platform**: Proper abstraction

## 🚨 Critical Red Flags
- Hardcoded credentials/secrets
- Memory leaks or thread safety violations
- Security vulnerabilities
- Style guide violations
- Poor error handling

## Quick Checklist
```markdown
- [ ] Security: No secrets, proper validation
- [ ] Code Quality: Style compliance, readability
- [ ] Architecture: Pattern adherence, separation
- [ ] Performance: Memory management, threading
- [ ] Platform: Guidelines compliance
```

## Approval Requirements
- Minimum 2 approvals for production
- Security reviewer for security changes
- Platform specialist for platform-specific code
