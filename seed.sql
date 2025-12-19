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

-- 6. Assignment
INSERT INTO task_assignments (task_id, user_id)
VALUES (
    'b0000000-0000-4000-a000-000000000001',
    '00000000-0000-0000-0000-222222222222' -- Assigned to Alisara
) ON CONFLICT DO NOTHING;
