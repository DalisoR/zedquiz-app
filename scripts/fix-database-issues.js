const { createClient } = require('@supabase/supabase-js');

// Your Supabase configuration
const supabaseUrl = 'https://aqajcdzqlyqxnlmergjz.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYWpjZHpxbHlxeG5sbWVyZ2p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NDc3OTcsImV4cCI6MjA3MDUyMzc5N30.U7NXlREMxrjPoBIoyduBNHnpiGjPTKpfJhnvNpE_dAk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAndFixDatabase() {
  console.log('🔍 Checking database tables...');

  try {
    // Test user_points table
    console.log('Checking user_points table...');
    const { data: userPointsTest, error: userPointsError } = await supabase
      .from('user_points')
      .select('*')
      .limit(1);

    if (userPointsError) {
      console.log('❌ user_points table issue:', userPointsError.message);
      console.log('💡 This table is needed for the gamification system');
    } else {
      console.log('✅ user_points table exists');
    }

    // Test tutor_applications table
    console.log('Checking tutor_applications table...');
    const { data: tutorAppsTest, error: tutorAppsError } = await supabase
      .from('tutor_applications')
      .select('*')
      .limit(1);

    if (tutorAppsError) {
      console.log('❌ tutor_applications table issue:', tutorAppsError.message);
      console.log('💡 This table is needed for tutor applications');
    } else {
      console.log('✅ tutor_applications table exists');
    }

    // Test parent_child_relationships table
    console.log('Checking parent_child_relationships table...');
    const { data: parentChildTest, error: parentChildError } = await supabase
      .from('parent_child_relationships')
      .select('*')
      .limit(1);

    if (parentChildError) {
      console.log('❌ parent_child_relationships table issue:', parentChildError.message);
      console.log('💡 This table is needed for parent-child linking');
    } else {
      console.log('✅ parent_child_relationships table exists');
    }

    console.log('\n📋 Summary:');
    console.log(
      'To fix these issues, you need to run the SQL migrations in your Supabase dashboard.'
    );
    console.log('Go to: https://supabase.com/dashboard/project/aqajcdzqlyqxnlmergjz/sql');
    console.log('Then run the SQL files in this order:');
    console.log('1. scripts/supabase/migrations/20230814150000_setup_tables.sql');
    console.log('2. scripts/supabase/migrations/20230814160000_add_gamification_tables.sql');
    console.log('3. scripts/supabase/migrations/20250815035000_add_parent_reports_feature.sql');
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

// Run the check
checkAndFixDatabase();
