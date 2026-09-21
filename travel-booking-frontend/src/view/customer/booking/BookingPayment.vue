<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";

import { useBookingStore } from "@/stores/booking";
import paymentService from "../../../services/payment.service";

const router = useRouter();
const bookingStore = useBookingStore();

// ==========================================
// LẤY DỮ LIỆU TỪ PINIA
// ==========================================

const bookingState = computed(() => {
  return bookingStore.bookingData || {};
});

const tourInfo = computed(() => {
  return bookingStore.tourDetail || {};
});

// ==========================================
// TRẠNG THÁI THANH TOÁN
// ==========================================

const selectedMethod = ref("vnpay");
const isLoading = ref(false);

// ==========================================
// FORMAT TIỀN
// ==========================================

const formatCurrency = (val) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(val) || 0);
};

// ==========================================
// TỔNG TIỀN
// ==========================================

const totalPrice = computed(() => {
  if (bookingState.value.total_amount) {
    return Number(bookingState.value.total_amount);
  }

  const price = Number(tourInfo.value.price || 0);
  const people = Number(bookingState.value.total_people || 1);

  return price * people;
});

// ==========================================
// THANH TOÁN
// ==========================================

const handleThanhToan = async () => {
  if (isLoading.value) return;

  try {
    isLoading.value = true;

    // ==========================================
    // CHUẨN BỊ DATA GỬI BACKEND
    // ==========================================

    const payload = {
      ...bookingState.value,

      payment_method: selectedMethod.value,

      details:
        bookingState.value.details || bookingState.value.booking_details || [],
    };

    console.log("PAYMENT PAYLOAD:", payload);

    // ==========================================
    // LOADING
    // ==========================================

    Swal.fire({
      title:
        selectedMethod.value === "vnpay"
          ? "Đang kết nối VNPAY..."
          : "Đang tạo booking...",

      text: "Vui lòng chờ trong giây lát",

      allowOutsideClick: false,
      allowEscapeKey: false,

      didOpen: () => {
        Swal.showLoading();
      },
    });

    // ==========================================
    // GỌI BACKEND
    // ==========================================

    let response;

    // -----------------------------
    // VNPAY
    // -----------------------------

    if (selectedMethod.value === "vnpay") {
      const res = await paymentService.createPaymentHold(payload);

      response = res.data;
    }

    // -----------------------------
    // COD
    // -----------------------------
    else if (selectedMethod.value === "cod") {
      const res = await paymentService.createBooking(payload);

      response = res.data;
    }

    // -----------------------------
    // PHƯƠNG THỨC KHÔNG HỢP LỆ
    // -----------------------------
    else {
      throw new Error("Phương thức thanh toán không hợp lệ");
    }

    console.log("PAYMENT RESPONSE:", response);

    Swal.close();

    // ==========================================
    // BACKEND TRẢ VỀ ERROR
    // ==========================================

    if (!response?.success) {
      await Swal.fire({
        icon: "error",

        title: "Thanh toán thất bại",

        text: response?.message || "Không thể tạo đơn hàng!",

        confirmButtonText: "Đóng",
      });

      return;
    }

    // ==========================================
    // VNPAY
    // ==========================================

    if (selectedMethod.value === "vnpay") {
      const paymentUrl = response?.data?.payment_url || response?.payment_url;

      if (!paymentUrl) {
        await Swal.fire({
          icon: "error",

          title: "Không có link thanh toán",

          text: "Backend chưa trả về payment_url.",

          confirmButtonText: "Đóng",
        });

        return;
      }

      console.log("VNPAY URL:", paymentUrl);

      // QUAN TRỌNG:
      // Không clear bookingData ở đây.
      // Backend đã lưu payment_hold.
      // Sau đó chuyển sang VNPAY.

      window.location.href = paymentUrl;

      return;
    }

    // ==========================================
    // COD THÀNH CÔNG
    // ==========================================

    if (selectedMethod.value === "cod") {
      // Xóa dữ liệu booking tạm
      localStorage.removeItem("bookingData");

      if (bookingStore.clearBooking) {
        bookingStore.clearBooking();
      }

      await Swal.fire({
        icon: "success",

        title: "Đặt tour thành công!",

        text: "Đơn đặt tour đã được tạo, bạn sẽ thanh toán sau.",

        confirmButtonText: "OK",
      });

      router.push("/");

      return;
    }
  } catch (error) {
    Swal.close();

    console.error("LỖI THANH TOÁN:", error);

    await Swal.fire({
      icon: "error",

      title: "Có lỗi xảy ra",

      text:
        error?.response?.data?.message ||
        error?.message ||
        "Không thể kết nối đến máy chủ!",

      confirmButtonText: "Đóng",
    });
  } finally {
    isLoading.value = false;
  }
};
</script>
