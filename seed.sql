-- Genesis Block Seed Data
-- Static UUIDs to ensure consistent environments

-- 1. Default Organization: "Mattamay Homes"
INSERT INTO organizations (id, name, plan_tier)
VALUES (
    '00000000-0000-0000-0000-111111111111',
    'Mattamay Homes',
    'enterprise'
) ON CONFLICT (id) DO NOTHING;

-- 2. God User: Christian
INSERT INTO users (id, firebase_uid, email, role, organization_id, display_name)
VALUES (
    '00000000-0000-0000-0000-333333333333',
    'uid-christian-god-mode', -- Placeholder UID, update after first login if needed
    'christian@example.com',
    'god',
    '00000000-0000-0000-0000-111111111111', -- Attached to Mattamay but sees all
    'Christian (God)'
) ON CONFLICT (email) DO NOTHING;

-- 3. Admin User: Alisara
INSERT INTO users (id, firebase_uid, email, role, organization_id, display_name, company_label)
VALUES (
    '00000000-0000-0000-0000-222222222222',
    'uid-alisara-admin', -- Placeholder
    'alisara@example.com',
    'admin',
    '00000000-0000-0000-0000-111111111111',
    'Mattamay Homes',
    'Alisara Plyler'
) ON CONFLICT (email) DO NOTHING;


-- 4. Sample Project
INSERT INTO projects (id, organization_id, title, description, status)
VALUES (
    'a0000000-0000-4000-a000-000000000001',
    '00000000-0000-0000-0000-111111111111',
    'Q4 Marketing Campaign',
    'Launch and promote the new office management suite.',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- 5. Sample Task
INSERT INTO tasks (id, title, project_id, organization_id, status, priority, due_date)
VALUES (
    'b0000000-0000-4000-a000-000000000001',
    'Finalize Design Tokens',
    'a0000000-0000-4000-a000-000000000001',
    '00000000-0000-0000-0000-111111111111',
    'doing',
    'high',
    NOW() + INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

-- 6b. Additional Users
INSERT INTO users (id, firebase_uid, email, role, organization_id, display_name, company_label, avatar_url)
VALUES 
(
    '00000000-0000-0000-0000-444444444444',
    'uid-bob',
    'bob@example.com',
    'user',
    '00000000-0000-0000-0000-111111111111',
    'Bob Builder',
    'Construct Co',
    '👷'
),
(
    '00000000-0000-0000-0000-555555555555',
    'uid-alice',
    'alice@example.com',
    'user',
    '00000000-0000-0000-0000-111111111111',
    'Alice Architect',
    'Design Studio',
    '👩‍🎨'
) ON CONFLICT (email) DO NOTHING;

-- 6c. Project: Kitchen Reno
INSERT INTO projects (id, organization_id, title, description, start_date, end_date)
VALUES (
    'a0000000-0000-4000-a000-000000000002',
    '00000000-0000-0000-0000-111111111111',
    'Kitchen Renovation',
    'Full remodel of the main kitchen area.',
    NOW(),
    NOW() + INTERVAL '30 days'
) ON CONFLICT (id) DO NOTHING;

-- 6d. Dense Task List
INSERT INTO tasks (id, title, project_id, organization_id, status, priority, due_date, description)
VALUES 
-- Past Task
(
    'b0000000-0000-4000-a000-000000000002',
    'Demolition',
    'a0000000-0000-4000-a000-000000000002',
    '00000000-0000-0000-0000-111111111111',
    'done',
    'high',
    NOW() - INTERVAL '2 days',
    'tear down existing cabinets'
),
-- Today Task
(
    'b0000000-0000-4000-a000-000000000003',
    'Plumbing Rough-in',
    'a0000000-0000-4000-a000-000000000002',
    '00000000-0000-0000-0000-111111111111',
    'doing',
    'high',
    NOW(),
    'Install new drain pipes'
),
-- Tomorrow Task
(
    'b0000000-0000-4000-a000-000000000004',
    'Electrical Wiring',
    'a0000000-0000-4000-a000-000000000002',
    '00000000-0000-0000-0000-111111111111',
    'todo',
    'medium',
    NOW() + INTERVAL '1 day',
    'Run new outlets for island'
),
-- Lone Task
(
    'b0000000-0000-4000-a000-000000000005',
    'Call Inspector City Hall',
    NULL, -- Lone Task
    '00000000-0000-0000-0000-111111111111',
    'todo',
    'high',
    NOW() + INTERVAL '3 days',
    'Schedule permit validation'
) ON CONFLICT (id) DO NOTHING;

-- 6e. Assignments
INSERT INTO task_assignments (task_id, user_id)
VALUES 
('b0000000-0000-4000-a000-000000000002', '00000000-0000-0000-0000-444444444444'), -- Bob did Demo
('b0000000-0000-4000-a000-000000000003', '00000000-0000-0000-0000-444444444444'), -- Bob doing Plumbing
('b0000000-0000-4000-a000-000000000004', '00000000-0000-0000-0000-555555555555'), -- Alice Electrical
('b0000000-0000-4000-a000-000000000005', '00000000-0000-0000-0000-222222222222')  -- Ali calls City
ON CONFLICT DO NOTHING;
