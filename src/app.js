// Express app setup
import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

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

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/follows', followRoutes);

export default app;
