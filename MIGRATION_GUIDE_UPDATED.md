# Migration Guide - Payment System Setup (Updated)

## ⚠️ Important: Shared Function Issue Resolved

The error you encountered is because `update_updated_at_column()` is a shared function used by multiple tables in your system. We've created a safer approach.

## 🚀 Recommended Approach

### Step 1: Use the Final Migration

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Execute the Final Migration**
   - Copy the entire contents of `005_payments_subscriptions_final.sql`
   - Paste into the SQL Editor
   - Click **Run**

3. **What This Does**
   - ✅ Preserves existing shared functions
   - ✅ Only creates the function if it doesn't exist
   - ✅ Handles all existing policies safely
   - ✅ Creates all payment tables and functions

## 🔧 If You Need to Reset

### Option A: Safe Cleanup (Recommended)

If you need to clean up payment tables only:

1. **Run Safe Cleanup**
   ```sql
   -- Copy contents of cleanup_payments_safe.sql and run it
   ```

2. **Then Run Final Migration**
   ```sql
   -- Copy contents of 005_payments_subscriptions_final.sql and run it
   ```

### Option B: Skip Cleanup (Easiest)

The final migration is designed to handle existing objects, so you can often just run:

```sql
-- Copy contents of 005_payments_subscriptions_final.sql and run it directly
```

## 📋 Files Available

1. **`005_payments_subscriptions_final.sql`** ⭐ **Use This One**
   - Handles shared functions properly
   - Safe to run multiple times
   - Preserves existing system functions

2. **`cleanup_payments_safe.sql`** 
   - Safe cleanup that preserves shared functions
   - Only use if you need to reset payment tables

3. **`cleanup_payments.sql`** ❌ **Don't Use**
   - This one causes the shared function error

## ✅ What the Final Migration Does

### Smart Function Handling
```sql
-- Only creates the function if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE FUNCTION update_updated_at_column() ...
    END IF;
END $$;
```

### Safe Policy Management
```sql
-- Drops and recreates policies safely
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments" ON payments ...
```

### Complete System Setup
- ✅ 4 payment tables
- ✅ 4 subscription functions  
- ✅ All RLS policies
- ✅ All indexes and triggers
- ✅ Preserves existing system functions

## 🎯 Expected Success Message

After running the final migration, you should see:

```
NOTICE: Payment and subscription system migration completed successfully!
NOTICE: Tables created: payments, subscriptions, subscription_usage, payment_webhooks
NOTICE: Functions created: check_user_subscription, record_subscription_usage, cancel_subscription, expire_subscriptions
NOTICE: All RLS policies and indexes have been applied.
```

## 🚨 Troubleshooting

### If You Still Get Errors

1. **Check which tables exist**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('payments', 'subscriptions', 'subscription_usage', 'payment_webhooks');
   ```

2. **Check which functions exist**
   ```sql
   SELECT proname FROM pg_proc 
   WHERE proname IN ('check_user_subscription', 'record_subscription_usage', 'cancel_subscription', 'expire_subscriptions');
   ```

3. **If you see conflicts, run the safe cleanup first**

## 🎉 After Successful Migration

Your system will have:

- **Complete Payment Processing** with PesaPal
- **Advanced Subscription Management** 
- **Real-time Usage Tracking**
- **Professional Receipt Generation**
- **All existing functions preserved**

The final migration is designed to work with your existing system without breaking anything! 🚀

## 💡 Key Difference

**Old approach:** Tried to drop shared functions (caused errors)
**New approach:** Preserves shared functions, only adds what's needed

Run `005_payments_subscriptions_final.sql` and you should be all set! ✅