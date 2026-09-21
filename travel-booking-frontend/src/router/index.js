import { createRouter, createWebHistory } from "vue-router";

const routes = [
  // =========================
  // CUSTOMER
  // =========================
  {
    path: "/",
    component: () => import("@/layouts/MainLayout.vue"),

    children: [
      {
        path: "",
        name: "home",
        component: () => import("@/view/customer/Home.vue"),
      },

      {
        path: "tours",
        name: "tour-list",
        component: () => import("@/view/customer/tours/TourList.vue"),
        meta: { hasHeroBg: true },
      },

      {
        path: "tours/:id",
        name: "tour-detail",
        component: () => import("@/view/customer/tours/TourDetail.vue"),
      },
      {
        path: "destinations",
        name: "destinations",
        component: () =>
          import("@/view/customer/destinations/DestinationList.vue"),
      },
      {
        path: "destinations/:id",
        name: "destinations-detail",
        component: () =>
          import("@/view/customer/destinations/DestinationDetail.vue"),
      },
      {
        path: "/booking",
        name: "booking",
        component: () => import("@/view/customer/booking/BookingCreate.vue"),
        meta: { hasHeroBg: true }, // Trang này có ảnh nền riêng tràn footer
      },
      {
        path: "myBooking",
        name: "myBooking",
        component: () => import("@/view/customer/booking/MyBookings.vue"),
        meta: { hasHeroBg: true },
      },
      {
        path: "booking-success",
        name: "booking-success",
        component: () => import("@/view/customer/booking/BookingSuccess.vue"),
        meta: { hasHeroBg: true },
      },
      {
        path: "payment/result",
        name: "PaymentResult",
        component: () => import("@/view/customer/booking/PaymentResult.vue"),
      },

      {
        path: "profile",
        name: "profile",
        component: () => import("@/view/customer/profile/Profile.vue"),
        meta: { hasHeroBg: true },
      },
      {
        path: "changePassword",
        name: "changePassword",
        component: () => import("@/view/customer/profile/ChangePassword.vue"),
        meta: { hasHeroBg: true },
      },
      {
        path: "community",
        name: "community",
        component: () => import("@/view/customer/Community/Community.vue"),
        meta: { hasHeroBg: true },
      },
      {
        path: "postDetail/:idArticle",
        name: "postDetail",
        component: () => import("@/view/customer/Community/PostDetail.vue"),
        meta: { hasHeroBg: true },
      },
      {
        path: "createPost",
        name: "createPost",
        component: () => import("@/view/customer/community/CreatePost.vue"),
        meta: { hasHeroBg: true },
      },
      {
        path: "myReviews",
        name: "myReviews",
        component: () => import("@/view/customer/reviews/MyReviews.vue"),
        meta: { hasHeroBg: true },
      },
      {
        path: "myFavorites",
        name: "myFavorites",
        component: () => import("@/view/customer/tours/TourFavorites.vue"),
        meta: { hasHeroBg: true },
      },
      {
        path: "aiTripPlanner",
        name: "aiTripPlanner",
        component: () => import("@/view/customer/ai/AITripPlanner.vue"),
        meta: { hasHeroBg: true },
      },
      {
        path: "aboutUs",
        name: "aboutUs",
        component: () => import("@/view/customer/aboutUs/AboutUsView.vue"),
        meta: { hasHeroBg: true },
      },
      {
        path: "createPost",
        name: "createPost",
        component: () => import("@/view/customer/community/CreatePost.vue"),
        meta: { hasHeroBg: true },
      },
      {
        path: "userExample",
        name: "userExample",
        component: () => import("@/view/customer/profile/UserExample.vue"),
        meta: { hasHeroBg: true },
      },
    ],
  },

  // =========================
  // AUTH
  // =========================
  {
    path: "/login",
    name: "login",
    component: () => import("@/view/customer/auth/Login.vue"),
  },

  {
    path: "/register",
    name: "register",
    component: () => import("@/view/customer/auth/Register.vue"),
  },

  // =========================
  // ADMIN
  // =========================
  {
    path: "/admin",
    component: () => import("@/layouts/AdminLayout.vue"),
    meta: {
      requiresAdmin: true,
    },
    children: [
      {
        path: "",
        name: "admin-dashboard",
        component: () => import("@/view/admin/Dashboard.vue"),
      },

      {
        path: "tours",
        name: "admin-tours",
        component: () => import("@/view/admin/tours/TourList.vue"),
      },
      {
        path: "tours/:id",
        name: "admin-tours-detail",
        component: () => import("@/view/admin/tours/TourDetail.vue"),
      },
      {
        path: "create",
        name: "tour-create",
        component: () => import("@/view/admin/tours/TourCreate.vue"),
      },
      {
        path: "edit/:id",
        name: "tour-edit",
        component: () => import("@/view/admin/tours/TourEdit.vue"),
      },
      {
        path: "destinations",
        name: "destinations1",
        component: () =>
          import("@/view/admin/destinations/DestinationList.vue"),
      },
      {
        path: "destination/:id",
        name: "destination-detail",
        component: () =>
          import("@/view/admin/destinations/DestinatonDetail.vue"),
      },
      {
        path: "destination/create",
        name: "destination-create",
        component: () =>
          import("@/view/admin/destinations/DestinationCreate.vue"),
      },
      {
        path: "destination/:id/edit",
        name: "destination-edit",
        component: () =>
          import("@/view/admin/destinations/DestinationEdit.vue"),
      },
      {
        path: "itineraries",
        name: "itineraries",
        component: () =>
          import("@/view/admin/itineraries/ItineraryManagement.vue"),
      },
      {
        path: "createItineraries/:itineraryId",
        name: "createItineraries",
        component: () => import("@/view/admin/itineraries/createItinerary.vue"),
      }, // thieu phan sua lich trinh

      {
        path: "bookingList",
        name: "bookingList",
        component: () => import("@/view/admin/bookings/BookingList.vue"),
      },
      {
        path: "bookingDetail/:id",
        name: "bookingDetail",
        component: () => import("@/view/admin/bookings/BookingDetail.vue"),
      },
      {
        path: "users",
        name: "users",
        component: () => import("@/view/admin/users/UserList.vue"),
      },
      {
        path: "users/:id",
        name: "usersDetail",
        component: () => import("@/view/admin/users/UserDetail.vue"),
      },
      {
        path: "roles",
        name: "roles",
        component: () => import("@/view/admin/users/roles.vue"),
      },
    ],
  },
];
const router = createRouter({
  history: createWebHistory(),
  routes,
});
router.beforeEach((to) => {
  const userData = localStorage.getItem("user");

  if (to.matched.some((route) => route.meta.requiresAdmin)) {
    if (!userData) {
      return "/login";
    }

    const user = JSON.parse(userData);

    // ADMIN hoặc QUẢN LÝ TOUR
    if (user.role_id !== "1" && user.role_id !== "3") {
      return "/";
    }
  }

  return true;
});
export default router;
