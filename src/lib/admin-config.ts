/**
 * Admin configuration
 * This file contains admin-related settings and utilities
 */

import { MongoClient } from 'mongodb';

/**
 * Check if an email belongs to an admin by querying the database
 * @param email - The email to check
 * @returns boolean indicating if the email is an admin
 */
export async function isAdminEmail(email: string): Promise<boolean> {
  try {
    const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017");
    await client.connect();
    const db = client.db();
    const user = await db.collection('user').findOne({ email });
    await client.close();
    return user?.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get all admin emails by querying the database
 * @returns Array of admin email addresses
 */
export async function getAdminEmails(): Promise<string[]> {
  try {
    const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017");
    await client.connect();
    const db = client.db();
    const admins = await db.collection('user').find({ isAdmin: true }).toArray();
    await client.close();
    return admins.map(admin => admin.email);
  } catch (error) {
    console.error('Error getting admin emails:', error);
    return [];
  }
}

/**
 * Add an admin email by updating the user document in database
 * @param email - The email to add as admin
 */
export async function addAdminEmail(email: string): Promise<boolean> {
  try {
    const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017");
    await client.connect();
    const db = client.db();
    const result = await db.collection('user').updateOne(
      { email },
      { $set: { isAdmin: true } }
    );
    await client.close();
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error adding admin email:', error);
    return false;
  }
}

/**
 * Remove an admin email by updating the user document in database
 * @param email - The email to remove from admins
 */
export async function removeAdminEmail(email: string): Promise<boolean> {
  try {
    const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017");
    await client.connect();
    const db = client.db();
    const result = await db.collection('user').updateOne(
      { email },
      { $set: { isAdmin: false } }
    );
    await client.close();
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error removing admin email:', error);
    return false;
  }
}
