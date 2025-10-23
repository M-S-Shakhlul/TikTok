// Express app setup
import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import multer from 'multer';

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// connect to DB
connectDB();

app.get("/", (req, res) => {
  res.send("🚀 TikTok Clone Backend API running...");
});
// Routes
import userRoutes from './routes/user.routes.js';
import postRoutes from './routes/posts.routes.js';
import commentRoutes from './routes/comments.routes.js';
import likeRoutes from './routes/likes.routes.js';
import followRoutes from './routes/follow.routes.js';
import notificationRoutes from "./routes/notifications.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/follows', followRoutes);
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
