# Migration Guide - Payment System Setup

This guide will help you set up the payment and subscription system for ZedQuiz.

## 🚀 Quick Setup (Recommended)

### Step 1: Run the Fixed Migration

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Execute the Migration**
   - Copy the entire contents of `005_payments_subscriptions_fixed.sql`
   - Paste into the SQL Editor
   - Click **Run**

3. **Verify Success**
   - You should see: "Payment and subscription system migration completed successfully!"
   - Check that new tables appear in **Table Editor**

## 🔧 If You Encounter Errors

### Option A: Clean Reset (Safe)

If you get policy or table conflicts:

1. **Run Cleanup Script**
   ```sql
   -- Copy contents of cleanup_payments.sql and run it
   ```

2. **Then Run Migration**
   ```sql
   -- Copy contents of 005_payments_subscriptions_fixed.sql and run it
   ```

### Option B: Manual Cleanup (Advanced)

If you need to manually clean up:

```sql
-- Drop specific conflicting policies
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;

-- Then run the fixed migration
```

## 📋 What Gets Created

### Tables
- ✅ `payments` - Payment records
- ✅ `subscriptions` - Active subscriptions  
- ✅ `subscription_usage` - Daily usage tracking
- ✅ `payment_webhooks` - PesaPal webhooks

### Functions
- ✅ `check_user_subscription()` - Check subscription status
- ✅ `record_subscription_usage()` - Track usage
- ✅ `cancel_subscription()` - Handle cancellations
- ✅ `expire_subscriptions()` - Daily cleanup

### Security
- ✅ Row Level Security policies
- ✅ User data protection
- ✅ Admin-only access controls

## 🎯 After Migration

### 1. Set Up Environment Variables

Create/update your `.env` file:

```env
# PesaPal Configuration
REACT_APP_PESAPAL_CONSUMER_KEY=your_consumer_key
REACT_APP_PESAPAL_CONSUMER_SECRET=your_consumer_secret
REACT_APP_PESAPAL_SANDBOX=true
REACT_APP_PESAPAL_CALLBACK_URL=http://localhost:3000/payment-callback
REACT_APP_PESAPAL_IPN_URL=http://localhost:3000/api/pesapal-ipn
```

### 2. Test the System

1. **Start the App**
   ```bash
   npm start
   ```

2. **Test Payment Flow**
   - Register as a student
   - Go to Subscriptions page
   - Select a plan
   - Complete payment process

3. **Test Usage Tracking**
   - Take quizzes (should track usage)
   - Check usage limits
   - Verify upgrade prompts

### 3. Verify Features

- ✅ Payment processing works
- ✅ Subscription management works
- ✅ Usage tracking works
- ✅ Receipt generation works
- ✅ Limit enforcement works

## 🚨 Troubleshooting

### Common Issues

**Error: "policy already exists"**
- Solution: Run the cleanup script first

**Error: "table does not exist"**
- Solution: Make sure previous migrations ran successfully

**Error: "function does not exist"**
- Solution: Run the complete fixed migration

**Error: "permission denied"**
- Solution: Check RLS policies are correctly applied

### Getting Help

If you encounter issues:

1. **Check Supabase Logs**
   - Go to Logs section in Supabase dashboard
   - Look for error details

2. **Verify Table Structure**
   - Check Table Editor for created tables
   - Verify columns and relationships

3. **Test Functions**
   ```sql
   -- Test subscription check
   SELECT check_user_subscription('your-user-id');
   ```

## ✅ Success Checklist

After successful migration, you should have:

- [ ] All payment tables created
- [ ] All functions working
- [ ] RLS policies applied
- [ ] No error messages
- [ ] App starts without errors
- [ ] Payment flow works end-to-end

## 🎉 You're Ready!

Once the migration completes successfully, your ZedQuiz platform will have:

- **Complete Payment Processing** with PesaPal
- **Advanced Subscription Management**
- **Real-time Usage Tracking**
- **Professional Receipt Generation**
- **Comprehensive Analytics**

Your e-learning platform is now production-ready with enterprise-level payment capabilities! 🚀