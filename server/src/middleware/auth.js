const GOD_EMAILS = ['christianplyler@gmail.com', 'xtnpowered@gmail.com'];
const DEFAULT_ORG_ID = '00000000-0000-0000-0000-111111111111'; // Mattamay Homes (Genesis Block)

export const createAuthMiddleware = (pool) => {
    return async (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const idToken = authHeader.split('Bearer ')[1];

        try {
            // 1. Verify Firebase Token
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            req.user = decodedToken;
            const { uid, email, picture, name } = decodedToken;

            // 2. Fetch User from Postgres
            let result = await pool.query(
                'SELECT id, role, organization_id FROM users WHERE firebase_uid = $1',
                [uid]
            );

            let dbUser = result.rows[0];

            // 3. JIT Provisioning (Registration Pipeline)
            if (!dbUser) {
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

            req.dbUser = dbUser;
            next();
        } catch (error) {
            console.error('Auth Error:', error);
            res.status(401).json({ error: 'Unauthorized: Invalid token or DB error' });
        }
    };
};
