
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const pool = new pg.Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'alimanager',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5433,
});

// -- CONTENT GENERATORS --
const PROJECTS = [
    { title: "Lot 45 - The Oakwood", description: "2,400 sqft Single Family Home. Model: Oakwood B. Status: Framing." },
    { title: "Lot 92 - The Maple", description: "1,800 sqft Bungalow. Model: Maple A. Status: Pre-Construction." }
];

const PURCHASING_TASKS = [
    "Complete Lumber Takeoff",
    "Issue PO to ABC Lumber",
    "Review Plumbing Bid",
    "Finalize Window Selection",
    "Send RFP for Flooring",
    "Approve Electrical Extras",
    "Verify Brick Quantities",
    "Negotiate HVAC Contract",
    "Process Variance Purchase Order",
    "Audit Framing Invoice",
    "Update Material Price List",
    "Schedule Vendor Walkthrough"
];

const GENERIC_TASKS = [
    "Site Safety Inspection",
    "Client Color Selection Meeting",
    "Pre-Drywall Walkthrough",
    "Check Foundation Pour",
    "Review Architectural Changes",
    "Submit Permit Application",
    "Weekly Production Meeting",
    "Update Construction Schedule"
];

// -- HELPERS --
const getRandomFutureDate = (minDays = 0, maxDays = 35) => {
    const d = new Date();
    const daysToAdd = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
    d.setDate(d.getDate() + daysToAdd);
    // Avoid weekends for realism? Nah, construction never sleeps.
    return d.toISOString();
};

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seed() {
    try {
        console.log('--- STARTING REALISTIC SEED ---');
        console.log('1. Cleaning Project Data (Preserving Users)...');
        // IMPORTANT: CASCADE deletes tasks and task_assignees automatically when projects/users are touched, 
        // but here we are keeping users, so we must explicitly truncate tasks/projects.
        await pool.query('TRUNCATE projects, tasks, task_collaborators CASCADE');

        console.log('2. Fetching User IDs...');
        const userRes = await pool.query("SELECT id, display_name, role, email FROM users WHERE email != 'xtnpowered@gmail.com'"); // Exclude Christain (God) from generic assignments
        const allStaff = userRes.rows;

        // Find Alisara specifically
        const alisara = allStaff.find(u => u.email.includes('alisara') || u.display_name.includes('Alisara'));
        const staffMembers = allStaff.filter(u => u.id !== alisara?.id);

        if (!alisara) throw new Error("Alisara user not found! Please run the Setup Users seed first.");

        console.log(`Found Alisara: ${alisara.id}`);
        console.log(`Found ${staffMembers.length} Staff Members.`);

        // --- SEED PROJECTS ---
        console.log('3. Seeding Projects...');
        const projectIds = [];
        for (const p of PROJECTS) {
            const res = await pool.query(`
                INSERT INTO projects (title, description, organization_id, status, created_at)
                VALUES ($1, $2, $3, 'active', NOW())
                RETURNING id
            `, [p.title, p.description, '00000000-0000-0000-0000-111111111111']); // Mattamay Org ID
            projectIds.push(res.rows[0].id);
        }

        // --- SEED TASKS ---
        console.log('4. Seeding Tasks...');

        const createTask = async (title, creatorId, assigneeId = null, projectId = null) => {
            // Random Priority
            const priority = Math.random() > 0.7 ? '1' : Math.random() > 0.4 ? '2' : '3';

            const res = await pool.query(`
                INSERT INTO tasks (title, description, status, priority, due_date, organization_id, created_by, project_id, created_at)
                VALUES ($1, $2, 'todo', $3, $4, $5, $6, $7, NOW())
                RETURNING id
            `, [
                title,
                "Standard operating procedure for this stage.",
                priority,
                getRandomFutureDate(0, 35), // 0 to 5 weeks
                '00000000-0000-0000-0000-111111111111',
                creatorId,
                projectId
            ]);

            const taskId = res.rows[0].id;

            // If assignee provided (or self-assigned logic is implicit in ownership, but DB needs explicit assignment for timeline view if filters require it)
            // Wait - "No Assignee" = "Self Assigned" is a text interpretation. 
            // In DB, if we want it to show up as "Assigned To Me", we usually need an entry.
            // BUT user said "half having no Assignee, such that they will behave as self-assigned".
            // Implementation: If invalid assigneeId passed, we skip insertion.

            if (assigneeId) {
                await pool.query(`
                    INSERT INTO task_collaborators (task_id, user_id, invited_at)
                    VALUES ($1, $2, NOW())
                `, [taskId, assigneeId]);
            }
        };

        // GROUP A: Created by Alisara (25 Total)
        // Split: 12 Self (No Assignee), 13 Assigned to Others
        // Nested Split: Half Project, Half Lone
        for (let i = 0; i < 25; i++) {
            const isSelf = i < 12; // First 12 are self (no assignee)
            const isProject = i % 2 === 0; // Even are project tasks

            const titlePrefix = isSelf ? "Review" : "Process";
            const sourceArr = isSelf ? GENERIC_TASKS : PURCHASING_TASKS; // Managers review generic, Staff process purchasing
            const title = `${pickRandom(sourceArr)} ${Math.floor(Math.random() * 900)}`;

            const assignee = isSelf ? null : pickRandom(staffMembers).id;
            const project = isProject ? pickRandom(projectIds) : null;

            await createTask(title, alisara.id, assignee, project);
        }

        // GROUP B: Created by Staff (25 Total)
        // Mix of everything
        for (let i = 0; i < 25; i++) {
            const creator = pickRandom(staffMembers);
            const isSelf = Math.random() > 0.5;
            const isProject = Math.random() > 0.5;

            const title = `${pickRandom(PURCHASING_TASKS)} ${Math.floor(Math.random() * 900)}`;

            // If assigned to others, it might be back to Alisara (Approval) or another staff
            const otherId = Math.random() > 0.7 ? alisara.id : pickRandom(staffMembers.filter(s => s.id !== creator.id)).id;
            const assignee = isSelf ? null : otherId;
            const project = isProject ? pickRandom(projectIds) : null;

            await createTask(title, creator.id, assignee, project);
        }

        console.log('✅ Refactor Complete: 2 Projects, 50 Tasks Seeded.');

    } catch (err) {
        console.error('SEED ERROR:', err);
    } finally {
        await pool.end();
    }
}

seed();
