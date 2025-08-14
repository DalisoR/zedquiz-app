# Supabase Setup Instructions

## Prerequisites
1. Node.js and npm installed
2. Supabase CLI installed (`npm install -g supabase`)
3. Environment variables set up in `.env` file:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

## Setup Instructions

### 1. Run Database Migrations
1. Navigate to the project root directory
2. Run the SQL migration file in your Supabase SQL editor:
   - Log in to your Supabase dashboard
   - Go to SQL Editor
   - Copy the contents of `scripts/supabase/migrations/20230814150000_setup_tables.sql`
   - Paste and run the SQL in the Supabase SQL Editor

### 2. Verify Setup
1. In the Supabase dashboard, go to Table Editor
2. Verify that the `tutor_applications` table exists with all columns
3. Go to Storage and verify that the `tutor-applications` bucket exists

### 3. Storage Policies
- The SQL migration sets up basic storage policies:
  - Authenticated users can upload files to the tutor-applications bucket
  - Users can view files they've uploaded

### 4. Test the Setup
1. Submit a tutor application through the app
2. Verify in Supabase that:
   - A new record appears in the `tutor_applications` table
   - Files are uploaded to the `tutor-applications` bucket
   - The status is set to 'pending' by default

## Troubleshooting
- If you get permission errors, ensure your Supabase service role key has proper permissions
- If tables aren't created, check the SQL execution logs in Supabase
- If file uploads fail, verify the storage bucket exists and policies are set correctly
