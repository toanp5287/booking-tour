import { defineStore } from "pinia";
import { ref } from "vue";
import bookingService from "../services/booking.service.js";

export const useBookingStore = defineStore("booking", () => {
  /*
   * =========================================================
   * DỮ LIỆU BOOKING MẶC ĐỊNH
   * =========================================================
   */
  const defaultBookingData = {
    // Tour
    tour_id: null,
    schedule_id: null,
    people: 1,

    // Người đặt
    booker_name: "",
    booker_phone: "",
    booker_email: "",
    booker_identity_number: "",
    departure: "",
    special_request: "",

    // Thành viên đi tour
    booking_details: [],

    // Booking sau khi tạo thành công
    booking_id: null,

    // Payment
    payment_id: null,
    payment_code: null,

    // VNPAY payment hold
    hold_id: null,
    hold_expires_at: null,

    // Phương thức thanh toán
    paymentMethod: "vnpay",
    payment_method: "vnpay",
  };

  /*
   * =========================================================
   * LẤY BOOKING TỪ LOCAL STORAGE
   * =========================================================
   */
  const savedBooking = localStorage.getItem("bookingData");

  const bookingData = ref(
    savedBooking
      ? JSON.parse(savedBooking)
      : {
          ...defaultBookingData,
          booking_details: [],
        },
  );

  /*
   * =========================================================
   * SET BOOKING
   * =========================================================
   */
  const setBooking = (data) => {
    bookingData.value = {
      ...bookingData.value,
      ...data,
    };

    localStorage.setItem("bookingData", JSON.stringify(bookingData.value));
  };

  /*
   * =========================================================
   * SET BOOKING DETAILS
   * =========================================================
   */
  const setBookingDetails = (details) => {
    bookingData.value.booking_details = Array.isArray(details) ? details : [];

    localStorage.setItem("bookingData", JSON.stringify(bookingData.value));
  };

  /*
   * =========================================================
   * SET PAYMENT
   * =========================================================
   */
  const setPayment = (data) => {
    bookingData.value = {
      ...bookingData.value,
      ...data,
    };

    localStorage.setItem("bookingData", JSON.stringify(bookingData.value));
  };

  /*
   * =========================================================
   * CLEAR BOOKING
   * =========================================================
   *
   * Chỉ gọi sau khi COD thành công
   * hoặc sau khi VNPAY callback thành công.
   */
  const clearBooking = () => {
    bookingData.value = {
      ...defaultBookingData,
      booking_details: [],
    };

    localStorage.removeItem("bookingData");
  };

  return {
    bookingData,

    setBooking,

    setBookingDetails,

    setPayment,

    clearBooking,
  };
});

/*
 * ============================================================
 * THANH TOÁN
 * ============================================================
 *
 * COD:
 *   createBooking()
 *
 * VNPAY:
 *   createPaymentHold()
 *   -> giữ slot
 *   -> chưa tạo booking
 *   -> chưa tạo payment
 *   -> chuyển sang VNPAY
 *
 * Sau khi VNPAY thành công:
 *   Backend callback mới tạo:
 *   booking
 *   booking_details
 *   payment
 * ============================================================
 */
export const thanhToan = async (dataBooking) => {
  try {
    /*
     * ========================================================
     * 1. XÁC ĐỊNH PHƯƠNG THỨC THANH TOÁN
     * ========================================================
     */

    const rawMethod = String(
      dataBooking.payment_method || dataBooking.paymentMethod || "cod",
    )
      .toLowerCase()
      .trim();

    /*
     * Code cũ của mày có "later".
     *
     * Nếu dữ liệu cũ trong localStorage vẫn còn "later"
     * thì chuyển thành "cod".
     */
    const paymentMethod = rawMethod === "later" ? "cod" : rawMethod;

    /*
     * ========================================================
     * 2. KIỂM TRA PHƯƠNG THỨC
     * ========================================================
     */

    if (paymentMethod !== "cod" && paymentMethod !== "vnpay") {
      return {
        success: false,
        message: "Phương thức thanh toán không hợp lệ",
      };
    }

    /*
     * ========================================================
     * 3. CHUẨN HÓA DỮ LIỆU CHUNG
     * ========================================================
     */

    const tourId = Number(dataBooking.tour_id);

    const scheduleId = Number(dataBooking.schedule_id);

    const totalPeople = Number(
      dataBooking.total_people || dataBooking.people || 1,
    );

    const details = Array.isArray(dataBooking.booking_details)
      ? dataBooking.booking_details
      : Array.isArray(dataBooking.details)
        ? dataBooking.details
        : [];

    /*
     * Kiểm tra cơ bản
     */
    if (!tourId) {
      return {
        success: false,
        message: "Không xác định được tour",
      };
    }

    if (!scheduleId) {
      return {
        success: false,
        message: "Không xác định được lịch khởi hành",
      };
    }

    if (!totalPeople || totalPeople <= 0) {
      return {
        success: false,
        message: "Số lượng người không hợp lệ",
      };
    }

    /*
     * ========================================================
     * 4. COD
     * ========================================================
     *
     * COD được tạo booking ngay.
     *
     * Backend sẽ:
     *
     * booking
     * booking_details
     * payment pending
     * trừ available_slots
     */

    if (paymentMethod === "cod") {
      const booking = await bookingService.createBooking({
        tour_id: tourId,

        schedule_id: scheduleId,

        total_people: totalPeople,

        booker_name: dataBooking.booker_name,

        booker_phone: dataBooking.booker_phone,

        booker_email: dataBooking.booker_email,

        booker_identity_number: dataBooking.booker_identity_number || null,

        departure: dataBooking.departure || null,

        special_request: dataBooking.special_request || null,

        details: details,

        payment_method: "cod",
      });

      /*
       * Kiểm tra response
       */
      if (!booking?.data?.success) {
        return {
          success: false,

          message: booking?.data?.message || "Không thể tạo booking",
        };
      }

      /*
       * Lấy dữ liệu backend trả về
       */
      const resData = booking.data.data;

      /*
       * Trả kết quả cho component cha
       */
      return {
        success: true,

        message: booking.data.message || "Đặt tour thành công",

        data: resData,

        payment_url: null,

        booking_id: resData?.id || resData?.booking_id || null,

        payment_id: resData?.payment_id || null,

        payment_code: resData?.payment_code || null,
      };
    }

    /*
     * ========================================================
     * 5. VNPAY
     * ========================================================
     *
     * TUYỆT ĐỐI KHÔNG gọi createBooking().
     *
     * Chỉ tạo payment_hold.
     *
     * Backend:
     *
     * payment_holds
     * available_slots - people
     *
     * Sau đó tạo URL VNPAY.
     */

    if (paymentMethod === "vnpay") {
      const hold = await bookingService.createPaymentHold({
        tour_id: tourId,

        schedule_id: scheduleId,

        total_people: totalPeople,

        booker_name: dataBooking.booker_name,

        booker_phone: dataBooking.booker_phone,

        booker_email: dataBooking.booker_email,

        booker_identity_number: dataBooking.booker_identity_number || null,

        departure: dataBooking.departure || null,

        special_request: dataBooking.special_request || null,

        details: details,

        payment_method: "vnpay",
      });

      /*
       * Kiểm tra response
       */
      if (!hold?.data?.success) {
        return {
          success: false,

          message: hold?.data?.message || "Không thể tạo thanh toán",
        };
      }

      /*
       * Dữ liệu backend trả về
       */
      const resData = hold.data.data;

      /*
       * Kiểm tra URL VNPAY
       */
      if (!resData?.payment_url) {
        return {
          success: false,

          message: "Không nhận được đường dẫn thanh toán VNPAY",
        };
      }

      /*
       * Trả kết quả
       */
      return {
        success: true,

        message: hold.data.message || "Đã giữ chỗ, vui lòng thanh toán VNPAY",

        data: resData,

        payment_url: resData.payment_url,

        hold_id: resData.hold_id || null,

        expires_at: resData.expires_at || null,

        payment_code: resData.payment_code || null,
      };
    }

    /*
     * Trường hợp không xác định
     */
    return {
      success: false,

      message: "Phương thức thanh toán không hợp lệ",
    };
  } catch (error) {
    /*
     * ========================================================
     * XỬ LÝ ERROR
     * ========================================================
     */

    console.error("THANH TOAN ERROR:", error);

    return {
      success: false,

      message:
        error?.response?.data?.message ||
        error?.message ||
        "Có lỗi xảy ra khi thanh toán",
    };
  }
};
