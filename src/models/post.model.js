import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
  url: String,
  resolution: String,   // "720p" مثلاً
  bitrate: Number,
  sizeBytes: Number,
});

const thumbnailSchema = new mongoose.Schema({
  url: String,
  width: Number,
  height: Number,
  timeSec: Number, // الوقت اللي اتاخدت منه الصورة
});

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  videoUrl: { type: String, required: true },
  storageKey: { type: String },
  mimeType: { type: String },
  sizeBytes: { type: Number },
  variants: [variantSchema],
  thumbnails: [thumbnailSchema],
  posterUrl: { type: String },
  durationSec: { type: Number },
  format: { type: String },
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  viewsCount: { type: Number, default: 0 },
  approved: { type: Boolean, default: false },
  processingStatus: { type: String, enum: ["pending","processing","ready","failed"], default: "ready" },
  isFlagged: { type: Boolean, default: false },
  reportsCount: { type: Number, default: 0 },
  moderationReason: { type: String },
  tags: [String],
  category: { type: String },
  visibility: { type: String, enum: ["public","private"], default: "public" },
}, { timestamps: true });

export default mongoose.model("Post", postSchema);
