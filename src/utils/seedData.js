import { db } from '../firebase.js';
import { collection, addDoc, getDocs, query, limit, writeBatch, doc } from 'firebase/firestore';

const colleaguesData = [
    {
        name: 'Alisara Plyler',
        role: 'Purchasing Director',
        company: 'Mattamay Homes',
        department: 'Purchasing',
        avatar: 'AP'
    },
    {
        name: 'John Doe',
        role: 'Senior Developer',
        company: 'Mattamay Homes',
        department: 'Engineering',
        avatar: 'JD'
    },
    {
        name: 'Jane Smith',
        role: 'Lead Designer',
        company: 'Mattamay Homes',
        department: 'Design',
        avatar: 'JS'
    },
    {
        name: 'Sam Wilson',
        role: 'Marketing Director',
        company: 'Mattamay Homes',
        department: 'Marketing',
        avatar: 'SW'
    },
];

const projectsData = [
    { title: 'Q4 Marketing Campaign', description: 'Launch and promote the new office management suite.', status: 'active' },
    { title: 'App Refactor', description: 'Upgrading the core dashboard for better performance.', status: 'active' },
    { title: 'Holiday Event', description: 'Planning the corporate year-end celebration.', status: 'planning' },
];

/**
 * Firebase Database Seeding Script
 * 
 * PURPOSE:
 * Populates Firebase with sample data for development and testing.
 * Idempotent: Safe to run multiple times (checks for existing data).
 * 
 * DATA STRUCTURE:
 * - Colleagues: 4 sample team members (name, role, department, avatar)
 * - Projects: 3 sample projects (title, description, status)
 * - Tasks: 5 sample tasks (linked to projects and colleagues)
 * 
 * DUPLICATE PREVENTION:
 * - Colleagues: Checks by name (skip if exists)
 * - Projects: Always creates new (no duplicate check)
 * - Tasks: Checks by title (skip if exists)
 * 
 * BATCH OPTIMIZATION:
 * Uses writeBatch() to minimize network round-trips.
 * Single commit writes all new documents atomically.
 * 
 * TASK RELATIONSHIPS:
 * - assignedTo: Array of colleague IDs (supports multi-assign)
 * - projectId: Single project ID (or null for lone tasks)
 * - dueDate: ISO string, generated relative to now (2-10 days out)
 * 
 * USAGE:
 * Run once per environment setup:
 * ```
 * import { seedDatabase } from './utils/seedData.js';
 * await seedDatabase();
 * ```
 * 
 * @returns {Promise<void>}
 */
export const seedDatabase = async () => {
    try {
        console.log("Checking database...");

        // Seed Colleagues - check by name to prevent duplicates
        const colleaguesSnapshot = await getDocs(collection(db, 'colleagues'));
        const existingNames = new Set(colleaguesSnapshot.docs.map(doc => doc.data().name));

        const batch = writeBatch(db);
        const colleagueRefs = [];

        for (const colleague of colleaguesData) {
            if (!existingNames.has(colleague.name)) {
                console.log(`Adding colleague: ${colleague.name}`);
                const ref = doc(collection(db, 'colleagues'));
                batch.set(ref, colleague);
                colleagueRefs.push({ id: ref.id, ...colleague });
            } else {
                console.log(`Colleague ${colleague.name} already exists, skipping`);
                // Find existing colleague for task assignment
                const existing = colleaguesSnapshot.docs.find(d => d.data().name === colleague.name);
                if (existing) {
                    colleagueRefs.push({ id: existing.id, ...existing.data() });
                }
            }
        }

        // Seed Projects
        const projectRefs = [];
        for (const project of projectsData) {
            const ref = doc(collection(db, 'projects'));
            batch.set(ref, project);
            projectRefs.push({ id: ref.id, ...project });
        }

        // Seed Tasks
        const tasks = [
            {
                title: 'Finalize Design Tokens',
                projectId: projectRefs[1].id,
                assignedTo: [colleagueRefs[2].id],
                dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
                status: 'doing',
                priority: 'high'
            },
            {
                title: 'Initial API Integration',
                projectId: projectRefs[1].id,
                assignedTo: [colleagueRefs[1].id],
                dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
                status: 'todo',
                priority: 'medium'
            },
            {
                title: 'Social Media Assets',
                projectId: projectRefs[0].id,
                assignedTo: [colleagueRefs[2].id, colleagueRefs[3].id],
                dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
                status: 'doing',
                priority: 'medium'
            },
            {
                title: 'Hire Catering',
                projectId: projectRefs[2].id,
                assignedTo: [colleagueRefs[3].id],
                dueDate: new Date(Date.now() + 86400000 * 10).toISOString(),
                status: 'todo',
                priority: 'low'
            },
            {
                title: 'Renew Office Insurance',
                projectId: null,
                assignedTo: [colleagueRefs[0].id],
                dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
                status: 'todo',
                priority: 'high'
            }
        ];

        // Seed Tasks
        const existingTasksSnapshot = await getDocs(collection(db, 'tasks'));
        const existingTitles = new Set(existingTasksSnapshot.docs.map(d => d.data().title));

        let tasksAdded = 0;
        for (const task of tasks) {
            if (!existingTitles.has(task.title)) {
                const ref = doc(collection(db, 'tasks'));
                batch.set(ref, task);
                tasksAdded++;
            }
        }
        console.log(`Queued ${tasksAdded} new tasks for creation.`);

        await batch.commit();
        console.log("Database seeded successfully with colleagues!");
    } catch (error) {
        console.error("Error seeding database:", error);
    }
};
