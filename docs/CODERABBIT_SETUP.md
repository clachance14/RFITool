# CodeRabbit Setup Guide for RFITrak

This guide covers setting up and using CodeRabbit for AI-powered code reviews in the RFITrak project.

## Overview

CodeRabbit provides automated code reviews both in your IDE and on GitHub PRs, with custom configuration for RFITrak's enterprise security and construction industry requirements.

## IDE Setup (Cursor/VS Code)

### 1. Install the Extension

**For Cursor:**
1. Open Cursor
2. Press `Ctrl+Shift+X` (or `Cmd+Shift+X` on Mac) to open Extensions
3. Search for "CodeRabbit"
4. Install the extension by CodeRabbit Inc.

**For VS Code:**
1. Open VS Code
2. Go to Extensions marketplace
3. Search for "CodeRabbit"
4. Install the official CodeRabbit extension

### 2. Configure the Extension

1. Go to **Settings** → **Extensions** → **CodeRabbit**
2. Configure these settings:
   - **Agent Type**: `Cursor` (for Cursor) or `Clipboard` (for manual copy-paste)
   - **Auto Review Mode**: `Prompt` (recommended) or `Auto` for continuous reviews
   - **Review Timeout**: `20` seconds (default)

### 3. Start Using

- **Real-time Reviews**: CodeRabbit automatically reviews your code as you commit
- **On-demand Reviews**: Right-click in editor → "CodeRabbit Review"
- **Fix Suggestions**: Use one-click fixes for suggested improvements

## GitHub Integration

### 1. Install GitHub App

1. Visit: https://github.com/apps/coderabbit-ai
2. Click "Install"
3. Select your RFITrak repository
4. Grant necessary permissions

### 2. Repository Configuration

The repository is pre-configured with:
- **`.coderabbit.yaml`** - Main configuration file
- **`.github/workflows/coderabbit.yml`** - GitHub Actions workflow

### 3. PR Reviews

Once configured:
- All new PRs get automatic CodeRabbit reviews
- Reviews appear as comments with suggestions
- You can chat with CodeRabbit for clarifications
- Reviews focus on security, performance, and RFITrak-specific patterns

## Configuration Details

### Security Focus Areas

CodeRabbit is configured to prioritize:
- **RLS Policy Verification** - Ensures database queries respect Row Level Security
- **SQL Injection Prevention** - Flags potentially vulnerable database queries
- **Authentication Checks** - Verifies proper auth in protected routes
- **Input Validation** - Ensures proper sanitization of user inputs
- **Multi-tenant Isolation** - Validates company data separation

### Performance Optimization

Reviews check for:
- **React Performance** - Unnecessary re-renders, missing optimizations
- **Next.js Best Practices** - App router usage, optimization patterns
- **Bundle Size** - Identifies large imports and optimization opportunities
- **Database Efficiency** - Flags N+1 queries and inefficient patterns

### RFITrak-Specific Rules

Special attention to:
- **RFI Component Patterns** - Loading states, error handling, TypeScript typing
- **Admin Security** - Admin-only features properly secured
- **Client Integration** - Secure external access and document handling
- **Cost Tracking** - Proper validation and calculation patterns
- **Notification System** - Real-time updates and proper event handling

## File-Specific Review Guidelines

### API Routes (`src/app/api/**`)
- **CRITICAL**: All routes must implement RLS security
- Input validation and sanitization required
- Proper error handling without information leakage
- Authentication and authorization checks

### RFI Components (`src/components/rfi/**`)
- Loading and error states properly handled
- TypeScript interfaces correctly defined
- Form validation and data integrity
- Role-based UI rendering

### Admin Components (`src/components/admin/**`)
- Admin-only features properly secured
- Dangerous operations require confirmation
- Audit logging for admin actions
- Proper role-based access control

### Hooks (`src/hooks/**`)
- Proper cleanup to prevent memory leaks
- Correct dependency arrays
- TypeScript return types and generics
- Race condition handling

## Best Practices

### Working with CodeRabbit Reviews

1. **Read Context**: CodeRabbit understands your entire codebase
2. **Ask Questions**: Use the chat feature for clarifications
3. **Learn from Feedback**: Reviews are educational opportunities
4. **Security First**: Pay special attention to security-related suggestions
5. **Performance Matters**: Consider optimization suggestions seriously

### Customizing Reviews

You can modify the configuration in `.coderabbit.yaml` to:
- Add new file patterns
- Update security rules
- Modify performance thresholds
- Add industry-specific guidelines

### Integration with Development Workflow

- **Before Committing**: Use IDE reviews to catch issues early
- **During PR**: Let CodeRabbit provide comprehensive analysis
- **After Feedback**: Address suggestions before merging
- **Learning**: Use CodeRabbit insights to improve coding practices

## Troubleshooting

### Common Issues

**Extension Not Working:**
- Verify extension is installed and enabled
- Check internet connection for API access
- Ensure proper permissions in IDE settings

**No PR Reviews:**
- Verify GitHub App is installed on repository
- Check repository permissions
- Ensure workflow file is properly configured

**Rate Limits:**
- Free tier has usage limits
- Consider upgrading for higher limits
- IDE reviews have separate rate limits from PR reviews

### Getting Help

- **Community Support**: Join CodeRabbit Discord server
- **Documentation**: https://docs.coderabbit.ai
- **RFITrak Issues**: Use project GitHub issues for RFITrak-specific problems

## Benefits for RFITrak

### Security Enhancement
- Catches RLS policy violations before production
- Prevents SQL injection vulnerabilities
- Validates authentication and authorization logic

### Code Quality
- Maintains TypeScript strict compliance
- Ensures React best practices
- Validates proper error handling patterns

### Performance Optimization
- Identifies React performance issues
- Suggests Next.js optimizations
- Flags bundle size problems

### Consistency
- Enforces coding standards across team
- Maintains architectural patterns
- Ensures documentation completeness

### Learning and Growth
- Educational feedback for developers
- Industry-specific guidance
- Best practice recommendations

---

**CodeRabbit helps RFITrak maintain its enterprise-grade quality standards while accelerating development velocity and improving code security.** 