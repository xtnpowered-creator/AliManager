-- Create ENUM for request status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- e.g., 'DELETE_USER', 'REASSIGN_TASK'
    payload JSONB NOT NULL DEFAULT '{}', -- flexible data storage for the command
    status request_status NOT NULL DEFAULT 'PENDING',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by status and org (Admin Dashboard)
CREATE INDEX IF NOT EXISTS idx_requests_org_status ON requests(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_requests_requester ON requests(requester_id);
