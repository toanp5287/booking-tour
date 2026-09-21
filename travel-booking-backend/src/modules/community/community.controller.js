import { CommunityPost } from "./CommunityPost.service.js";
import { CommunityComment } from "./CommunityComment.service.js";
import prisma from "../../config/postgres.js";
import { CommunityLike } from "./CommunityLike.service.js";
export const createCommunity = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { content, hashtags, location, tour_id } = req.body;

    const image = req.file;

    const user = await prisma.users.findFirst({
      where: {
        id: BigInt(userId),
      },
      select: {
        id: true,
        full_name: true,
        avatar_url: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        message: "Tài khoản của bạn không được phép đăng bài",
      });
    }

    let tour = null;

    if (tour_id) {
      tour = await prisma.tours.findUnique({
        where: {
          id: BigInt(tour_id),
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!tour) {
        return res.status(404).json({
          message: "Không tìm thấy tour",
        });
      }
    }

    const data = {
      author: {
        user_id: user.id.toString(),
        full_name: user.full_name,
        avatar: user.avatar_url,
        is_verified: user.status === "active",
      },

      content: content,

      images: image ? [`uploads/community/${image.filename}`] : [],

      hashtags: hashtags
        ? Array.isArray(hashtags)
          ? hashtags
          : [hashtags]
        : [],

      location: location || "",

      tour_attachment: tour
        ? {
            tour_id: tour.id.toString(),
            tour_name: tour.name,
          }
        : {
            tour_id: null,
            tour_name: "",
          },

      likes_count: 0,
      comments_count: 0,
    };

    const post = await CommunityPost.create(data);

    return res.status(201).json({
      success: true,
      message: "Đăng bài thành công",
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleLike = async (req, res, next) => {
  try {
    const userId = req.user.id.toString();
    const post_id = req.params.id;

    const post = await CommunityPost.findById(post_id);

    if (!post) {
      return res.status(404).json({
        message: "Không tìm thấy bài viết",
      });
    }

    const like = await CommunityLike.findOne({
      post_id: post_id,
      user_id: userId,
    });

    if (like) {
      await CommunityLike.deleteOne({
        _id: like._id,
      });

      await CommunityPost.findByIdAndUpdate(post_id, {
        $inc: {
          likes_count: -1,
        },
      });

      return res.status(200).json({
        message: "Đã bỏ thích",
        liked: false,
      });
    }

    await CommunityLike.create({
      post_id: post_id,
      user_id: userId,
    });

    await CommunityPost.findByIdAndUpdate(post_id, {
      $inc: {
        likes_count: 1,
      },
    });

    return res.status(200).json({
      message: "Đã thích bài viết",
      liked: true,
    });
  } catch (error) {
    next(error);
  }
};

export const createComment = async (req, res, next) => {
  try {
    const { post_id, content } = req.body;

    const userId = req.user.id;

    const post = await CommunityPost.findById(post_id);

    if (!post) {
      return res.status(404).json({
        message: "Không tìm thấy bài viết",
      });
    }

    const user = await prisma.users.findFirst({
      where: {
        id: BigInt(userId),
      },
      select: {
        id: true,
        full_name: true,
        avatar_url: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        message: "Tài khoản của bạn không được phép bình luận",
      });
    }

    const result = await CommunityComment.create({
      post_id: post_id,
      user_id: user.id.toString(),
      full_name: user.full_name ?? "",
      avatar: user.avatar_url ?? "",
      content: content,
    });

    await CommunityPost.findByIdAndUpdate(post_id, {
      $inc: {
        comments_count: 1,
      },
    });

    return res.status(201).json({
      message: "Comment thành công",
      comment: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;

    const comment = await CommunityComment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Không tìm thấy comment",
      });
    }

    await CommunityComment.deleteOne({
      _id: commentId,
    });

    await CommunityPost.findByIdAndUpdate(comment.post_id, {
      $inc: {
        comments_count: -1,
      },
    });

    return res.status(200).json({
      message: "Xóa comment thành công",
      comment: true,
    });
  } catch (error) {
    next(error);
  }
};

// get all

export const getAllCommunity = async (req, res, next) => {
  try {
    const posts = await CommunityPost.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

// theo comment theo tung bai

import mongoose from "mongoose";

export const getCommentPost = async (req, res, next) => {
  try {
    const idPost = req.params.id;

    if (!idPost) {
      return res.status(400).json({
        success: false,
        message: "Thiếu ID bài viết",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(idPost)) {
      return res.status(400).json({
        success: false,
        message: "ID bài viết không hợp lệ",
      });
    }

    const result = await CommunityComment.find({
      post_id: new mongoose.Types.ObjectId(idPost),
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
