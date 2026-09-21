import mongoose from "mongoose";

const communityCommentSchema = new mongoose.Schema(
  {
    // ID bài viết
    post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityPost",
      required: true,
      index: true,
    },

    // Người bình luận
    user_id: {
      type: String,
      required: true,
      index: true,
    },

    // Snapshot thông tin người bình luận
    full_name: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    // Nội dung bình luận
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Load comment của bài viết theo thời gian
communityCommentSchema.index({
  post_id: 1,
  createdAt: -1,
});

export const CommunityComment = mongoose.model(
  "CommunityComment",
  communityCommentSchema,
);
