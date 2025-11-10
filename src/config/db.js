// // DB config
// import mongoose from "mongoose";

// export const connectDB = async () => {
//   const user = process.env.MONGO_USER;
//   const pass = process.env.MONGO_PASS;
//   const dbName = process.env.MONGO_DB_NAME || "tiktok_clone";
//   const host = "cluster0.v7oatnz.mongodb.net"; 

//   if (!user || !pass) {
//     console.error("❌ MONGO_USER or MONGO_PASS not defined in .env");
//     process.exit(1);
//   }

//   const encodedUser = encodeURIComponent(user);
//   const encodedPass = encodeURIComponent(pass);

//   const uri = `mongodb+srv://${encodedUser}:${encodedPass}@${host}/${dbName}?retryWrites=true&w=majority`;

//   try {
//     await mongoose.connect(uri, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   maxPoolSize: 10, 
// });

//     console.log("✅ Connected to MongoDB successfully");
//   } catch (err) {
//     console.error("❌ MongoDB connection failed:", err.message);
//     process.exit(1);
//   }
// };

// Maria
// DB config
import mongoose from "mongoose";

export const connectDB = async() => {
    try {
        const envUri = process.env.MONGO_URI;
        let uri;
        let source = 'env:MONGO_URI';

        if (envUri && envUri.trim() !== '') {
            uri = envUri.trim();
        } else {
            // build from components (safer when you store user/pass separately)
            const user = process.env.MONGO_USER;
            const pass = process.env.MONGO_PASS;
            const dbName = process.env.MONGO_DB_NAME || 'tiktok_clone';
            const host = process.env.MONGO_HOST || 'cluster0.j2zfbq7.mongodb.net';

            if (!user || !pass) {
                console.error('❌ MONGO_URI not defined and MONGO_USER/MONGO_PASS missing in .env');
                process.exit(1);
            }

            const encodedUser = encodeURIComponent(user);
            const encodedPass = encodeURIComponent(pass);
            uri = `mongodb+srv://${encodedUser}:${encodedPass}@${host}/${dbName}?retryWrites=true&w=majority`;
            source = 'constructed:MONGO_USER/MONGO_PASS';
        }

        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`✅ Connected to MongoDB successfully (${source})`);
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message || err);
        process.exit(1);
    }
};