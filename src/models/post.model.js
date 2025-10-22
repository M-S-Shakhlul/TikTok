// Post schema
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalUrl: { type: String, required: true },
    copies: [
      {
        url: String,
        resolution: String,
        sizeBytes: Number,
      },
    ],
    thumbnailUrl: String,
    durationSec: Number,
    format: String,
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    approved: { type: Boolean, default: false },
    tags: [String],
  },
  { timestamps: true }
);

export default mongoose.model('Post', postSchema);
