# RFITrak - Enterprise RFI Management System

A comprehensive web application for generating, tracking, and managing Request for Information (RFI) documents in construction and project management environments.

## Features

### Core Functionality
- **Multi-tenant RFI creation and tracking** - Complete RFI lifecycle management
- **Project management integration** - Link RFIs to specific projects and contracts  
- **Role-based access control** - Owner, Admin, RFI User, View Only, and Client roles
- **Client collaboration tools** - Secure client access for RFI responses
- **Document management** - Attachment handling and document templates

### Security & Enterprise Features
- **Enterprise-grade security** - Row Level Security (RLS) with 100% test coverage
- **Multi-tenant data isolation** - Complete company data separation
- **Anonymous access protection** - Zero unauthorized data access
- **Role-based permissions** - Granular permission system with UI enforcement
- **Audit-ready compliance** - Security implementation meets enterprise standards

### User Experience
- **Modern responsive UI** - Built with Next.js and Tailwind CSS
- **Real-time updates** - Live RFI status tracking and notifications
- **Print-ready outputs** - Professional RFI document generation
- **Email integration** - Automated notifications and email templates
- **Dashboard analytics** - Project and RFI performance insights

## Documentation

- **[Security Implementation](docs/RLS_SECURITY_IMPLEMENTATION.md)** - Enterprise RLS security details
- **[Database Schema](docs/DATABASE_SCHEMA.md)** - Complete database structure reference
- **[Settings Reference](docs/SETTINGS_REFERENCE.md)** - Configuration and permissions guide
- **[Security Recommendations](docs/SECURITY_RECOMMENDATIONS.md)** - Security best practices
- **[Read-Only User Setup](README-READONLY-USERS.md)** - Client and stakeholder access guide

## Technology Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Supabase (PostgreSQL)
- **Authentication:** Supabase Auth with Row Level Security
- **Testing:** Jest, React Testing Library, Playwright
- **Deployment:** Vercel-ready with Supabase integration

## Security Status
✅ **Production Ready** - Enterprise-grade security implementation complete  
✅ **RLS Protected** - 15/15 database tables secured with Row Level Security  
✅ **Multi-tenant** - Complete company data isolation  
✅ **100% Test Coverage** - Comprehensive security validation  

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure Supabase environment variables
4. Run development server: `npm run dev`
5. Access admin panel to set up users and projects

## Recent Updates

**June 13, 2025** - Major code cleanup and documentation updates
- Removed deprecated scripts and test files
- Updated all documentation with current script references
- Streamlined codebase for production deployment

**December 2024** - Enterprise Security Implementation
- Complete Row Level Security (RLS) implementation
- Multi-tenant data isolation
- Anonymous access protection
- Comprehensive security testing suite

---

*RFITrak provides enterprise-grade RFI management with security, scalability, and user experience as core priorities.*
