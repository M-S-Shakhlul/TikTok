import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
    try {
        const user = process.env.MONGO_USER;
        const pass = process.env.MONGO_PASS;
        const host = process.env.MONGO_HOST;
        const dbName = process.env.MONGO_DB_NAME;

        if (!user || !pass) {
            console.error('❌ MONGO_USER or MONGO_PASS not defined in .env');
            process.exit(1);
        }

        // URL encode credentials
        const encodedUser = encodeURIComponent(user);
        const encodedPass = encodeURIComponent(pass);

        const uri = `mongodb+srv://${encodedUser}:${encodedPass}@${host}/${dbName}?retryWrites=true&w=majority`;

        console.log('🔄 Attempting connection to MongoDB Atlas...');
        console.log(`Host: ${host}`);
        console.log(`Database: ${dbName}`);
        console.log(`Username: ${user}`);

        await mongoose.connect(uri, {
            maxPoolSize: 10
        });

        // Test: List collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n✅ Connected successfully to MongoDB Atlas!');
        console.log('\nAvailable collections:');
        collections.forEach(c => console.log(`- ${c.name}`));

        // Test: Count documents in main collections
        const counts = await Promise.all([
            mongoose.connection.db.collection('users').countDocuments(),
            mongoose.connection.db.collection('posts').countDocuments(),
            mongoose.connection.db.collection('likes').countDocuments(),
            mongoose.connection.db.collection('comments').countDocuments()
        ]);

        console.log('\nCollection counts:');
        console.log(`Users: ${counts[0]}`);
        console.log(`Posts: ${counts[1]}`);
        console.log(`Likes: ${counts[2]}`);
        console.log(`Comments: ${counts[3]}`);

    } catch (err) {
        console.error('\n❌ Connection failed!');
        console.error('Error details:', err.message);
        if (err.message.includes('bad auth')) {
            console.log('\n🔧 Troubleshooting steps:');
            console.log('1. Verify credentials in .env match Atlas Database Access');
            console.log('2. Check if IP is whitelisted in Atlas Network Access');
            console.log('3. Try creating a new database user in Atlas:');
            console.log('   - Go to Security → Database Access');
            console.log('   - Add New Database User');
            console.log('   - Authentication Method: Password');
            console.log('   - Set username and a new password');
            console.log('   - Built-in Role: Read and write to any database');
            console.log('   - Update .env with new credentials');
        }
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

testConnection();