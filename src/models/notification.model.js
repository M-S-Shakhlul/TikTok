import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // added 'reply' type and keep existing types
    type: { type: String, enum: ["follow", "like", "comment", "reply"], required: true },
    message: String,
    read: { type: Boolean, default: false },
    relatedPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    relatedComment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
    relatedReply: { type: mongoose.Schema.Types.ObjectId, ref: "Reply" },
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);