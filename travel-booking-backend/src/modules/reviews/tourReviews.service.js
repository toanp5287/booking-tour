import mongoose from "mongoose";

const tourReviewSchema = new mongoose.Schema(
  {
    tour_id: {
      type: String,
      required: true,
      index: true,
    },

    user_id: {
      type: String,
      required: true,
    },
    full_name: { type: String, require: true },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    joined_date: {
      type: Date,
      default: Date.now,
    },

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

export const TourReview = mongoose.model("TourReview", tourReviewSchema);
