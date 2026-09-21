import prisma from "../config/postgres.js";

export const authorize = (...permissions) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Bạn chưa đăng nhập",
                });
            }

            const userPermissions = await prisma.role_permissions.findMany({
                where: {
                    role: {
                        user_roles: {
                            some: {
                                user_id: BigInt(req.user.id),
                                deleted_at: null
                            },
                        },
                    },
                    deleted_at: null,
                    permission: {
                        deleted_at: null,
                    },
                },
                select: {
                    permission: {
                        select: {
                            name: true,
                        },
                    },
                },
            });

            const permissionNames = userPermissions.map(
                (item) => item.permission.name
            );

            const hasPermission = permissions.some(
                (permission) => permissionNames.includes(permission)
            );

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: "Bạn không có quyền thực hiện hành động này",
                });
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};