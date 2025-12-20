-- Extra Seed Data for Stress Testing

-- 1. Create 10 New Colleagues
INSERT INTO users (id, firebase_uid, email, role, organization_id, display_name, company_label, avatar_url) VALUES
('00000000-0000-0000-0000-600000000001', 'uid-sam', 'sam@example.com', 'user', '00000000-0000-0000-0000-111111111111', 'Sam Struct', 'BuildIt Inc', '🏗️'),
('00000000-0000-0000-0000-600000000002', 'uid-diane', 'diane@example.com', 'user', '00000000-0000-0000-0000-111111111111', 'Diane Draft', 'Sketch Line', '📐'),
('00000000-0000-0000-0000-600000000003', 'uid-mike', 'mike@example.com', 'user', '00000000-0000-0000-0000-111111111111', 'Mike Mason', 'Stone Works', '🧱'),
('00000000-0000-0000-0000-600000000004', 'uid-sarah', 'sarah@example.com', 'user', '00000000-0000-0000-0000-111111111111', 'Sarah Steel', 'Metal Ops', '🔩'),
('00000000-0000-0000-0000-600000000005', 'uid-tom', 'tom@example.com', 'user', '00000000-0000-0000-0000-111111111111', 'Tom Timber', 'Wood Co', '🪵'),
('00000000-0000-0000-0000-600000000006', 'uid-liz', 'liz@example.com', 'user', '00000000-0000-0000-0000-111111111111', 'Liz Light', 'Bright Spark', '💡'),
('00000000-0000-0000-0000-600000000007', 'uid-pat', 'pat@example.com', 'user', '00000000-0000-0000-0000-111111111111', 'Pat Pipe', 'Flow Systems', '🚰'),
('00000000-0000-0000-0000-600000000008', 'uid-greg', 'greg@example.com', 'user', '00000000-0000-0000-0000-111111111111', 'Greg Glass', 'Viewpoint', '🪟'),
('00000000-0000-0000-0000-600000000009', 'uid-jess', 'jess@example.com', 'user', '00000000-0000-0000-0000-111111111111', 'Jess Joint', 'Fixers', '🔧'),
('00000000-0000-0000-0000-600000000010', 'uid-kev', 'kev@example.com', 'user', '00000000-0000-0000-0000-111111111111', 'Kevin Key', 'Lockmasters', '🔑')
ON CONFLICT (email) DO NOTHING;

-- 2. New Tasks (Mix of Projects and Lone)

-- Project Tasks (Linked to Kitchen Reno: a0...002)
INSERT INTO tasks (id, title, project_id, organization_id, status, priority, due_date, description) VALUES
('b0000000-0000-4000-a000-000000000010', 'Cabinet Delivery', 'a0000000-0000-4000-a000-000000000002', '00000000-0000-0000-0000-111111111111', 'todo', 'high', NOW() + INTERVAL '5 days', 'Coordinate drop off'),
('b0000000-0000-4000-a000-000000000011', 'Backsplash tile selection', 'a0000000-0000-4000-a000-000000000002', '00000000-0000-0000-0000-111111111111', 'doing', 'medium', NOW() + INTERVAL '1 day', 'Visit showroom'),
('b0000000-0000-4000-a000-000000000012', 'Countertop measurement', 'a0000000-0000-4000-a000-000000000002', '00000000-0000-0000-0000-111111111111', 'todo', 'high', NOW() + INTERVAL '7 days', 'Template date'),
('b0000000-0000-4000-a000-000000000013', 'Appliance Install', 'a0000000-0000-4000-a000-000000000002', '00000000-0000-0000-0000-111111111111', 'todo', 'medium', NOW() + INTERVAL '15 days', 'Fridge/Stove/Dishwasher'),
('b0000000-0000-4000-a000-000000000014', 'Paint Ceiling', 'a0000000-0000-4000-a000-000000000002', '00000000-0000-0000-0000-111111111111', 'todo', 'low', NOW() + INTERVAL '10 days', '2 coats flat white')
ON CONFLICT (id) DO NOTHING;

-- Lone Tasks (No Project)
INSERT INTO tasks (id, title, project_id, organization_id, status, priority, due_date, description) VALUES
('b0000000-0000-4000-a000-000000000015', 'Yearly Safety Inspection', NULL, '00000000-0000-0000-0000-111111111111', 'todo', 'high', NOW() + INTERVAL '2 days', 'Walkthrough with inspector'),
('b0000000-0000-4000-a000-000000000016', 'Update Vendor Contracts', NULL, '00000000-0000-0000-0000-111111111111', 'doing', 'medium', NOW() + INTERVAL '3 days', 'Review terms with legal'),
('b0000000-0000-4000-a000-000000000017', 'Clean Job Site B', NULL, '00000000-0000-0000-0000-111111111111', 'todo', 'low', NOW(), 'Remove debris'),
('b0000000-0000-4000-a000-000000000018', 'Staff Training Session', NULL, '00000000-0000-0000-0000-111111111111', 'todo', 'medium', NOW() + INTERVAL '4 days', 'OSHA Compliance'),
('b0000000-0000-4000-a000-000000000019', 'Order Office Supplies', NULL, '00000000-0000-0000-0000-111111111111', 'done', 'low', NOW() - INTERVAL '1 day', 'Paper/Pens/Ink')
ON CONFLICT (id) DO NOTHING;

-- More Lone Tasks for density
INSERT INTO tasks (id, title, project_id, organization_id, status, priority, due_date) VALUES
('b0000000-0000-4000-a000-000000000020', 'Client Meeting: Smith', NULL, '00000000-0000-0000-0000-111111111111', 'todo', 'high', NOW() + INTERVAL '1 day'),
('b0000000-0000-4000-a000-000000000021', 'Client Meeting: Jones', NULL, '00000000-0000-0000-0000-111111111111', 'todo', 'medium', NOW() + INTERVAL '1 day'),
('b0000000-0000-4000-a000-000000000022', 'Client Meeting: Doe', NULL, '00000000-0000-0000-0000-111111111111', 'todo', 'low', NOW() + INTERVAL '1 day'),
('b0000000-0000-4000-a000-000000000023', 'Review Q3 Budget', NULL, '00000000-0000-0000-0000-111111111111', 'doing', 'high', NOW() + INTERVAL '5 days'),
('b0000000-0000-4000-a000-000000000024', 'Update Website Photos', NULL, '00000000-0000-0000-0000-111111111111', 'todo', 'low', NOW() + INTERVAL '8 days'),
('b0000000-0000-4000-a000-000000000025', 'Vehicle Maintenance', NULL, '00000000-0000-0000-0000-111111111111', 'todo', 'medium', NOW() + INTERVAL '6 days'),
('b0000000-0000-4000-a000-000000000026', 'Team Lunch', NULL, '00000000-0000-0000-0000-111111111111', 'todo', 'low', NOW() + INTERVAL '2 days'),
('b0000000-0000-4000-a000-000000000027', 'Fix Coffee Machine', NULL, '00000000-0000-0000-0000-111111111111', 'todo', 'high', NOW()),
('b0000000-0000-4000-a000-000000000028', 'Send Invoices', NULL, '00000000-0000-0000-0000-111111111111', 'todo', 'medium', NOW() + INTERVAL '10 days'),
('b0000000-0000-4000-a000-000000000029', 'Archive Old Files', NULL, '00000000-0000-0000-0000-111111111111', 'todo', 'low', NOW() + INTERVAL '12 days')
ON CONFLICT (id) DO NOTHING;

-- 3. Assign Tasks to New Users
INSERT INTO task_assignments (task_id, user_id) VALUES
('b0000000-0000-4000-a000-000000000010', '00000000-0000-0000-0000-600000000001'), -- Sam
('b0000000-0000-4000-a000-000000000011', '00000000-0000-0000-0000-600000000002'), -- Diane
('b0000000-0000-4000-a000-000000000012', '00000000-0000-0000-0000-600000000001'), -- Sam
('b0000000-0000-4000-a000-000000000013', '00000000-0000-0000-0000-600000000003'), -- Mike
('b0000000-0000-4000-a000-000000000014', '00000000-0000-0000-0000-600000000004'), -- Sarah
('b0000000-0000-4000-a000-000000000015', '00000000-0000-0000-0000-600000000005'), -- Tom
('b0000000-0000-4000-a000-000000000016', '00000000-0000-0000-0000-600000000006'), -- Liz
('b0000000-0000-4000-a000-000000000017', '00000000-0000-0000-0000-600000000001'), -- Sam
('b0000000-0000-4000-a000-000000000018', '00000000-0000-0000-0000-600000000007'), -- Pat
('b0000000-0000-4000-a000-000000000019', '00000000-0000-0000-0000-600000000008'), -- Greg
('b0000000-0000-4000-a000-000000000020', '00000000-0000-0000-0000-600000000001'), -- Sam (Meeting)
('b0000000-0000-4000-a000-000000000021', '00000000-0000-0000-0000-600000000002'), -- Diane (Meeting)
('b0000000-0000-4000-a000-000000000022', '00000000-0000-0000-0000-600000000009'), -- Jess
('b0000000-0000-4000-a000-000000000023', '00000000-0000-0000-0000-600000000010'), -- Kev
('b0000000-0000-4000-a000-000000000027', '00000000-0000-0000-0000-600000000009')  -- Jess (Coffee)
ON CONFLICT DO NOTHING;
