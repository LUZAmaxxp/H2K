/**
 * Seed script to create an admin account
 * Run with: npm run seed:admin
 * or: node scripts/seed-admin.js
 * 
 * Make sure MONGODB_URI is set in your .env file
 */

require('dotenv').config({ path: '.env' });
const { MongoClient, ObjectId } = require('mongodb');
const { hash } = require('@node-rs/argon2');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auth_next';

async function seedAdmin() {
  let client;
  try {
    console.log('🌱 Starting admin seed script...');
    console.log('📦 Connecting to MongoDB...');

    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();

    // List all collections for debugging
    console.log('\n📋 Checking existing collections...');
    const collections = await db.listCollections().toArray();
    console.log('   Collections found:', collections.map(c => c.name).join(', '));

    // Admin credentials
    const adminEmail = 'ayman.allouch@e-polytechnique.ma';
    const adminPassword = 'Aymanos007';
    const adminName = 'Ayman Allouch';

    console.log(`\n👤 Creating admin account:`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Name: ${adminName}`);

    // Better Auth uses 'user' collection - check there first
    const userCollection = 'user';
    let existingUser = null;
    let userId = null;

    // First, check if user exists in wrong collections and remove them
    const wrongCollections = ['better_auth_users', 'users', 'accounts'];
    for (const wrongCollection of wrongCollections) {
      try {
        const wrongUser = await db.collection(wrongCollection).findOne({ email: adminEmail });
        if (wrongUser) {
          console.log(`⚠️  Found user in wrong collection '${wrongCollection}', removing...`);
          await db.collection(wrongCollection).deleteOne({ email: adminEmail });
          console.log(`✅ Removed user from '${wrongCollection}'`);
        }
      } catch (error) {
        // Collection doesn't exist, continue
      }
    }

    // Check if admin user already exists in 'user' collection (the correct one)
    try {
      existingUser = await db.collection(userCollection).findOne({ email: adminEmail });
      if (existingUser) {
        console.log(`\n📋 Found existing user in collection: ${userCollection}`);
        // Convert ObjectId to string - Better Auth uses string IDs in sessions
        userId = existingUser._id.toString();
        console.log(`   User ID: ${userId}`);
      }
    } catch (error) {
      console.log(`ℹ️  Collection '${userCollection}' check:`, error.message);
    }

    if (!existingUser) {
      // Hash password using Argon2 (same as Better Auth)
      console.log('🔐 Hashing password...');
      const hashedPassword = await hash(adminPassword);
      console.log('✅ Password hashed');

      // Create user in 'user' collection (Better Auth's collection)
      try {
        const result = await db.collection(userCollection).insertOne({
          email: adminEmail,
          name: adminName,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        // Convert ObjectId to string - Better Auth uses string IDs in sessions
        userId = result.insertedId.toString();
        console.log(`✅ Created admin user in collection: ${userCollection}`);
        console.log(`   User ID: ${userId}`);
      } catch (error) {
        if (error.code === 11000) {
          // User already exists (duplicate key)
          const user = await db.collection(userCollection).findOne({ email: adminEmail });
          if (user) {
            userId = user._id.toString();
            console.log(`✅ Found existing user in collection: ${userCollection}`);
            console.log(`   User ID: ${userId}`);
          } else {
            throw new Error('User exists but could not be retrieved');
          }
        } else {
          throw error;
        }
      }

      // Create credential record (Better Auth stores passwords separately)
      // Better Auth uses 'credential' collection with userId as ObjectId or string reference
      console.log('\n🔐 Creating credential record...');
      console.log(`   User ID: ${userId} (type: ${typeof userId})`);
      
      const credentialCollection = 'credential';
      
      // Try both string and ObjectId formats for userId
      const userIdAsObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
      
      try {
        // Check if credential already exists (try both formats)
        let existingCredential = await db.collection(credentialCollection).findOne({ 
          userId: userId 
        });
        
        if (!existingCredential && ObjectId.isValid(userId)) {
          existingCredential = await db.collection(credentialCollection).findOne({ 
            userId: userIdAsObjectId 
          });
        }
        
        if (existingCredential) {
          // Update existing credential
          await db.collection(credentialCollection).updateOne(
            { _id: existingCredential._id },
            { 
              $set: {
                userId: userId, // Ensure it's stored as string
                password: hashedPassword,
                updatedAt: new Date()
              }
            }
          );
          console.log(`✅ Updated credential in collection: ${credentialCollection}`);
        } else {
          // Create new credential - Better Auth expects userId as string
          await db.collection(credentialCollection).insertOne({
            userId: userId, // Store as string (Better Auth format)
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          console.log(`✅ Created credential in collection: ${credentialCollection}`);
        }
      } catch (error) {
        console.log(`⚠️  Error with 'credential' collection: ${error.message}`);
        console.log(`   Trying alternative collection names...`);
        
        // Try alternative collection names
        const altCredentialCollections = ['credentials', 'better_auth_credentials'];
        let credentialCreated = false;
        
        for (const altCollection of altCredentialCollections) {
          try {
            let existingCredential = await db.collection(altCollection).findOne({ 
              userId: userId 
            });
            
            if (!existingCredential && ObjectId.isValid(userId)) {
              existingCredential = await db.collection(altCollection).findOne({ 
                userId: userIdAsObjectId 
              });
            }
            
            if (existingCredential) {
              await db.collection(altCollection).updateOne(
                { _id: existingCredential._id },
                { 
                  $set: {
                    userId: userId,
                    password: hashedPassword,
                    updatedAt: new Date()
                  }
                }
              );
              console.log(`✅ Updated credential in collection: ${altCollection}`);
              credentialCreated = true;
              break;
            } else {
              await db.collection(altCollection).insertOne({
                userId: userId,
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
              console.log(`✅ Created credential in collection: ${altCollection}`);
              credentialCreated = true;
              break;
            }
          } catch (altError) {
            console.log(`   Failed to use '${altCollection}': ${altError.message}`);
            continue;
          }
        }
        
        if (!credentialCreated) {
          console.log(`\n❌ Could not create credential record in any collection!`);
          console.log(`   This is required for login. Please check:`);
          console.log(`   1. MongoDB connection is working`);
          console.log(`   2. You have write permissions`);
          console.log(`   3. Better Auth collection name is 'credential'`);
          throw new Error('Failed to create credential record');
        }
      }
    } else {
      // User exists, but check if credential exists
      console.log('⚠️  User exists but checking for credential...');
      const credentialCollection = 'credential';
      const { ObjectId } = require('mongodb');
      const userIdAsObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
      
      try {
        // Try both string and ObjectId formats
        let existingCredential = await db.collection(credentialCollection).findOne({ 
          userId: userId 
        });
        
        if (!existingCredential && ObjectId.isValid(userId)) {
          existingCredential = await db.collection(credentialCollection).findOne({ 
            userId: userIdAsObjectId 
          });
        }
        
        if (!existingCredential) {
          // User exists but no credential - create it
          console.log('⚠️  User exists but no credential found. Creating credential...');
          const hashedPassword = await hash(adminPassword);
          
          await db.collection(credentialCollection).insertOne({
            userId: userId, // Store as string
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          console.log(`✅ Created credential for existing user`);
        } else {
          // Update password if credential exists
          console.log('✅ Credential exists, updating password...');
          const hashedPassword = await hash(adminPassword);
          await db.collection(credentialCollection).updateOne(
            { _id: existingCredential._id },
            { 
              $set: {
                userId: userId,
                password: hashedPassword,
                updatedAt: new Date()
              }
            }
          );
          console.log(`✅ Updated credential password`);
        }
      } catch (error) {
        console.log(`⚠️  Error with 'credential' collection: ${error.message}`);
        // Try alternative collection names
        const altCredentialCollections = ['credentials', 'better_auth_credentials'];
        let credentialFound = false;
        
        for (const altCollection of altCredentialCollections) {
          try {
            let existingCredential = await db.collection(altCollection).findOne({ 
              userId: userId 
            });
            
            if (!existingCredential && ObjectId.isValid(userId)) {
              existingCredential = await db.collection(altCollection).findOne({ 
                userId: userIdAsObjectId 
              });
            }
            
            if (!existingCredential) {
              const hashedPassword = await hash(adminPassword);
              await db.collection(altCollection).insertOne({
                userId: userId,
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
              console.log(`✅ Created credential in collection: ${altCollection}`);
              credentialFound = true;
              break;
            } else {
              // Update password
              const hashedPassword = await hash(adminPassword);
              await db.collection(altCollection).updateOne(
                { _id: existingCredential._id },
                { 
                  $set: {
                    userId: userId,
                    password: hashedPassword,
                    updatedAt: new Date()
                  }
                }
              );
              console.log(`✅ Updated credential in collection: ${altCollection}`);
              credentialFound = true;
              break;
            }
          } catch (altError) {
            continue;
          }
        }
        
        if (!credentialFound) {
          console.log(`\n❌ Could not create/update credential!`);
          console.log(`   Error: ${error.message}`);
          throw new Error('Failed to create credential record');
        }
      }
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

    // Create/Update UserProfile directly in MongoDB
    console.log('\n📦 Creating UserProfile...');
    
    const userProfilesCollection = db.collection('userprofiles');
    
    // Check if UserProfile already exists
    const existingProfile = await userProfilesCollection.findOne({ email: adminEmail });
    
    const userProfileData = {
      userId: userId,
      email: adminEmail,
      role: 'admin',
      status: 'active',
      firstName: 'Ayman',
      lastName: 'Allouch',
      totalAppointments: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    if (existingProfile) {
      // Update existing profile to admin
      await userProfilesCollection.updateOne(
        { email: adminEmail },
        { 
          $set: {
            ...userProfileData,
            updatedAt: new Date()
          }
        }
      );
      console.log('✅ Updated existing UserProfile to admin');
    } else {
      // Create new UserProfile
      await userProfilesCollection.insertOne(userProfileData);
      console.log('✅ Created UserProfile for admin');
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Admin account seeded successfully!');
    console.log('='.repeat(50));
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('👤 Role: admin');
    console.log('✅ Status: active');
    console.log('\n💡 You can now log in and approve therapist accounts.');
    console.log('='.repeat(50) + '\n');

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding admin:', error);
    if (error.message) {
      console.error('Error message:', error.message);
    }
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the seed script
seedAdmin();
