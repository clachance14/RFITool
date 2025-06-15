# Production Deployment Guide
*Complete guide for deploying RFITrak to production*

## 🚀 Pre-Deployment Checklist

### ✅ **Code Quality & Testing**
- [x] All E2E tests passing (comprehensive-rfi-lifecycle.spec.ts)
- [x] Authentication tests passing (basic-authentication-test.spec.ts)  
- [x] Manual testing completed
- [x] Debug files removed
- [x] Code cleaned for production

### ✅ **Environment Setup**
- [ ] Production Supabase project created
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] RLS policies enabled
- [ ] Test users created (optional)

### ✅ **Security Verification**
- [x] Row Level Security (RLS) enabled on all tables
- [x] Multi-tenant data isolation confirmed
- [x] Anonymous access blocked
- [x] Role-based permissions tested

## 🔧 **Deployment Steps**

### 1. **Supabase Production Setup**

#### Create Production Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project for production
3. Note down the project URL and anon key
4. Create database password

#### Deploy Schema
```sql
-- Run essential setup scripts in order:
-- 1. Basic schema (if not auto-created)
-- 2. scripts/create-auth-users.sql (for initial users)
-- 3. Any custom migration scripts
```

#### Configure RLS Policies
```sql
-- Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- Should return no rows (all tables should have RLS enabled)
```

### 2. **Environment Configuration**

#### Production Environment Variables
```bash
# .env.production.local or deployment platform
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Email service
NEXT_PUBLIC_ENABLE_EMAILS=true
```

#### Vercel Deployment (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Add environment variables via Vercel dashboard
```

#### Alternative Deployment Platforms
- **Netlify**: Supported with Next.js
- **Railway**: Good for Node.js applications  
- **DigitalOcean App Platform**: Full-stack deployment
- **AWS Amplify**: Enterprise-grade hosting

### 3. **Post-Deployment Verification**

#### Test Core Functionality
1. **Authentication Test**
   ```bash
   # Run verification test
   npx playwright test tests/e2e/verify-production-data.spec.ts
   ```

2. **Manual Verification**
   - Login with admin credentials
   - Create a test project
   - Create a test RFI
   - Verify data persistence
   - Test role-based access

3. **Performance Check**
   - Page load times < 3 seconds
   - Database queries < 100ms
   - No console errors

## 🔐 **Initial User Setup**

### Create First Admin User
```sql
-- Option 1: Use existing test user
-- admin@testcompany.local / TestPass123!

-- Option 2: Create new admin via Supabase Auth UI
-- Then run: scripts/complete-app-owner-setup.sql
```

### Add Additional Users
```sql
-- Use scripts/create-auth-users.sql as template
-- Modify for your actual users and company
```

## 📊 **Production Monitoring**

### Essential Monitoring
- **Supabase Dashboard**: Monitor database performance
- **Vercel Analytics**: Track page performance  
- **Error Logging**: Monitor application errors
- **User Activity**: Track usage patterns

### Performance Metrics
- **Database**: Query performance, connection count
- **Frontend**: Core Web Vitals, loading times
- **API**: Response times, error rates

## 🚨 **Troubleshooting**

### Common Issues

#### "Database error querying schema"
- **Cause**: RLS policies too restrictive
- **Fix**: Check RLS policies, verify user permissions
- **Debug**: Use `scripts/archive/simple-diagnostic.sql`

#### "User not authenticated"  
- **Cause**: Session management or Auth configuration
- **Fix**: Verify Supabase Auth settings
- **Debug**: Check browser console for Auth errors

#### "Permission denied"
- **Cause**: User not assigned to company/role
- **Fix**: Update company_users table
- **Debug**: Use `scripts/auth-data-check.sql`

### Support Scripts
Located in `scripts/archive/` (use if needed):
- `simple-diagnostic.sql` - Basic connectivity test
- `auth-data-check.sql` - User permission verification
- `check-auth-users.sql` - Auth user status check

## 📈 **Production Maintenance**

### Regular Tasks
- **Weekly**: Review error logs
- **Monthly**: Database performance check
- **Quarterly**: Security review
- **As needed**: User management, feature updates

### Backup Strategy
- **Database**: Supabase automatic backups enabled
- **Code**: Git repository with proper branching
- **Environment**: Document all configuration

## 🎯 **Success Criteria**

### Production Ready When:
- [ ] All tests passing
- [ ] Manual functionality verified
- [ ] Performance targets met
- [ ] Security checklist complete
- [ ] Monitoring in place
- [ ] Users can login and use system
- [ ] Data persistence confirmed

---

## 📞 **Support**

For deployment issues:
1. Check troubleshooting section above
2. Review Supabase logs
3. Check browser console errors
4. Use diagnostic scripts if needed

**Your RFITrak application is production-ready!** 🎉 