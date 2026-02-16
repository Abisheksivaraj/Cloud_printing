import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcgghxwgqewfwzshsrdm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZ2doeHdncWV3Znd6c2hzcmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njk1ODQsImV4cCI6MjA4NjU0NTU4NH0.9wQm6cghImuVU0A7InTaDkWS7q9RNn9C6BTZf-fqkcw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
