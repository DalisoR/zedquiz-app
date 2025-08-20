import { createClient } from '@supabase/supabase-js';

// Your Supabase URL and Key
const supabaseUrl = 'https://aqajcdzqlyqxnlmergjz.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYWpjZHpxbHlxeG5sbWVyZ2p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NDc3OTcsImV4cCI6MjA3MDUyMzc5N30.U7NXlREMxrjPoBIoyduBNHnpiGjPTKpfJhnvNpE_dAk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
