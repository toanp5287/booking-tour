export const errorMiddleware = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Có lỗi xảy ra trên server",
  });
};
export const validate = (schema) => {
  return (req, res, next) => {
    // Sửa req.body thành: req.body || {}
    const result = schema.safeParse(req.body || {});

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: result.error.issues,
      });
    }

    req.body = result.data;
    next();
  };
};
