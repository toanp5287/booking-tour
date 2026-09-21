<script setup>
import { ref, computed } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import Swal from "sweetalert2";

import bookingService from "../../../services/booking.service";
import reviewService from "../../../services/review.service";

const router = useRouter();
const queryClient = useQueryClient();

// ======================================================
// 1. USER AUTH
// ======================================================
const currentUser = computed(() => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
});

const userId = computed(() => currentUser.value?.id);

// ======================================================
// 2. BOOKINGS DATA RETRIEVAL
// ======================================================
const { data: rawBookings, isLoading } = useQuery({
  queryKey: ["myBookingData", userId],
  queryFn: async () => {
    const res = await bookingService.bookingUser();
    return Array.isArray(res?.data?.data) ? res.data.data : [];
  },
  enabled: computed(() => !!userId.value),
  staleTime: 1000 * 60 * 5,
});

const bookings = computed(() => {
  return Array.isArray(rawBookings.value) ? rawBookings.value : [];
});

// ======================================================
// 3. NORMALIZE STATUS (Duy nhất 1 khai báo)
// ======================================================
const normalizeStatus = (status) => {
  const s = String(status || "")
    .toLowerCase()
    .trim();

  if (["confirm", "confirmed"].includes(s)) return "confirmed";
  if (["ready", "locked", "processing"].includes(s)) return "ready";
  if (["ongoing", "in_progress"].includes(s)) return "ongoing";
  if (s === "paid") return "paid";
  if (["refund_pending", "refundpending"].includes(s)) return "refund_pending";
  if (["refunded", "refund"].includes(s)) return "refunded";
  if (s === "completed") return "completed";
  if (["cancelled", "canceled"].includes(s)) return "cancelled";

  return "pending";
};

// ======================================================
// 4. PAYMENT HELPERS
// ======================================================
const getPayments = (booking) => {
  return Array.isArray(booking?.payments) ? booking.payments : [];
};

const getPaidPayment = (booking) => {
  return getPayments(booking).find((payment) => {
    return (
      String(payment?.status || "")
        .toLowerCase()
        .trim() === "paid"
    );
  });
};

const isPaymentPaid = (booking) => {
  if (!booking) return false;
  if (normalizeStatus(booking.status) === "paid") return true;
  return !!getPaidPayment(booking);
};

const getLatestPayment = (booking) => {
  const payments = getPayments(booking);
  return payments.length ? payments[0] : null;
};

// ======================================================
// 5. STATUS BADGE
// ======================================================
const getBadge = (status) => {
  const s = normalizeStatus(status);

  switch (s) {
    case "pending":
      return {
        text: "Đang chờ duyệt",
        class: "border-amber-400/30 bg-amber-400/15 text-amber-300",
      };
    case "confirmed":
      return {
        text: "Đã xác nhận",
        class: "border-blue-400/30 bg-blue-400/15 text-blue-300",
      };
    case "paid":
      return {
        text: "Đã thanh toán",
        class: "border-emerald-400/30 bg-emerald-400/15 text-emerald-300",
      };
    case "ready":
      return {
        text: "Sắp khởi hành (Khóa sổ)",
        class: "border-cyan-400/30 bg-cyan-400/15 text-cyan-300",
      };
    case "ongoing":
      return {
        text: "Đang diễn ra",
        class: "border-teal-400/30 bg-teal-400/15 text-teal-300",
      };
    case "refund_pending":
      return {
        text: "Chờ hoàn tiền",
        class: "border-amber-400/30 bg-amber-400/15 text-amber-200",
      };
    case "refunded":
      return {
        text: "Đã hoàn tiền",
        class: "border-emerald-400/30 bg-emerald-400/15 text-emerald-200",
      };
    case "completed":
      return {
        text: "Hoàn thành",
        class: "border-purple-400/30 bg-purple-400/15 text-purple-300",
      };
    case "cancelled":
      return {
        text: "Đã hủy",
        class: "border-red-400/30 bg-red-400/15 text-red-300",
      };
    default:
      return {
        text: s,
        class: "border-white/20 bg-white/10 text-white",
      };
  }
};

// ======================================================
// 6. PAYMENT TEXT & COLOR
// ======================================================
const getPaymentText = (booking) => {
  if (!booking) return "Chưa xác định";

  if (isPaymentPaid(booking)) {
    return "Đã thanh toán";
  }

  const payment = getLatestPayment(booking);
  if (!payment) return "Chưa thanh toán";

  const status = String(payment?.status || "")
    .toLowerCase()
    .trim();

  switch (status) {
    case "pending":
      return "Chờ thanh toán";
    case "failed":
      return "Thanh toán thất bại";
    case "cancelled":
    case "canceled":
      return "Thanh toán đã hủy";
    default:
      return "Chưa thanh toán";
  }
};

const getPaymentTextColor = (booking) => {
  if (!booking) return "text-white/60";

  if (isPaymentPaid(booking)) {
    return "text-emerald-300";
  }

  const payment = getLatestPayment(booking);
  if (!payment) return "text-orange-300";

  const status = String(payment?.status || "")
    .toLowerCase()
    .trim();

  switch (status) {
    case "pending":
      return "text-amber-300";
    case "failed":
    case "cancelled":
    case "canceled":
      return "text-red-300";
    default:
      return "text-orange-300";
  }
};

// ======================================================
// 7. BUTTON PERMISSION LOGIC
// ======================================================
const canPay = (booking) => {
  if (!booking) return false;
  if (isPaymentPaid(booking)) return false;

  const status = normalizeStatus(booking.status);
  return ["pending", "confirmed"].includes(status);
};

const canCancel = (booking) => {
  if (!booking) return false;
  if (isPaymentPaid(booking)) return false;

  const status = normalizeStatus(booking.status);
  return ["pending", "confirmed"].includes(status);
};

const canRefund = (booking) => {
  if (!booking) return false;
  if (!isPaymentPaid(booking)) return false;

  const status = normalizeStatus(booking.status);
  const blocked = [
    "refund_pending",
    "refunded",
    "ready",
    "ongoing",
    "completed",
    "cancelled",
  ];

  return !blocked.includes(status);
};

// ======================================================
// 8. FORMATTERS
// ======================================================
const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "0 ₫";
  const number = Number(value);
  if (Number.isNaN(number)) return "0 ₫";
  return number.toLocaleString("vi-VN") + " ₫";
};

const formatDate = (isoStr) => {
  if (!isoStr) return "--/--/----";
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return "--/--/----";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTimeOnly = (isoStr) => {
  if (!isoStr) return "";
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getThumbnailUrl = (path) => {
  if (!path) {
    return "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=90";
  }
  const cleanPath = String(path).replace(/\\/g, "/");
  return cleanPath.startsWith("http") ? cleanPath : `/${cleanPath}`;
};

// ======================================================
// 9. ACTIONS
// ======================================================
const handlePayNow = (booking) => {
  if (!canPay(booking)) return;
  router.push(`/checkout/${booking.id}`);
};

const handleCancelBooking = async (booking) => {
  if (!canCancel(booking)) {
    await Swal.fire({
      title: "Không thể hủy",
      text: "Booking này không thể hủy trực tiếp.",
      icon: "warning",
      confirmButtonText: "Đã hiểu",
      confirmButtonColor: "#f97316",
    });
    return;
  }

  const result = await Swal.fire({
    title: "Xác nhận hủy booking?",
    html: `
      <div style="text-align:left;line-height:1.7;">
        <p>Bạn có chắc muốn hủy đơn: <strong>#BK-${booking.id}</strong>?</p>
        <p style="color:#f59e0b;margin-top:10px;">Sau khi hủy, đơn đặt tour sẽ không thể khôi phục.</p>
      </div>
    `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Hủy booking",
    cancelButtonText: "Không",
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    await bookingService.cancelBooking(booking.id);

    await queryClient.invalidateQueries({
      queryKey: ["myBookingData"],
    });

    await Swal.fire({
      title: "Đã hủy booking",
      text: "Booking của bạn đã được hủy thành công.",
      icon: "success",
      confirmButtonText: "Đã hiểu",
      confirmButtonColor: "#f97316",
    });
  } catch (error) {
    console.error("Lỗi hủy booking:", error);
    await Swal.fire({
      title: "Không thể hủy",
      text: error?.response?.data?.message || "Không thể hủy booking.",
      icon: "error",
      confirmButtonText: "Đóng",
    });
  }
};

const handleRefundRequest = async (booking) => {
  if (!isPaymentPaid(booking)) {
    await Swal.fire({
      title: "Không thể hoàn tiền",
      text: "Booking chưa có thanh toán thành công.",
      icon: "warning",
      confirmButtonText: "Đã hiểu",
      confirmButtonColor: "#f97316",
    });
    return;
  }

  if (!canRefund(booking)) {
    await Swal.fire({
      title: "Không thể hoàn tiền",
      text: "Booking hiện không ở trạng thái có thể yêu cầu hoàn tiền.",
      icon: "warning",
      confirmButtonText: "Đã hiểu",
      confirmButtonColor: "#f97316",
    });
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const departureValue =
    booking?.schedule?.departure_date || booking?.start_date;
  const startDate = new Date(departureValue);

  if (Number.isNaN(startDate.getTime())) {
    await Swal.fire({
      title: "Lỗi ngày khởi hành",
      text: "Không xác định được ngày khởi hành để tính mức hoàn.",
      icon: "error",
      confirmButtonText: "Đóng",
    });
    return;
  }

  startDate.setHours(0, 0, 0, 0);
  const diffTime = startDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let refundPercent = 0;
  if (diffDays >= 7) refundPercent = 100;
  else if (diffDays >= 3) refundPercent = 50;
  else refundPercent = 0;

  const totalAmount = Number(booking?.total_amount || 0);
  const refundAmount = (totalAmount * refundPercent) / 100;

  const result = await Swal.fire({
    title: "Xác nhận yêu cầu hoàn tiền?",
    html: `
      <div style="text-align:left;line-height:1.7;">
        <p>Đơn: <strong>#BK-${booking.id}</strong></p>
        <p>Ngày khởi hành: <strong>${formatDate(departureValue)}</strong></p>
        <hr style="margin:12px 0;">
        <p><strong>Chính sách hoàn tiền:</strong></p>
        <ul style="padding-left:20px;">
          <li>Từ 7 ngày trở lên: <strong style="color:#22c55e;">100%</strong></li>
          <li>Từ 3 - 6 ngày: <strong style="color:#f59e0b;">50%</strong></li>
          <li>Dưới 3 ngày: <strong style="color:#ef4444;">0% (Không hỗ trợ hoàn)</strong></li>
        </ul>
        <hr style="margin:12px 0;">
        <p>Còn lại: <strong>${Math.max(diffDays, 0)} ngày</strong></p>
        <p>Tổng tiền: <strong>${formatCurrency(totalAmount)}</strong></p>
        <p>Mức hoàn dự kiến: <strong style="color:${refundPercent === 100 ? "#22c55e" : refundPercent === 50 ? "#f59e0b" : "#ef4444"}; font-size:18px;">${refundPercent}%</strong></p>
        <p>Số tiền nhận về ví: <strong style="color:#22c55e;">${formatCurrency(refundAmount)}</strong></p>
        <p style="color:#94a3b8;margin-top:10px;font-size:12px;">Yêu cầu sẽ được admin duyệt và tiền sẽ hoàn về ví tài khoản của bạn.</p>
      </div>
    `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Gửi yêu cầu",
    cancelButtonText: "Hủy",
    confirmButtonColor: "#f97316",
    cancelButtonColor: "#6b7280",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    const response = await bookingService.refund_pending(booking.id);
    if (response?.data?.success === false) {
      throw new Error(
        response?.data?.message || "Không thể gửi yêu cầu hoàn tiền.",
      );
    }

    await queryClient.invalidateQueries({
      queryKey: ["myBookingData"],
    });

    await Swal.fire({
      title: "Đã gửi yêu cầu!",
      text: "Yêu cầu hoàn tiền đã gửi đến hệ thống, vui lòng đợi duyệt.",
      icon: "success",
      confirmButtonText: "Đã hiểu",
      confirmButtonColor: "#f97316",
    });
  } catch (error) {
    console.error("Lỗi yêu cầu hoàn tiền:", error);
    await Swal.fire({
      title: "Không thể gửi yêu cầu",
      text:
        error?.response?.data?.message ||
        error?.message ||
        "Vui lòng thử lại sau.",
      icon: "error",
      confirmButtonText: "Đóng",
    });
  }
};

// ======================================================
// 10. STATS
// ======================================================
const stats = computed(() => {
  const list = bookings.value;

  return {
    total: list.length,
    upcoming: list.filter((b) =>
      ["paid", "ready", "ongoing"].includes(normalizeStatus(b.status)),
    ).length,
    completed: list.filter((b) => normalizeStatus(b.status) === "completed")
      .length,
    cancelled: list.filter((b) => normalizeStatus(b.status) === "cancelled")
      .length,
    totalSpent: list
      .filter((b) => isPaymentPaid(b))
      .reduce((total, b) => total + Number(b.total_amount || 0), 0),
  };
});

// ======================================================
// 11. UPCOMING TRIP (Chuyến đi gần nhất)
// ======================================================
const upcomingTrip = computed(() => {
  const list = bookings.value;
  const activeTrips = list.filter((b) =>
    ["ongoing", "ready", "paid", "confirmed"].includes(
      normalizeStatus(b.status),
    ),
  );
  return activeTrips[0] || list[0] || null;
});

// ======================================================
// 12. SEARCH + FILTER
// ======================================================
const searchQuery = ref("");
const activeTab = ref("all");

const filterCounts = computed(() => {
  const list = bookings.value;

  return {
    all: list.length,
    pending: list.filter(
      (b) => normalizeStatus(b.status) === "pending" && !isPaymentPaid(b),
    ).length,
    confirmed: list.filter(
      (b) => normalizeStatus(b.status) === "confirmed" && !isPaymentPaid(b),
    ).length,
    ready: list.filter((b) => normalizeStatus(b.status) === "ready").length,
    ongoing: list.filter((b) => normalizeStatus(b.status) === "ongoing").length,
    completed: list.filter((b) => normalizeStatus(b.status) === "completed")
      .length,
    cancelled: list.filter((b) => normalizeStatus(b.status) === "cancelled")
      .length,
  };
});

const filteredBookings = computed(() => {
  let result = bookings.value;

  if (activeTab.value === "pending") {
    result = result.filter(
      (b) => normalizeStatus(b.status) === "pending" && !isPaymentPaid(b),
    );
  } else if (activeTab.value === "confirmed") {
    result = result.filter(
      (b) => normalizeStatus(b.status) === "confirmed" && !isPaymentPaid(b),
    );
  } else if (activeTab.value !== "all") {
    result = result.filter(
      (b) => normalizeStatus(b.status) === activeTab.value,
    );
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter((b) => {
      const tourName = b.tour?.name?.toLowerCase() || "";
      const bookingId = String(b.id || "").toLowerCase();
      const departure = b.departure?.toLowerCase() || "";
      return (
        tourName.includes(q) || bookingId.includes(q) || departure.includes(q)
      );
    });
  }

  return result;
});

// ======================================================
// 13. REVIEW MODAL
// ======================================================
const activeReviewBooking = ref(null);
const isSubmitting = ref(false);
const formReview = ref({
  tour_id: "",
  rating: 5,
  joined_date: null,
  content: "",
});

const openReviewModal = (booking) => {
  activeReviewBooking.value = booking;
  formReview.value = {
    tour_id: booking?.tour?.id || booking?.tour_id || "",
    rating: 5,
    joined_date: booking?.schedule?.departure_date || null,
    content: "",
  };
};

const closeReviewModal = () => {
  activeReviewBooking.value = null;
};

const createReviewsTour = async () => {
  if (!formReview.value.content.trim()) {
    await Swal.fire({
      title: "Thiếu nội dung",
      text: "Vui lòng nhập nội dung đánh giá!",
      icon: "warning",
      confirmButtonText: "Đã hiểu",
      confirmButtonColor: "#f97316",
    });
    return;
  }

  try {
    isSubmitting.value = true;
    const payload = {
      tour_id: formReview.value.tour_id,
      rating: Number(formReview.value.rating),
      joined_date: formReview.value.joined_date,
      content: formReview.value.content.trim(),
    };

    const res = await reviewService.createReview(payload);
    if (res?.data || res?.status === 200 || res?.status === 201) {
      await Swal.fire({
        title: "Thành công!",
        text: "Cảm ơn bạn đã gửi đánh giá!",
        icon: "success",
        confirmButtonText: "Đã hiểu",
        confirmButtonColor: "#f97316",
      });
      closeReviewModal();
    }
  } catch (error) {
    console.error("Lỗi gửi đánh giá:", error);
    await Swal.fire({
      title: "Không thể gửi đánh giá",
      text: error?.response?.data?.message || "Lỗi không thể gửi đánh giá!",
      icon: "error",
      confirmButtonText: "Đóng",
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="relative min-h-screen text-white pt-20">
    <!-- ================================================== -->
    <!-- BACKGROUND GỐC -->
    <!-- ================================================== -->
    <div class="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <img
        src="/hero-bg.jpg"
        alt="Sunset travel"
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-black/40"></div>
      <div
        class="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-[#080b12]/90"
      ></div>
      <div
        class="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-[#080b12] via-[#080b12]/60 to-transparent"
      ></div>
    </div>

    <!-- ================================================== -->
    <!-- MAIN CONTENT -->
    <!-- ================================================== -->
    <main class="relative z-10 mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
      <!-- HEADER -->
      <section class="mb-8">
        <div
          class="flex flex-col justify-between gap-5 md:flex-row md:items-end"
        >
          <div>
            <div
              class="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur-xl"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-orange-300"></span>
              My Travel
            </div>
            <h1
              class="text-4xl font-bold tracking-tight text-white sm:text-5xl"
            >
              Chuyến đi của tôi
            </h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-white/80">
              Theo dõi lịch trình, tình trạng thanh toán và hồ sơ đặt tour.
            </p>
          </div>

          <RouterLink
            to="/tours"
            class="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-xl transition hover:-translate-y-0.5 hover:bg-orange-50"
          >
            Khám phá tour mới
            <svg
              class="h-4 w-4 transition group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 12h14m-6-6l6 6-6 6"
              />
            </svg>
          </RouterLink>
        </div>
      </section>

      <!-- STATS NGUYÊN MẪU MÀU SẮC -->
      <section
        class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        <div
          class="rounded-3xl border border-white/15 bg-white/[0.08] p-5 backdrop-blur-2xl"
        >
          <div class="flex items-center justify-between">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10"
            >
              📋
            </div>
            <span class="text-[11px] font-medium text-white/70">Tổng đơn</span>
          </div>
          <p class="mt-4 font-mono text-2xl font-bold text-white">
            {{ String(stats.total || 0).padStart(2, "0") }}
          </p>
          <p class="mt-0.5 text-[10px] text-white/50">Tất cả lịch sử</p>
        </div>

        <div
          class="rounded-3xl border border-white/15 bg-white/[0.08] p-5 backdrop-blur-2xl"
        >
          <div class="flex items-center justify-between">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/15 text-lg"
            >
              🧳
            </div>
            <span class="text-[11px] font-medium text-cyan-200/80">Sắp đi</span>
          </div>
          <p class="mt-4 font-mono text-2xl font-bold text-white">
            {{ String(stats.upcoming || 0).padStart(2, "0") }}
          </p>
          <p class="mt-0.5 text-[10px] text-white/50">Đã sẵn sàng</p>
        </div>

        <div
          class="rounded-3xl border border-white/15 bg-white/[0.08] p-5 backdrop-blur-2xl"
        >
          <div class="flex items-center justify-between">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-400/15 font-bold text-purple-300"
            >
              ✓
            </div>
            <span class="text-[11px] font-medium text-purple-200/80"
              >Hoàn thành</span
            >
          </div>
          <p class="mt-4 font-mono text-2xl font-bold text-white">
            {{ String(stats.completed || 0).padStart(2, "0") }}
          </p>
          <p class="mt-0.5 text-[10px] text-white/50">Đã trải nghiệm</p>
        </div>

        <div
          class="rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.08] p-5 backdrop-blur-2xl"
        >
          <div class="flex items-center justify-between">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/20 font-bold text-emerald-300"
            >
              ✓
            </div>
            <span class="text-[11px] font-medium text-emerald-200/80"
              >Đã trả</span
            >
          </div>
          <p class="mt-4 font-mono text-2xl font-bold text-emerald-300">
            {{
              String(bookings.filter((b) => isPaymentPaid(b)).length).padStart(
                2,
                "0",
              )
            }}
          </p>
          <p class="mt-0.5 text-[10px] text-emerald-200/60">
            Thanh toán thành công
          </p>
        </div>

        <div
          class="rounded-3xl border border-white/15 bg-white/[0.08] p-5 backdrop-blur-2xl"
        >
          <div class="flex items-center justify-between">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-400/15 font-bold text-red-300"
            >
              ✕
            </div>
            <span class="text-[11px] font-medium text-red-200/80">Đã hủy</span>
          </div>
          <p class="mt-4 font-mono text-2xl font-bold text-white">
            {{ String(stats.cancelled || 0).padStart(2, "0") }}
          </p>
          <p class="mt-0.5 text-[10px] text-white/50">Đơn đã đóng</p>
        </div>
      </section>

      <!-- UPCOMING TRIP (HÀNH TRÌNH ƯU TIÊN) -->
      <section v-if="upcomingTrip" class="mb-10">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-white">Hành trình ưu tiên</h2>
            <p class="mt-1 text-xs font-medium text-white/70">
              Chuyến đi gần nhất của bạn
            </p>
          </div>
        </div>

        <div
          class="group relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.08] backdrop-blur-2xl"
        >
          <div class="grid lg:grid-cols-[330px_1fr]">
            <!-- IMAGE (CÓ ẢNH GIẢ NẾU THIẾU THUMBNAIL) -->
            <div class="relative h-64 overflow-hidden lg:h-auto bg-white/5">
              <img
                :src="
                  upcomingTrip.tour?.thumbnail
                    ? getThumbnailUrl(upcomingTrip.tour.thumbnail)
                    : 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
                "
                :alt="upcomingTrip.tour?.name || 'Tour thumbnail'"
                class="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div
                class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
              ></div>
              <div
                class="absolute left-5 top-5 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-[10px] font-bold uppercase text-white backdrop-blur-xl"
              >
                {{ getBadge(upcomingTrip.status).text }}
              </div>
            </div>

            <!-- CONTENT -->
            <div class="p-6 sm:p-8">
              <div class="flex flex-col justify-between gap-5 sm:flex-row">
                <div>
                  <div class="mb-2 flex items-center gap-2">
                    <span
                      class="font-mono text-xs font-semibold text-orange-200"
                    >
                      BOOKING #BK-{{ upcomingTrip.id }}
                    </span>
                    <span class="h-1 w-1 rounded-full bg-white/40"></span>
                    <span
                      class="text-xs font-medium"
                      :class="getPaymentTextColor(upcomingTrip)"
                    >
                      {{ getPaymentText(upcomingTrip) }}
                    </span>
                  </div>

                  <h3 class="text-2xl font-bold text-white">
                    {{ upcomingTrip.tour?.name }}
                  </h3>
                  <p class="mt-2 text-sm font-medium text-white/80">
                    Nơi đón:
                    {{
                      upcomingTrip.departure ||
                      "Điểm đón theo lịch trình quy định"
                    }}
                  </p>
                </div>

                <div
                  class="h-fit rounded-full border px-3.5 py-1.5 text-xs font-bold tracking-wide"
                  :class="getBadge(upcomingTrip.status).class"
                >
                  {{ getBadge(upcomingTrip.status).text }}
                </div>
              </div>

              <!-- INFO GRID -->
              <div class="mt-7 grid gap-5 sm:grid-cols-3">
                <div>
                  <p
                    class="text-[10px] font-semibold uppercase tracking-wider text-white/70"
                  >
                    Khởi hành
                  </p>
                  <p class="mt-2 text-sm font-semibold text-white">
                    {{ formatDate(upcomingTrip.schedule?.departure_date) }}
                  </p>
                  <p class="mt-1 text-xs text-white/70">
                    {{ formatTimeOnly(upcomingTrip.schedule?.departure_time) }}
                  </p>
                </div>

                <div>
                  <p
                    class="text-[10px] font-semibold uppercase tracking-wider text-white/70"
                  >
                    Hành khách
                  </p>
                  <p class="mt-2 text-sm font-semibold text-white">
                    {{
                      String(upcomingTrip.total_people || 0).padStart(2, "0")
                    }}
                    người
                  </p>
                  <p class="mt-1 text-xs text-white/70">
                    Người đặt: {{ upcomingTrip.booker_name }}
                  </p>
                </div>

                <div>
                  <p
                    class="text-[10px] font-semibold uppercase tracking-wider text-white/70"
                  >
                    Tổng tiền
                  </p>
                  <p class="mt-2 font-mono text-lg font-bold text-white">
                    {{ formatCurrency(upcomingTrip.total_amount) }}
                  </p>
                  <p
                    class="mt-1 text-xs font-semibold"
                    :class="getPaymentTextColor(upcomingTrip)"
                  >
                    {{ getPaymentText(upcomingTrip) }}
                  </p>
                </div>
              </div>

              <!-- ACTIONS CHO UPCOMING TRIP -->
              <div
                class="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <RouterLink
                    :to="`/booking/${upcomingTrip.id}`"
                    class="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20"
                  >
                    Chi tiết đơn hàng
                  </RouterLink>

                  <button
                    v-if="canPay(upcomingTrip)"
                    type="button"
                    @click="handlePayNow(upcomingTrip)"
                    class="cursor-pointer rounded-xl bg-orange-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg transition hover:bg-orange-300"
                  >
                    Thanh toán ngay
                  </button>

                  <!-- DROPDOWN HOÀN TIỀN CÓ LÝ DO -->
                  <details
                    v-if="canRefund(upcomingTrip)"
                    class="relative inline-block"
                  >
                    <summary
                      class="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-xl border border-purple-400/30 bg-purple-500/20 px-4 py-2.5 text-xs font-semibold text-purple-200 transition hover:bg-purple-500/30 focus:outline-none select-none"
                    >
                      Yêu cầu hoàn tiền
                      <svg
                        class="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </summary>

                    <div
                      class="absolute left-0 bottom-full mb-2 z-30 w-64 rounded-2xl border border-white/20 bg-[#0f172a] p-2 shadow-2xl backdrop-blur-xl"
                    >
                      <p
                        class="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300/80"
                      >
                        Chọn lý do hoàn tiền:
                      </p>
                      <div class="space-y-1">
                        <button
                          type="button"
                          @click="
                            handleRefundRequest(
                              upcomingTrip,
                              'Bận việc đột xuất / Trùng lịch',
                            )
                          "
                          class="w-full rounded-xl px-2.5 py-2 text-left text-xs text-white/80 transition hover:bg-purple-500/20 hover:text-white"
                        >
                          📅 Bận việc đột xuất / Trùng lịch
                        </button>
                        <button
                          type="button"
                          @click="
                            handleRefundRequest(
                              upcomingTrip,
                              'Sức khỏe không đảm bảo',
                            )
                          "
                          class="w-full rounded-xl px-2.5 py-2 text-left text-xs text-white/80 transition hover:bg-purple-500/20 hover:text-white"
                        >
                          🏥 Sức khỏe không đảm bảo
                        </button>
                        <button
                          type="button"
                          @click="
                            handleRefundRequest(
                              upcomingTrip,
                              'Thời tiết xấu / Bất khả kháng',
                            )
                          "
                          class="w-full rounded-xl px-2.5 py-2 text-left text-xs text-white/80 transition hover:bg-purple-500/20 hover:text-white"
                        >
                          ⛈️ Thời tiết xấu / Bất khả kháng
                        </button>
                        <button
                          type="button"
                          @click="
                            handleRefundRequest(
                              upcomingTrip,
                              'Đặt nhầm thông tin tour',
                            )
                          "
                          class="w-full rounded-xl px-2.5 py-2 text-left text-xs text-white/80 transition hover:bg-purple-500/20 hover:text-white"
                        >
                          ✏️ Đặt nhầm thông tin tour
                        </button>
                        <button
                          type="button"
                          @click="
                            handleRefundRequest(
                              upcomingTrip,
                              'Lý do cá nhân khác',
                            )
                          "
                          class="w-full rounded-xl px-2.5 py-2 text-left text-xs text-white/80 transition hover:bg-purple-500/20 hover:text-white"
                        >
                          💬 Lý do cá nhân khác
                        </button>
                      </div>
                    </div>
                  </details>

                  <span
                    v-if="
                      normalizeStatus(upcomingTrip.status) === 'refund_pending'
                    "
                    class="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3.5 py-2 text-xs font-semibold text-amber-200"
                  >
                    ⏳ Đang chờ hoàn tiền
                  </span>

                  <span
                    v-if="normalizeStatus(upcomingTrip.status) === 'refunded'"
                    class="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-2 text-xs font-semibold text-emerald-200"
                  >
                    ✓ Đã hoàn tiền vào ví
                  </span>

                  <button
                    v-if="normalizeStatus(upcomingTrip.status) === 'completed'"
                    type="button"
                    @click="openReviewModal(upcomingTrip)"
                    class="cursor-pointer rounded-xl border border-orange-300/20 bg-orange-300/10 px-4 py-2.5 text-xs font-semibold text-orange-200 transition hover:bg-orange-300/20"
                  >
                    Viết đánh giá
                  </button>

                  <span
                    v-if="
                      ['ready', 'ongoing'].includes(
                        normalizeStatus(upcomingTrip.status),
                      )
                    "
                    class="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/50"
                  >
                    🔒 Đã chốt tour (Không thể hoàn/hủy)
                  </span>

                  <RouterLink
                    v-if="
                      ['cancelled', 'refunded'].includes(
                        normalizeStatus(upcomingTrip.status),
                      )
                    "
                    to="/tours"
                    class="rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20"
                  >
                    Đặt lại tour này
                  </RouterLink>
                </div>

                <!-- DROPDOWN HỦY CHUYẾN CÓ LÝ DO -->
                <details
                  v-if="canCancel(upcomingTrip)"
                  class="relative ml-auto inline-block"
                >
                  <summary
                    class="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-white/60 transition hover:text-red-300 focus:outline-none select-none"
                  >
                    Hủy chuyến
                    <svg
                      class="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>

                  <div
                    class="absolute right-0 bottom-full mb-2 z-30 w-60 rounded-2xl border border-white/20 bg-[#0f172a] p-2 shadow-2xl backdrop-blur-xl"
                  >
                    <p
                      class="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-300/80"
                    >
                      Lý do hủy tour:
                    </p>
                    <div class="space-y-1">
                      <button
                        type="button"
                        @click="
                          handleCancelBooking(
                            upcomingTrip,
                            'Đổi ý, không muốn đi nữa',
                          )
                        "
                        class="w-full rounded-xl px-2.5 py-2 text-left text-xs text-white/80 transition hover:bg-red-500/20 hover:text-red-200"
                      >
                        ❌ Đổi ý, không muốn đi nữa
                      </button>
                      <button
                        type="button"
                        @click="
                          handleCancelBooking(
                            upcomingTrip,
                            'Trùng lịch bận đột xuất',
                          )
                        "
                        class="w-full rounded-xl px-2.5 py-2 text-left text-xs text-white/80 transition hover:bg-red-500/20 hover:text-red-200"
                      >
                        📅 Trùng lịch bận đột xuất
                      </button>
                      <button
                        type="button"
                        @click="
                          handleCancelBooking(
                            upcomingTrip,
                            'Muốn đổi sang tour khác',
                          )
                        "
                        class="w-full rounded-xl px-2.5 py-2 text-left text-xs text-white/80 transition hover:bg-red-500/20 hover:text-red-200"
                      >
                        🔄 Muốn đổi sang tour khác
                      </button>
                      <button
                        type="button"
                        @click="
                          handleCancelBooking(
                            upcomingTrip,
                            'Đặt nhầm ngày / thông tin',
                          )
                        "
                        class="w-full rounded-xl px-2.5 py-2 text-left text-xs text-white/80 transition hover:bg-red-500/20 hover:text-red-200"
                      >
                        ✏️ Đặt nhầm ngày / thông tin
                      </button>
                      <button
                        type="button"
                        @click="handleCancelBooking(upcomingTrip, 'Lý do khác')"
                        class="w-full rounded-xl px-2.5 py-2 text-left text-xs text-white/80 transition hover:bg-red-500/20 hover:text-red-200"
                      >
                        💬 Lý do khác
                      </button>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- DANH SÁCH TẤT CẢ CHUYẾN ĐI -->
      <section>
        <div
          class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <h2 class="text-lg font-bold text-white">Tất cả chuyến đi</h2>
            <p class="mt-1 text-xs font-medium text-white/70">
              Theo dõi lịch sử đặt tour của bạn
            </p>
          </div>

          <!-- SEARCH BAR -->
          <div class="relative w-full lg:w-72">
            <svg
              class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m21 21-4.35-4.35m2.1-5.15a7.25 7.25 0 11-14.5 0 7.25 7.25 0 0114.5 0z"
              />
            </svg>
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Tìm tour, mã đơn, điểm đón..."
              class="w-full rounded-2xl border border-white/15 bg-white/[0.08] py-3 pl-11 pr-4 text-xs text-white outline-none backdrop-blur-xl transition placeholder:text-white/50 focus:border-white/35 focus:bg-white/15"
            />
          </div>
        </div>

        <!-- FILTER TABS -->
        <div
          class="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.05] p-1.5 backdrop-blur-xl"
        >
          <button
            type="button"
            @click="activeTab = 'all'"
            :class="
              activeTab === 'all'
                ? 'bg-white text-slate-900 font-bold'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            "
            class="cursor-pointer whitespace-nowrap rounded-xl px-4 py-2.5 text-xs transition"
          >
            Tất cả <span class="ml-1 opacity-70">{{ filterCounts.all }}</span>
          </button>

          <button
            type="button"
            @click="activeTab = 'pending'"
            :class="
              activeTab === 'pending'
                ? 'bg-white text-slate-900 font-bold'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            "
            class="cursor-pointer whitespace-nowrap rounded-xl px-4 py-2.5 text-xs transition"
          >
            Chờ duyệt
            <span class="ml-1 opacity-70">{{ filterCounts.pending }}</span>
          </button>

          <button
            type="button"
            @click="activeTab = 'confirmed'"
            :class="
              activeTab === 'confirmed'
                ? 'bg-white text-slate-900 font-bold'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            "
            class="cursor-pointer whitespace-nowrap rounded-xl px-4 py-2.5 text-xs transition"
          >
            Đã xác nhận
            <span class="ml-1 opacity-70">{{ filterCounts.confirmed }}</span>
          </button>

          <button
            type="button"
            @click="activeTab = 'ready'"
            :class="
              activeTab === 'ready'
                ? 'bg-white text-slate-900 font-bold'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            "
            class="cursor-pointer whitespace-nowrap rounded-xl px-4 py-2.5 text-xs transition"
          >
            Sắp khởi hành
            <span class="ml-1 opacity-70">{{ filterCounts.ready }}</span>
          </button>

          <button
            type="button"
            @click="activeTab = 'ongoing'"
            :class="
              activeTab === 'ongoing'
                ? 'bg-white text-slate-900 font-bold'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            "
            class="cursor-pointer whitespace-nowrap rounded-xl px-4 py-2.5 text-xs transition"
          >
            Đang đi
            <span class="ml-1 opacity-70">{{ filterCounts.ongoing }}</span>
          </button>

          <button
            type="button"
            @click="activeTab = 'completed'"
            :class="
              activeTab === 'completed'
                ? 'bg-white text-slate-900 font-bold'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            "
            class="cursor-pointer whitespace-nowrap rounded-xl px-4 py-2.5 text-xs transition"
          >
            Hoàn thành
            <span class="ml-1 opacity-70">{{ filterCounts.completed }}</span>
          </button>

          <button
            type="button"
            @click="activeTab = 'cancelled'"
            :class="
              activeTab === 'cancelled'
                ? 'bg-white text-slate-900 font-bold'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            "
            class="cursor-pointer whitespace-nowrap rounded-xl px-4 py-2.5 text-xs transition"
          >
            Đã hủy
            <span class="ml-1 opacity-70">{{ filterCounts.cancelled }}</span>
          </button>
        </div>

        <!-- LOADING SPINNER -->
        <div v-if="isLoading" class="py-16 text-center">
          <div
            class="inline-block h-8 w-8 animate-spin rounded-full border-2 border-orange-300 border-t-transparent"
          ></div>
          <p class="mt-3 text-xs tracking-wider text-white/50">
            Đang tải danh sách chuyến đi...
          </p>
        </div>

        <!-- ITEMS LIST -->
        <div v-else-if="filteredBookings.length > 0" class="space-y-4">
          <article
            v-for="booking in filteredBookings"
            :key="booking.id"
            class="group overflow-hidden rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-2xl transition hover:border-white/25 hover:bg-white/[0.10]"
          >
            <div class="flex flex-col md:flex-row">
              <!-- IMAGE (CÓ ẢNH GIẢ NẾU TOUR CHƯA CÓ ẢNH) -->
              <div class="relative h-48 shrink-0 md:h-auto md:w-56 bg-white/5">
                <img
                  :src="
                    booking.tour?.thumbnail
                      ? getThumbnailUrl(booking.tour.thumbnail)
                      : 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80'
                  "
                  :alt="booking.tour?.name || 'Tour thumbnail'"
                  class="h-full w-full object-cover"
                />
                <div
                  class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
                ></div>
              </div>

              <!-- CONTENT -->
              <div class="flex-1 p-5 sm:p-6">
                <div class="flex flex-col justify-between gap-3 sm:flex-row">
                  <div>
                    <p
                      class="font-mono text-[10px] font-semibold uppercase tracking-wider text-white/70"
                    >
                      #BK-{{ booking.id }}
                    </p>
                    <h3 class="mt-1 text-lg font-bold text-white">
                      {{ booking.tour?.name }}
                    </h3>
                    <p class="mt-1 text-xs font-medium text-white/75">
                      Nơi đón:
                      {{
                        booking.departure || "Điểm đón theo lịch trình quy định"
                      }}
                    </p>
                  </div>

                  <span
                    class="h-fit w-fit rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-wider"
                    :class="getBadge(booking.status).class"
                  >
                    {{ getBadge(booking.status).text }}
                  </span>
                </div>

                <!-- INFO FIELDS -->
                <div class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p
                      class="text-[9px] font-semibold uppercase tracking-wider text-white/60"
                    >
                      Ngày đi
                    </p>
                    <p class="mt-1 text-xs font-semibold text-white">
                      {{ formatDate(booking.schedule?.departure_date) }}
                    </p>
                  </div>

                  <div>
                    <p
                      class="text-[9px] font-semibold uppercase tracking-wider text-white/60"
                    >
                      Số người
                    </p>
                    <p class="mt-1 text-xs font-semibold text-white">
                      {{ String(booking.total_people || 0).padStart(2, "0") }}
                      người
                    </p>
                  </div>

                  <div>
                    <p
                      class="text-[9px] font-semibold uppercase tracking-wider text-white/60"
                    >
                      Thanh toán
                    </p>
                    <p
                      class="mt-1 text-xs font-semibold"
                      :class="getPaymentTextColor(booking)"
                    >
                      {{ getPaymentText(booking) }}
                    </p>
                  </div>

                  <div>
                    <p
                      class="text-[9px] font-semibold uppercase tracking-wider text-white/60"
                    >
                      Tổng tiền
                    </p>
                    <p class="mt-1 font-mono text-sm font-bold text-white">
                      {{ formatCurrency(booking.total_amount) }}
                    </p>
                  </div>
                </div>

                <!-- ACTIONS TRONG LIST -->
                <div
                  class="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4"
                >
                  <div class="flex flex-wrap items-center gap-2">
                    <RouterLink
                      :to="`/booking/${booking.id}`"
                      class="rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-[11px] font-semibold text-white transition hover:bg-white/20"
                    >
                      Xem chi tiết
                    </RouterLink>

                    <button
                      v-if="canPay(booking)"
                      type="button"
                      @click="handlePayNow(booking)"
                      class="cursor-pointer rounded-xl bg-orange-400 px-3.5 py-2 text-[11px] font-bold text-slate-950 shadow transition hover:bg-orange-300"
                    >
                      Thanh toán ngay
                    </button>

                    <!-- DROPDOWN HOÀN TIỀN TRONG LIST -->
                    <details
                      v-if="canRefund(booking)"
                      class="relative inline-block"
                    >
                      <summary
                        class="inline-flex cursor-pointer list-none items-center gap-1 rounded-xl border border-purple-400/30 bg-purple-500/20 px-3.5 py-2 text-[11px] font-semibold text-purple-200 transition hover:bg-purple-500/30 focus:outline-none select-none"
                      >
                        Yêu cầu hoàn tiền
                        <svg
                          class="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </summary>

                      <div
                        class="absolute left-0 bottom-full mb-2 z-30 w-60 rounded-2xl border border-white/20 bg-[#0f172a] p-2 shadow-2xl backdrop-blur-xl"
                      >
                        <p
                          class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-300/80"
                        >
                          Lý do hoàn tiền:
                        </p>
                        <div class="space-y-0.5">
                          <button
                            type="button"
                            @click="
                              handleRefundRequest(
                                booking,
                                'Bận việc đột xuất / Trùng lịch',
                              )
                            "
                            class="w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] text-white/80 transition hover:bg-purple-500/20 hover:text-white"
                          >
                            📅 Bận việc đột xuất / Trùng lịch
                          </button>
                          <button
                            type="button"
                            @click="
                              handleRefundRequest(
                                booking,
                                'Sức khỏe không đảm bảo',
                              )
                            "
                            class="w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] text-white/80 transition hover:bg-purple-500/20 hover:text-white"
                          >
                            🏥 Sức khỏe không đảm bảo
                          </button>
                          <button
                            type="button"
                            @click="
                              handleRefundRequest(
                                booking,
                                'Thời tiết xấu / Bất khả kháng',
                              )
                            "
                            class="w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] text-white/80 transition hover:bg-purple-500/20 hover:text-white"
                          >
                            ⛈️ Thời tiết xấu / Bất khả kháng
                          </button>
                          <button
                            type="button"
                            @click="
                              handleRefundRequest(
                                booking,
                                'Đặt nhầm thông tin tour',
                              )
                            "
                            class="w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] text-white/80 transition hover:bg-purple-500/20 hover:text-white"
                          >
                            ✏️ Đặt nhầm thông tin tour
                          </button>
                          <button
                            type="button"
                            @click="handleRefundRequest(booking, 'Lý do khác')"
                            class="w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] text-white/80 transition hover:bg-purple-500/20 hover:text-white"
                          >
                            💬 Lý do khác
                          </button>
                        </div>
                      </div>
                    </details>

                    <span
                      v-if="
                        normalizeStatus(booking.status) === 'refund_pending'
                      "
                      class="inline-flex items-center gap-1 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-[11px] font-semibold text-amber-200"
                    >
                      ⏳ Chờ hoàn tiền
                    </span>

                    <span
                      v-if="normalizeStatus(booking.status) === 'refunded'"
                      class="inline-flex items-center gap-1 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-200"
                    >
                      ✓ Đã hoàn tiền
                    </span>

                    <button
                      v-if="normalizeStatus(booking.status) === 'completed'"
                      type="button"
                      @click="openReviewModal(booking)"
                      class="cursor-pointer rounded-xl border border-orange-300/20 bg-orange-300/10 px-3.5 py-2 text-[11px] font-semibold text-orange-200 transition hover:bg-orange-300/20"
                    >
                      Viết đánh giá
                    </button>

                    <RouterLink
                      v-if="
                        ['cancelled', 'refunded'].includes(
                          normalizeStatus(booking.status),
                        )
                      "
                      to="/tours"
                      class="rounded-xl bg-white/10 px-3.5 py-2 text-[11px] font-semibold text-white transition hover:bg-white/20"
                    >
                      Đặt lại tour
                    </RouterLink>

                    <span
                      v-if="
                        ['ready', 'ongoing'].includes(
                          normalizeStatus(booking.status),
                        )
                      "
                      class="inline-flex items-center px-2 text-[10px] italic text-white/40"
                    >
                      🔒 Không thể hủy / đổi
                    </span>
                  </div>

                  <!-- DROPDOWN HỦY BOOKING TRONG LIST -->
                  <details
                    v-if="canCancel(booking)"
                    class="relative ml-auto inline-block"
                  >
                    <summary
                      class="inline-flex cursor-pointer list-none items-center gap-1 text-[11px] font-semibold text-white/60 transition hover:text-red-300 focus:outline-none select-none"
                    >
                      Hủy booking
                      <svg
                        class="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </summary>

                    <div
                      class="absolute right-0 bottom-full mb-2 z-30 w-56 rounded-2xl border border-white/20 bg-[#0f172a] p-2 shadow-2xl backdrop-blur-xl"
                    >
                      <p
                        class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-300/80"
                      >
                        Lý do hủy:
                      </p>
                      <div class="space-y-0.5">
                        <button
                          type="button"
                          @click="
                            handleCancelBooking(
                              booking,
                              'Không còn nhu cầu đi nữa',
                            )
                          "
                          class="w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] text-white/80 transition hover:bg-red-500/20 hover:text-red-200"
                        >
                          ❌ Không còn nhu cầu đi nữa
                        </button>
                        <button
                          type="button"
                          @click="
                            handleCancelBooking(
                              booking,
                              'Trùng lịch bận đột xuất',
                            )
                          "
                          class="w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] text-white/80 transition hover:bg-red-500/20 hover:text-red-200"
                        >
                          📅 Trùng lịch bận đột xuất
                        </button>
                        <button
                          type="button"
                          @click="
                            handleCancelBooking(booking, 'Muốn đổi tour khác')
                          "
                          class="w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] text-white/80 transition hover:bg-red-500/20 hover:text-red-200"
                        >
                          🔄 Muốn đổi tour khác
                        </button>
                        <button
                          type="button"
                          @click="
                            handleCancelBooking(booking, 'Đặt nhầm thông tin')
                          "
                          class="w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] text-white/80 transition hover:bg-red-500/20 hover:text-red-200"
                        >
                          ✏️ Đặt nhầm thông tin
                        </button>
                        <button
                          type="button"
                          @click="handleCancelBooking(booking, 'Lý do khác')"
                          class="w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] text-white/80 transition hover:bg-red-500/20 hover:text-red-200"
                        >
                          💬 Lý do khác
                        </button>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </article>
        </div>

        <!-- EMPTY STATE -->
        <div
          v-else
          class="rounded-3xl border border-dashed border-white/15 bg-white/[0.04] p-12 text-center backdrop-blur-xl"
        >
          <div
            class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-2xl"
          >
            ✈️
          </div>
          <h3 class="mt-4 text-base font-bold text-white">
            Không có chuyến đi nào
          </h3>
          <p
            class="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-white/60"
          >
            Không tìm thấy đơn đặt tour nào trong mục này.
          </p>
          <div class="mt-6">
            <RouterLink
              to="/tours"
              class="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-slate-900 shadow-lg transition hover:bg-orange-100"
            >
              Đặt tour ngay
            </RouterLink>
          </div>
        </div>
      </section>
    </main>

    <!-- ================================================== -->
    <!-- REVIEW MODAL -->
    <!-- ================================================== -->
    <div
      v-if="activeReviewBooking"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
    >
      <div
        class="absolute inset-0 cursor-pointer"
        @click="closeReviewModal"
      ></div>

      <div
        class="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/20 bg-[#0f172a] p-6 text-white shadow-2xl backdrop-blur-2xl"
      >
        <div
          class="flex items-center justify-between border-b border-white/10 pb-4"
        >
          <div>
            <h3 class="text-base font-bold text-white">Đánh giá chuyến đi</h3>
            <p class="mt-0.5 max-w-[240px] truncate text-xs text-orange-200/80">
              {{ activeReviewBooking.tour?.name }}
            </p>
          </div>
          <button
            type="button"
            @click="closeReviewModal"
            class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form @submit.prevent class="mt-4 space-y-4">
          <div>
            <label class="mb-2 block text-xs font-semibold text-white/80">
              Chất lượng trải nghiệm
            </label>
            <div class="flex items-center gap-1.5">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                @click="formReview.rating = star"
                class="cursor-pointer select-none text-3xl transition hover:scale-110"
                :class="
                  star <= formReview.rating ? 'text-amber-400' : 'text-white/20'
                "
              >
                ★
              </button>
              <span class="ml-2 text-xs font-bold text-amber-300">
                {{ formReview.rating }} / 5 sao
              </span>
            </div>
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-semibold text-white/80">
              Nhận xét của bạn
            </label>
            <textarea
              v-model="formReview.content"
              rows="4"
              placeholder="Chia sẻ cảm nhận về hướng dẫn viên, lịch trình, dịch vụ..."
              class="w-full resize-none rounded-xl border border-white/15 bg-white/5 p-3 text-xs text-white outline-none transition placeholder:text-white/40 focus:border-orange-300 focus:bg-white/10"
            ></textarea>
          </div>

          <div
            class="flex items-center justify-end gap-3 border-t border-white/10 pt-3"
          >
            <button
              type="button"
              @click="closeReviewModal"
              class="cursor-pointer rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10"
            >
              Hủy
            </button>
            <button
              type="button"
              :disabled="isSubmitting"
              @click="createReviewsTour"
              class="inline-flex min-w-[110px] cursor-pointer items-center justify-center rounded-xl bg-orange-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ isSubmitting ? "Đang gửi..." : "Gửi đánh giá" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
