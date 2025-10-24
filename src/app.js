// Express app setup
import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import multer from 'multer';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));

// connect to DB
connectDB();

app.get("/", (req, res) => {
  res.send("🚀 TikTok Clone Backend API running...");
});
// Routes
import userRoutes from './routes/user.routes.js';
import postRoutes from './routes/posts.routes.js';
import commentRoutes from './routes/comments.routes.js';
import repliesRoutes from './routes/replies.routes.js';
import likeRoutes from './routes/likes.routes.js';
import followRoutes from './routes/follow.routes.js';
import notificationRoutes from "./routes/notifications.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

// auth routes (mounted)
app.use('/api/auth', authRoutes);

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/replies', repliesRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/follows', followRoutes);
// Backwards-compatible singular route (some clients may call /api/follow)
app.use('/api/follow', followRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/uploads", uploadRoutes);

// Multer-aware error handler and generic error handler
app.use((err, req, res, next) => {
  if (!err) return next();
  if (err instanceof multer.MulterError || err.name === 'MulterError') {
    return res.status(400).json({ error: err.message, code: err.code || 'MULTER_ERROR' });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: err.message || 'Internal Server Error' });
});

export default app;
