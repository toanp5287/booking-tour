import mongoose from "mongoose";

const communityLikeSchema = new mongoose.Schema(
  {
    // ID bài viết
    post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityPost",
      required: true,
      index: true,
    },

    // ID người Like
    user_id: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Một user chỉ được Like một bài một lần
communityLikeSchema.index({ post_id: 1, user_id: 1 }, { unique: true });

export const CommunityLike = mongoose.model(
  "CommunityLike",
  communityLikeSchema,
);
