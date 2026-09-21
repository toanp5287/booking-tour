import prisma from "../../config/postgres.js";
import { TourReview } from "./tourReviews.service.js";

export const createReview = async (req, res, next) => {
  try {
    const { tour_id, rating, joined_date, content } = req.body;

    const userId = req.user?.id;

    if (!userId || !tour_id || !rating || !content) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin bắt buộc.",
      });
    }

    const user = await prisma.users.findFirst({
      where: {
        id: BigInt(userId),
        status: "active",
        deleted_at: null,
      },
    });

    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản không hợp lệ hoặc đã bị khóa.",
      });
    }

    const result = await TourReview.create({
      tour_id: String(tour_id),
      user_id: String(userId),
      full_name: String(user.full_name),
      rating: Number(rating),
      joined_date: joined_date ? new Date(joined_date) : new Date(),
      content: content.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Bình luận thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// get all theo tour

export const getAllReviewsTour = async (req, res, nexts) => {
  try {
    const tourId = req.params.idTour;
    const result = await TourReview.find({
      tour_id: String(tourId),
    });
    return res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
