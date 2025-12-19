-- 1. Relax constraints on Users to allow "Free Agents" (Ghost Users)
ALTER TABLE users ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'; 

-- 2. Memberships (Linking Users to Tenants)
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- 3. Task Collaborators (Scoped Access)
CREATE TABLE IF NOT EXISTS task_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_level VARCHAR(50) DEFAULT 'collaborator_free',
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(task_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org ON memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_collab_user ON task_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_task_collab_task ON task_collaborators(task_id);

-- Backfill: Ensure existing users have a Membership entry for their current org
INSERT INTO memberships (user_id, organization_id, role)
SELECT id, organization_id, role 
FROM users 
WHERE organization_id IS NOT NULL
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- 4. Tasks Creator Tracking
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

