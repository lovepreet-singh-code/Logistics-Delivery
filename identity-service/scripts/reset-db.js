const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Hardcoded default for local docker-compose setup, or use env var
const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:admin_secret@localhost:27017/logistics_platform?authSource=admin';

async function resetDB() {
  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to Database successfully.');

    // Drop all known operational collections
    const collectionsToDrop = ['orders', 'users', 'vehicles', 'franchises', 'hubs'];
    
    for (const collectionName of collectionsToDrop) {
      try {
        await mongoose.connection.db.dropCollection(collectionName);
        console.log(`Dropped collection: ${collectionName}`);
      } catch (err) {
        if (err.code === 26) {
          console.log(`Collection ${collectionName} does not exist, skipping.`);
        } else {
          console.error(`Error dropping ${collectionName}:`, err);
        }
      }
    }

    // Seed Users
    console.log('Seeding fresh Admin and Agent users...');
    const usersCollection = mongoose.connection.db.collection('users');

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const now = new Date();

    const usersToSeed = [
      {
        name: 'Super Admin',
        email: 'admin@logicore.com',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Agent Driver',
        email: 'agent@logicore.com',
        password: hashedPassword,
        role: 'AGENT',
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    await usersCollection.insertMany(usersToSeed);
    console.log('Seeded users successfully.');

    console.log('\n✅ Database completely reset and seeded for fresh E2E testing');
  } catch (error) {
    console.error('Failed to reset database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

resetDB();
