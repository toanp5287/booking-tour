import api from "./api";

const reviewService = {
  createReview(data) {
    return api.post("/review/createReview", data);
  },
  tourReviewDetail(id) {
    return api.get(`/review/${id}/all`);
  },
};

export default reviewService;
