import express from "express";
import authRouter from "./modules/auth/auth.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import user from "./modules/users/users.routes.js";
import roles from "./modules/roles/roles.routes.js";
import permissions from "./modules/permissions/permissions.routes.js";
import tourOperator from "./modules/tour-operators/tour_operators.routers.js";
import tour from "./modules/tours/tours.routes.js";
import destination from "./modules/destinations/destinations.routes.js";
import booking from "./modules/bookings/bookings.routers.js";
import payment from "./modules/payments/payments.routers.js";
import path from "path";
import cors from "cors";
import reviewsTour from "./modules/reviews/tourReviews.router.js";
import community from "./modules/community/community.router.js";
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://booking-tour-fkd0rk6q7-vinhabc.vercel.app",
    ],
    credentials: true,
  }),
);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/auth", authRouter);

app.use("/user", user);

app.use("/roles", roles);

app.use("/permissions", permissions);

app.use("/tourOperator", tourOperator);

app.use("/tour", tour);

app.use("/destination", destination);

app.use("/booking", booking);

app.use("/payment", payment);

app.use("/review", reviewsTour);
app.use("/community", community);
app.use(errorMiddleware);
export default app;
