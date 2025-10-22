// Entry point
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes.js';

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

if (process.env.MONGO_URI) {
    mongoose
        .connect(process.env.MONGO_URI)
        .then(() => console.log('✅ MongoDB Connected'))
        .catch((err) => console.error('MongoDB connection error:', err));
} else {
    console.warn('⚠️  MONGO_URI not set. Skipping MongoDB connection (development).');
}

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => res.send('TikTok Clone API Running 🎬'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));