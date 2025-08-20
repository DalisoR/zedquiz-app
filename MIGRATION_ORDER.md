# Migration Order Guide

## ⚠️ Important: Run Migrations in Correct Order

The migrations must be run in the correct order because they have dependencies on each other.

## 🔢 Correct Migration Order

### Step 1: Payment System (Required First)

```sql
-- Run this first: 005_payments_subscriptions_final.sql
-- This creates: payments, subscriptions, subscription_usage, payment_webhooks tables
```

### Step 2: Revenue Analytics (Depends on Step 1)

```sql
-- Run this second: 006_revenue_analytics.sql
-- This creates analytics tables that reference the subscription tables
```

## 🚨 Current Issue

You're getting the error:

```
ERROR: 42P01: relation "subscriptions" does not exist
```

This means you tried to run the analytics migration before the payment system migration.

## ✅ Solution

### Option A: Run Payment Migration First

1. **Run Payment System Migration**

   ```sql
   -- Copy and paste contents of: 005_payments_subscriptions_final.sql
   -- Execute in Supabase SQL Editor
   ```

2. **Then Run Analytics Migration**
   ```sql
   -- Copy and paste contents of: 006_revenue_analytics.sql
   -- Execute in Supabase SQL Editor
   ```

### Option B: Combined Migration (Easier)

I'll create a combined migration that includes both systems in the correct order.

## 📋 Migration Dependencies

```
005_payments_subscriptions_final.sql
├── Creates: payments table
├── Creates: subscriptions table ← Required by analytics
├── Creates: subscription_usage table ← Required by analytics
└── Creates: payment_webhooks table

006_revenue_analytics.sql
├── Depends on: subscriptions table
├── Depends on: payments table
├── Depends on: subscription_usage table
└── Creates: revenue_analytics, subscription_metrics, etc.
```

## 🎯 Next Steps

1. **Check which tables exist:**

   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('payments', 'subscriptions', 'subscription_usage');
   ```

2. **If no tables exist, run payment migration first**
3. **Then run analytics migration**
4. **Verify both systems work**

## 🔧 Quick Fix

Run the payment system migration first, then the analytics migration will work perfectly!
