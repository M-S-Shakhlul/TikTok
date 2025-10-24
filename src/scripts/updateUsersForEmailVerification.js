// Migration script to add email verification fields to existing users
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

const updateExistingUsers = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Update all users that don't have the emailVerified field
        const result = await User.updateMany(
            { emailVerified: { $exists: false } },
            { 
                $set: { 
                    emailVerified: false,
                    emailVerificationToken: null
                } 
            }
        );

        console.log(`Updated ${result.modifiedCount} users with email verification fields`);

        // Close connection
        await mongoose.connection.close();
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

updateExistingUsers();
