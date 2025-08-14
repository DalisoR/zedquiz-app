const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('Checking database setup...');
    
    // Create tutor_applications table if it doesn't exist
    const { data: tableExists, error: tableCheckError } = await supabase
      .rpc('table_exists', { table_name: 'tutor_applications' });

    if (tableCheckError) throw tableCheckError;

    if (!tableExists) {
      console.log('Creating tutor_applications table...');
      const { error: createTableError } = await supabase.rpc('create_tutor_applications_table');
      if (createTableError) throw createTableError;
      console.log('✅ Created tutor_applications table');
    } else {
      console.log('✅ tutor_applications table exists');
      
      // Check if status column exists
      const { data: columnExists, error: columnCheckError } = await supabase
        .rpc('column_exists', { 
          table_name: 'tutor_applications',
          column_name: 'status' 
        });
      
      if (columnCheckError) throw columnCheckError;
      
      if (!columnExists) {
        console.log('Adding status column to tutor_applications table...');
        const { error: addColumnError } = await supabase.rpc('add_status_column');
        if (addColumnError) throw addColumnError;
        console.log('✅ Added status column');
      } else {
        console.log('✅ status column exists');
      }
    }
    
    // Check storage bucket
    console.log('Checking storage setup...');
    const { data: bucketExists, error: bucketError } = await supabase
      .storage
      .getBucket('tutor-applications');
      
    if (bucketError) {
      if (bucketError.statusCode === '404' || bucketError.message.includes('not found')) {
        console.log('Creating tutor-applications storage bucket...');
        const { error: createBucketError } = await supabase.storage
          .createBucket('tutor-applications', { public: false });
          
        if (createBucketError) throw createBucketError;
        console.log('✅ Created tutor-applications storage bucket');
      } else {
        throw bucketError;
      }
    } else {
      console.log('✅ tutor-applications storage bucket exists');
    }
    
    // Set bucket policies
    console.log('Setting up storage policies...');
    await setupStoragePolicies();
    
    console.log('\n✅ Database and storage setup completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

async function setupStoragePolicies() {
  // Allow authenticated users to upload files
  const { error: uploadPolicyError } = await supabase.rpc('set_upload_policy');
  if (uploadPolicyError) throw uploadPolicyError;
  
  // Allow public read access to files (adjust based on your needs)
  const { error: readPolicyError } = await supabase.rpc('set_read_policy');
  if (readPolicyError) throw readPolicyError;
  
  console.log('✅ Storage policies configured');
}

// Run setup
setupDatabase();
