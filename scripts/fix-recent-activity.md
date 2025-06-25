# Fix Recent Activity Feed - Step by Step Guide

## Issue Summary
The recent activity feed is showing "No recent RFI activity" because:
1. The `rfi_status_logs` and `rfi_activity` tables may not exist
2. Existing RFI updates are not triggering activity logging
3. The activity tracking limit was too low (10 instead of 15)

## Solution Steps

### Step 1: Create Activity Tracking Tables
Run the following script in your Supabase SQL editor:

```sql
-- Copy the contents of scripts/create-activity-tables.sql
-- This will create the tables and triggers needed for permanent activity tracking
```

### Step 2: Run the Script in Supabase
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the `scripts/create-activity-tables.sql` script
4. Verify the tables were created successfully

### Step 3: Test the System
After running the script, the system will:
- ✅ Show the last 15 activities instead of 10
- ✅ Automatically log all RFI status changes
- ✅ Backfill existing RFIs with creation activities
- ✅ Preserve activity history permanently

### Step 4: Verify Activity Logging
1. Make any RFI status change (draft → active, etc.)
2. Refresh the dashboard
3. You should now see the activity in "Recent RFI Changes"

## Alternative: Manual Database Setup
If you prefer to run locally, use the Supabase connection string:

```bash
# Get your connection string from Supabase Dashboard > Settings > Database
# Run: psql "your-connection-string" -f scripts/create-activity-tables.sql
```

## What's Been Fixed
1. **Increased activity limit**: Now shows 15 recent activities (as requested)
2. **Automatic logging**: Database triggers now capture all RFI changes
3. **Company filtering**: Only shows activities for your company's RFIs
4. **Backfill existing data**: Creates activity records for existing RFIs
5. **Permanent storage**: Activities are now stored in the database, not just generated on-the-fly

## Expected Result
After running the script, you should see:
- Recent RFI activities from yesterday and today
- Persistent activity history that doesn't disappear
- All status changes, creation events, and updates logged
- Clean, organized activity feed with user names and timestamps

The "No recent RFI activity" message should be replaced with actual activity data. 