import { seedDatabase } from './src/utils/seedData.js';

console.log("Running seed verification...");
seedDatabase()
    .then(() => {
        console.log("Seed verification finished.");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Seed verification failed:", err);
        process.exit(1);
    });
