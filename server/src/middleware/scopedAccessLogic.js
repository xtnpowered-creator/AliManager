/**
 * Logic for "Scoped Access" Middleware & Queries
 */

// 1. Modified Auth Middleware (Conceptual)
// We need to fetch memberships alongside the user profile.
/*
const query = `
    SELECT u.*, 
           json_agg(m.organization_id) as member_orgs
    FROM users u
    LEFT JOIN memberships m ON m.user_id = u.id
    WHERE u.firebase_uid = $1
    GROUP BY u.id
`;
*/

// 2. The "Task Feed" Query (Row Level Security Logic)
// This query ensures a user only sees tasks they own (via Org) or are invited to.
export const getScopedTasksQuery = (userId, memberOrgIds) => {
    // memberOrgIds is an array of UUIDs the user belongs to

    // If user has no orgs (Ghost User), memberCheck is FALSE
    const memberCheck = memberOrgIds.length > 0
        ? `t.organization_id = ANY($2::uuid[])`
        : `FALSE`;

    return `
        SELECT t.*, 
               'owner' as access_source 
        FROM tasks t
        WHERE ${memberCheck}
        
        UNION ALL
        
        SELECT t.*, 
               tc.access_level as access_source
        FROM tasks t
        JOIN task_collaborators tc ON tc.task_id = t.id
        WHERE tc.user_id = $1
    `;
};

// 3. Scoped Access Middleware (for Single Task Routes like GET /tasks/:id)
export const requireTaskAccess = async (pool, req, res, next) => {
    const { id: taskId } = req.params;
    const { id: userId, organization_id } = req.dbUser; // assuming legacy org_id or new memberships

    // Check if user is a member of the task's org
    const taskOrgResult = await pool.query('SELECT organization_id FROM tasks WHERE id = $1', [taskId]);
    if (taskOrgResult.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    const taskOrgId = taskOrgResult.rows[0].organization_id;

    // 1. Org Membership Check
    // (In full implementation, check against req.user.member_orgs array)
    if (organization_id === taskOrgId) {
        return next(); // User owns the task via Org
    }

    // 2. Collaborator Check
    const collabResult = await pool.query(
        'SELECT access_level FROM task_collaborators WHERE task_id = $1 AND user_id = $2',
        [taskId, userId]
    );

    if (collabResult.rows.length > 0) {
        req.accessLevel = collabResult.rows[0].access_level;
        return next(); // User is a collaborator
    }

    return res.status(403).json({ error: 'Access Denied' });
};
