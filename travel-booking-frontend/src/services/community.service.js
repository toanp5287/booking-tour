import api from "./api";

const communityService = {
  getAll() {
    return api.get("/community/all");
  },
  createPost(data) {
    return api.post("/community", data);
  },
  toggleLike(id) {
    return api.patch(`/community/${id}/like`);
  },
  createComment(data) {
    return api.post(`/community/comment`, data);
  },
  delete(id) {
    return api.delete(`/community/${id}/deleteComment`);
  },
  getAllComment(id) {
    return api.get(`/community/${id}/getAllComment`);
  },
};
export default communityService;
// export default authService;
// router.post("/", verifyToken, createCommunity);
// router.patch("/:id/like", verifyToken, toggleLike);
// router.post("/comment", verifyToken, createComment);
// router.delete("/:id/deleteComment", verifyToken, deleteComment);
