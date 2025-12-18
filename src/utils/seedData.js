import { db } from '../firebase';
import { collection, addDoc, getDocs, query, limit, writeBatch, doc } from 'firebase/firestore';

const colleaguesData = [
    { name: 'Alisara', role: 'Project Manager', avatar: 'AL' },
    { name: 'John Doe', role: 'Developer', avatar: 'JD' },
    { name: 'Jane Smith', role: 'Designer', avatar: 'JS' },
    { name: 'Sam Wilson', role: 'Marketing', avatar: 'SW' },
];

const projectsData = [
    { title: 'Q4 Marketing Campaign', description: 'Launch and promote the new office management suite.', status: 'active' },
    { title: 'App Refactor', description: 'Upgrading the core dashboard for better performance.', status: 'active' },
    { title: 'Holiday Event', description: 'Planning the corporate year-end celebration.', status: 'planning' },
];

export const seedDatabase = async () => {
    try {
        const colleaguesSnapshot = await getDocs(query(collection(db, 'colleagues'), limit(1)));
        if (!colleaguesSnapshot.empty) {
            console.log("Database already seeded with colleagues.");
            return;
        }

        console.log("Seeding database with colleagues...");
        const batch = writeBatch(db);

        // Seed Colleagues
        const colleagueRefs = [];
        for (const colleague of colleaguesData) {
            const ref = doc(collection(db, 'colleagues'));
            batch.set(ref, colleague);
            colleagueRefs.push({ id: ref.id, ...colleague });
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

        for (const task of tasks) {
            const ref = doc(collection(db, 'tasks'));
            batch.set(ref, task);
        }

        await batch.commit();
        console.log("Database seeded successfully with colleagues!");
    } catch (error) {
        console.error("Error seeding database:", error);
    }
};
