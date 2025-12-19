import { query, end } from './src/utils/db.js';

async function checkDatabase() {
    console.log("--- Verifying AliManager Migration ---");
    try {
        const orgs = await query('SELECT * FROM organizations');
        console.log(`\nOrganizations (${orgs.rows.length}):`);
        orgs.rows.forEach(r => console.log(`- [${r.id}] ${r.name} (${r.plan_tier})`));

        const users = await query('SELECT * FROM users');
        console.log(`\nUsers (${users.rows.length}):`);
        users.rows.forEach(r => console.log(`- [${r.id}] ${r.display_name} (${r.role}) - Org: ${r.organization_id}`));

        const projects = await query('SELECT * FROM projects');
        console.log(`\nProjects (${projects.rows.length}):`);
        projects.rows.forEach(r => console.log(`- [${r.id}] ${r.title} (${r.status})`));

        const tasks = await query('SELECT * FROM tasks');
        console.log(`\nTasks (${tasks.rows.length}):`);
        tasks.rows.forEach(r => console.log(`- [${r.id}] ${r.title} (${r.status}) - Project: ${r.project_id}`));

        console.log("\n--- Verification Complete: SUCCESS ---");
    } catch (err) {
        console.error("Verification Failed:", err);
    } finally {
        end();
    }
}

checkDatabase();
