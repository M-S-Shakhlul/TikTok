// Post schema
import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  durationSec: { type: Number },
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  viewsCount: { type: Number, default: 0 },
  approved: { type: Boolean, default: false },
  tags: [String],
}, { timestamps: true });

export default mongoose.model("Post", postSchema);
