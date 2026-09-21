export const successResponse = (
    res,
    {
        data = null,
        message = "Thành công",
        statusCode = 200,
        meta = null
    } = {}
) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        ...(meta && { meta })
    });
};


export const errorResponse = (
    res,
    {
        message = "Có lỗi xảy ra",
        statusCode = 500,
        errors = null
    } = {}
) => {
    return res.status(statusCode).json({
        success: false,
        message,
        ...(errors && { errors })
    });
};