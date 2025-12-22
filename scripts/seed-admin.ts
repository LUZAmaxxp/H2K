/**
 * Seed script to create an admin account
 * Run with: npx tsx scripts/seed-admin.ts
 * or: ts-node scripts/seed-admin.ts
 */

import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import { hash } from '@node-rs/argon2';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auth_next';

interface BetterAuthUser {
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

async function seedAdmin() {
  try {
    console.log('🌱 Starting admin seed script...');

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();

    // Admin credentials
    const adminEmail = 'allouchayman21@gmail.com';
    const adminPassword = 'Aymanos007';
    const adminName = 'Ayman Allouch';

    // Check if admin user already exists in Better Auth
    const possibleCollections = ['better_auth_users', 'users', 'accounts', 'user'];
    let existingUser: any = null;
    let userCollection: string | null = null;

    for (const collectionName of possibleCollections) {
      try {
        const user = await db.collection(collectionName).findOne({ email: adminEmail });
        if (user) {
          existingUser = user;
          userCollection = collectionName;
          console.log(`📋 Found existing user in collection: ${collectionName}`);
          break;
        }
      } catch (error) {
        // Collection doesn't exist, continue
      }
    }

    let userId: string;

    if (existingUser) {
      console.log('⚠️  Admin user already exists in Better Auth');
      userId = existingUser._id.toString();
    } else {
      // Hash password using Argon2 (same as Better Auth)
      const hashedPassword = await hash(adminPassword);
      console.log('🔐 Password hashed');

      // Create user in Better Auth collection
      // Try to find the correct collection name
      let created = false;
      for (const collectionName of possibleCollections) {
        try {
          const result = await db.collection(collectionName).insertOne({
            email: adminEmail,
            name: adminName,
            emailVerified: true,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          userId = result.insertedId.toString();
          userCollection = collectionName;
          created = true;
          console.log(`✅ Created admin user in collection: ${collectionName}`);
          break;
        } catch (error: any) {
          if (error.code === 11000) {
            // User already exists
            const user = await db.collection(collectionName).findOne({ email: adminEmail });
            if (user) {
              userId = user._id.toString();
              userCollection = collectionName;
              console.log(`✅ Found existing user in collection: ${collectionName}`);
              break;
            }
          }
        }
      }

      if (!created && !userId!) {
        // Try creating in 'user' collection (most common for Better Auth)
        const result = await db.collection('user').insertOne({
          email: adminEmail,
          name: adminName,
          emailVerified: true,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        userId = result.insertedId.toString();
        userCollection = 'user';
        console.log('✅ Created admin user in default collection');
      }
    }

    // Connect to Mongoose for UserProfile
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to Mongoose');

    // Import UserProfile model
    const { UserProfile } = await import('../src/lib/models');

    // Check if UserProfile already exists
    const existingProfile = await UserProfile.findOne({ email: adminEmail });
    
    if (existingProfile) {
      // Update existing profile to admin
      existingProfile.role = 'admin';
      existingProfile.status = 'active';
      existingProfile.userId = userId!;
      await existingProfile.save();
      console.log('✅ Updated existing UserProfile to admin');
    } else {
      // Create new UserProfile
      const userProfile = new UserProfile({
        userId: userId!,
        email: adminEmail,
        role: 'admin',
        status: 'active',
        firstName: 'Ayman',
        lastName: 'Allouch',
        totalAppointments: 0,
      });
      await userProfile.save();
      console.log('✅ Created UserProfile for admin');
    }

    // Also update the Better Auth user's isAdmin flag if it exists
    if (userCollection) {
      try {
        await db.collection(userCollection).updateOne(
          { email: adminEmail },
          { $set: { isAdmin: true } }
        );
        console.log('✅ Updated isAdmin flag in Better Auth user');
      } catch (error) {
        console.log('ℹ️  Could not update isAdmin flag (may not exist in schema)');
      }
    }

    console.log('\n🎉 Admin account seeded successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('👤 Role: admin');
    console.log('✅ Status: active');
    console.log('\nYou can now log in and approve therapist accounts.');

    await mongoose.disconnect();
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
}

// Run the seed script
seedAdmin();

