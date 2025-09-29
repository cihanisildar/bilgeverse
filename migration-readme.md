# Period System Migration Guide

This guide explains how to migrate your existing Bilgeverse application to use the new period-based system.

## Overview

The period system allows you to organize your data by academic periods (semesters, quarters, etc.). When a new period begins, points and experience can be reset while preserving historical data.

## Migration Steps

### 1. Database Schema Migration

First, you need to apply the database schema changes. Run the Prisma migration:

```bash
npx prisma db push
```

This will add:
- `Period` model with ACTIVE/INACTIVE/ARCHIVED statuses
- `periodId` fields to all relevant tables
- Required indexes for performance

### 2. Data Migration

After the schema is updated, run the data migration script to move existing data to a legacy period:

```bash
node scripts/migrate-to-periods.js
```

This script will:
- Create a "Legacy Data" period (ARCHIVED status)
- Associate all existing data with this legacy period
- Create a new active period for the current semester
- Reset all user points and experience to 0

### 3. Update Application Code

The application code has been updated to:
- Require an active period for all new transactions
- Filter data by the active period in APIs
- Provide admin UI for period management

### 4. Admin Configuration

After migration, admins can:
- View all periods at `/admin/periods`
- Create new periods
- Activate periods (this resets user data)
- Archive old periods

## Important Notes

### Data Preservation
- **All existing data is preserved** in the legacy period
- No data is lost during migration
- You can view historical data by period

### User Data Reset
- User points and experience are reset to 0 for the new active period
- This is intentional - each period starts fresh
- Historical achievements are preserved in archived periods

### Period Management Best Practices

1. **Create periods in advance** - Set up next semester before it starts
2. **Use descriptive names** - e.g., "2024-2025 Güz Dönemi"
3. **Set proper dates** - Start and end dates help with organization
4. **Archive old periods** - Keep active periods to a minimum

### API Changes

All transaction APIs now require an active period:
- Points transactions: Associated with active period
- Experience transactions: Associated with active period
- Events: Created in active period
- Leaderboards: Show only active period data

## Rollback Plan

If you need to rollback the migration:

1. Keep a database backup before migration
2. The migration script can be modified to reverse changes
3. Contact support if issues arise

## Testing

After migration, test:
- [ ] Creating new points transactions
- [ ] Viewing leaderboards (should show reset data)
- [ ] Period management UI works
- [ ] Historical data is accessible
- [ ] Events and other features work normally

## Support

If you encounter issues:
1. Check the migration script logs
2. Verify database schema is correct
3. Ensure all APIs return period information
4. Check that active period exists