import admin from 'firebase-admin';

const GOD_EMAILS = ['christianplyler@gmail.com', 'xtnpowered@gmail.com'];
const DEFAULT_ORG_ID = '00000000-0000-0000-0000-111111111111'; // Mattamay Homes (Genesis Block)

export const createAuthMiddleware = (pool) => {
    return async (req, res, next) => {
        const isDev = process.env.NODE_ENV !== 'production';

        // ------------------------------------------------------------------
        // 3. DEVELOPMENT "GOD MODE" & MOCK USER SWITCHING
        // ------------------------------------------------------------------
        if (isDev) {
            const mockUserId = req.headers['x-mock-user-id'];
            const godModeBypass = req.headers['x-god-mode-bypass'];

            // Priority 1: Specific Mock User (Switched via UI)
            if (mockUserId) {
                console.log(`[DEV ERROR BYPASS] Mock User ID provided: ${mockUserId}`);
                try {
                    const mockUserRes = await pool.query('SELECT * FROM users WHERE id = $1', [mockUserId]);
                    if (mockUserRes.rows.length > 0) {
                        const mockUser = mockUserRes.rows[0];
                        req.user = { uid: mockUser.firebase_uid, email: mockUser.email, picture: mockUser.avatar_url, name: mockUser.display_name };
                        req.dbUser = mockUser;
                        return next();
                    } else {
                        console.warn(`[DEV] Mock User ID ${mockUserId} not found in DB.`);
                    }
                } catch (err) {
                    console.error('[DEV] Failed to fetch mock user:', err);
                }
            }

            // Priority 2: Legacy God Mode Bypass (Default)
            if (godModeBypass === 'true') {
                console.log('[DEV ERROR BYPASS] God Mode header detected. Searching for Christian...');
                try {
                    const godUserRes = await pool.query("SELECT * FROM users WHERE email = 'xtnpowered@gmail.com'");
                    if (godUserRes.rows.length > 0) {
                        const godUser = godUserRes.rows[0];
                        req.user = { uid: godUser.firebase_uid, email: godUser.email, picture: godUser.avatar_url, name: godUser.display_name };
                        req.dbUser = godUser;
                        return next();
                    }
                } catch (err) {
                    console.error('[DEV] God Mode lookup failed:', err);
                }
            }
        }

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const idToken = authHeader.split('Bearer ')[1];

        try {
            // 1. Verify Firebase Token
            console.log('[Auth] Verifying Token...');
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            console.log(`[Auth] Token Verified. UID: ${decodedToken.uid}, Email: ${decodedToken.email}`);

            let { uid, email, picture, name } = decodedToken;

            // 2. Fetch User from Postgres
            console.log('[Auth] Fetching from DB...');
            let result = await pool.query(
                'SELECT id, role, organization_id FROM users WHERE firebase_uid = $1',
                [uid]
            );

            let dbUser = result.rows[0];
            console.log(`[Auth] DB User Found: ${!!dbUser}`);

            // 3. JIT Provisioning (Registration Pipeline)
            if (!dbUser) {
                console.log(`[Auth] User not found. Checking for Ghost Record for ${email}...`);
                // CLAIMS LOGIC: Check if this email exists as a "Ghost" user (invited via Viral Loop)
                const existingEmailRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

                if (existingEmailRes.rows.length > 0) {
                    // ACCOUNT CLAIM: Merge Firebase Identity into Ghost Record
                    console.log(`[Auth] Account Claim Detected for ${email}. Merging Ghost Record...`);
                    const ghostUser = existingEmailRes.rows[0];

                    const updateRes = await pool.query(
                        `UPDATE users 
                         SET firebase_uid = $1, 
                             avatar_url = COALESCE(NULLIF($2, ''), avatar_url),
                             display_name = COALESCE(NULLIF($3, ''), display_name),
                             status = 'active'
                         WHERE id = $4
                         RETURNING id, role, organization_id`,
                        [uid, picture || '', name || ghostUser.display_name, ghostUser.id]
                    );

                    dbUser = updateRes.rows[0];
                } else {
                    // NEW USER: Standard Provisioning
                    console.log(`[Auth] New User Detected: ${email}. Provisioning...`);

                    // Determine Role
                    const isGod = GOD_EMAILS.includes(email);
                    const role = isGod ? 'god' : 'user';
                    const orgId = DEFAULT_ORG_ID; // Auto-join "Mattamay" for now

                    const insertResult = await pool.query(
                        `INSERT INTO users (firebase_uid, email, role, organization_id, display_name, avatar_url, status)
                         VALUES ($1, $2, $3, $4, $5, $6, 'active')
                         RETURNING id, role, organization_id`,
                        [uid, email, role, orgId, name || 'New User', picture || '']
                    );

                    dbUser = insertResult.rows[0];
                    console.log(`[Auth] Provisioned ${email} as ${role}`);
                }
            }
            // 3b. Self-Healing: Ensure God Emails always have God Role
            else if (GOD_EMAILS.includes(email) && dbUser.role !== 'god') {
                console.log(`[Auth] Elevating ${email} to GOD role automatically.`);
                await pool.query('UPDATE users SET role = $1 WHERE id = $2', ['god', dbUser.id]);
                dbUser.role = 'god';
            }

            // 4. CHECK DELEGATIONS (Temporary Admin)
            if (dbUser.role !== 'god' && dbUser.role !== 'admin') {
                const delegationRes = await pool.query(
                    `SELECT * FROM role_delegations 
                     WHERE delegate_id = $1 
                     AND status = 'active' 
                     AND starts_at <= NOW() 
                     AND expires_at > NOW() 
                     ORDER BY created_at DESC LIMIT 1`,
                    [dbUser.id]
                );

                if (delegationRes.rows.length > 0) {
                    const delegation = delegationRes.rows[0];
                    console.log(`[Auth] Active Delegation Found! Promoting ${email} to TEMP ADMIN.`);
                    dbUser.role = 'admin';
                    dbUser.is_delegated = true;
                    dbUser.delegation_expires_at = delegation.expires_at;
                }
            }

            req.dbUser = dbUser;
            next();
        } catch (error) {
            console.error('Auth Error:', error);
            res.status(401).json({ error: 'Unauthorized: Invalid token or DB error' });
        }
    };
};
