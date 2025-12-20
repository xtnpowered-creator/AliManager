-- Create task_steps table
CREATE TABLE IF NOT EXISTS task_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    position INTEGER DEFAULT 0,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL, -- Inherits from task if null, but explicit override possible
    due_date TIMESTAMP WITH TIME ZONE, -- Inherits from task if null
    duration INTEGER DEFAULT 1, -- in days? or just 'weight'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by task
CREATE INDEX IF NOT EXISTS idx_task_steps_task_id ON task_steps(task_id);
