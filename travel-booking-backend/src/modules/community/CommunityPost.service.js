import mongoose from "mongoose";

const communityPostSchema = new mongoose.Schema(
  {
    // =========================
    // NGƯỜI ĐĂNG
    // =========================
    author: {
      user_id: {
        type: String,
        required: true,
        index: true,
      },

      full_name: {
        type: String,
        required: true,
      },

      avatar: {
        type: String,
        default: "",
      },

      is_verified: {
        type: Boolean,
        default: false,
      },
    },

    // =========================
    // NỘI DUNG BÀI ĐĂNG
    // =========================
    content: {
      type: String,
      required: true,
      trim: true,
    },

    // =========================
    // ẢNH / VIDEO
    // =========================
    images: {
      type: [String],
      default: [],
    },

    // =========================
    // HASHTAG
    // =========================
    hashtags: {
      type: [String],
      default: [],
    },

    // =========================
    // ĐỊA ĐIỂM
    // =========================
    location: {
      type: String,
      default: "",
      trim: true,
    },

    // =========================
    // TOUR ĐƯỢC CHIA SẺ
    // =========================
    tour_attachment: {
      tour_id: {
        type: String,
        default: null,
      },

      tour_name: {
        type: String,
        default: "",
      },
    },

    // =========================
    // THỐNG KÊ
    // =========================
    likes_count: {
      type: Number,
      default: 0,
    },

    comments_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Load bài viết mới nhất
communityPostSchema.index({
  createdAt: -1,
});

export const CommunityPost = mongoose.model(
  "CommunityPost",
  communityPostSchema,
);
