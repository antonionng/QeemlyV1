/*
  SEED USER FOR DEMO
  
  To create the demo user, go to your Supabase Dashboard:
  1. Navigate to Authentication > Users
  2. Click "Add user" button
  3. Enter:
     - Email: ag@experrt.com
     - Password: Brandnew4
  4. Click "Create user"
  
  Then run the SQL below to create their workspace and profile:
*/

-- Create workspace for the demo user
INSERT INTO workspaces (id, name, slug)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Experrt',
  'experrt-demo'
)
ON CONFLICT (slug) DO NOTHING;

-- Get the user ID from auth.users and create their profile
-- Note: Replace 'USER_ID_HERE' with the actual UUID from the Authentication tab
-- after creating the user manually

-- Example (you'll need to update the UUID after creating the user):
/*
INSERT INTO profiles (id, workspace_id, full_name, role)
VALUES (
  'USER_ID_HERE',  -- Copy from Authentication > Users after creating the user
  'a0000000-0000-0000-0000-000000000001',
  'Demo User',
  'admin'
);
*/
