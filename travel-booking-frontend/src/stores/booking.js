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
     *
     * Hiện tại hệ thống sử dụng VNPAY.
     */
    const paymentMethod = String(
      dataBooking.payment_method || dataBooking.paymentMethod || "vnpay",
    )
      .toLowerCase()
      .trim();
    console.log(paymentMethod)
    if (paymentMethod !== "vnpay") {
      return {
        success: false,
        message: "Hiện tại chỉ hỗ trợ thanh toán qua VNPAY",
      };
    }

    /*
     * ========================================================
     * 2. XÁC ĐỊNH LOẠI THANH TOÁN
     * ========================================================
     *
     * deposit = cọc 30%
     * full    = thanh toán 100%
     */
    const paymentType = String(
      dataBooking.payment_type || dataBooking.paymentType || "full",
    )
      .toLowerCase()
      .trim();

    if (paymentType !== "deposit" && paymentType !== "full") {
      return {
        success: false,
        message: "Loại thanh toán không hợp lệ",
      };
    }

    /*
     * ========================================================
     * 3. CHUẨN HÓA DỮ LIỆU BOOKING
     * ========================================================
     */

    const tourId = Number(dataBooking.tour_id);

    const scheduleId = Number(dataBooking.schedule_id);

    const totalPeople = Number(
      dataBooking.total_people || dataBooking.people || 0,
    );

    const selectedTourType = String(
      dataBooking.selected_tour_type || "SIC",
    ).toUpperCase();

    /*
     * ========================================================
     * 4. DANH SÁCH LOẠI VÉ
     * ========================================================
     *
     * Backend sẽ dùng ticket_items để:
     *
     * - tìm ticket_types
     * - tính giá
     * - tính tổng số người
     * - kiểm tra số lượng vé
     */
    const ticketItems = Array.isArray(dataBooking.ticket_items)
      ? dataBooking.ticket_items
      : [];

    /*
     * ========================================================
     * 5. THÔNG TIN THÀNH VIÊN
     * ========================================================
     */

    const details = Array.isArray(dataBooking.booking_details)
      ? dataBooking.booking_details
      : Array.isArray(dataBooking.details)
        ? dataBooking.details
        : [];

    /*
     * ========================================================
     * 6. VALIDATE DỮ LIỆU
     * ========================================================
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

    if (!ticketItems.length) {
      return {
        success: false,
        message: "Chưa có thông tin loại vé",
      };
    }

    /*
     * Kiểm tra từng loại vé
     */
    const invalidTicket = ticketItems.some((item) => {
      const ticketTypeId = Number(
        item.ticket_type_id ?? item.ticketTypeId ?? item.id,
      );

      const quantity = Number(item.quantity ?? item.qty ?? 0);

      return !ticketTypeId || !quantity || quantity <= 0;
    });

    if (invalidTicket) {
      return {
        success: false,
        message: "Thông tin loại vé không hợp lệ",
      };
    }

    /*
     * ========================================================
     * 7. TẠO PAYLOAD GỬI BACKEND
     * ========================================================
     */

    const payload = {
      tour_id: tourId,

      schedule_id: scheduleId,

      selected_tour_type: selectedTourType,

      total_people: totalPeople,

      adult_count: Number(dataBooking.adult_count || 0),

      child_count: Number(dataBooking.child_count || 0),

      infant_count: Number(dataBooking.infant_count || 0),

      /*
       * Quan trọng:
       * Gửi danh sách vé để backend tự tính tiền.
       */
      ticket_items: ticketItems,

      /*
       * Thông tin người đặt
       */
      booker_name: dataBooking.booker_name?.trim() || "",

      booker_phone: dataBooking.booker_phone?.trim() || "",

      booker_email: dataBooking.booker_email?.trim() || "",

      booker_identity_number:
        dataBooking.booker_identity_number?.trim() || null,

      /*
       * Thông tin chuyến đi
       */
      departure: dataBooking.departure?.trim() || null,

      pickup_point_id: dataBooking.pickup_point_id || null,

      pickup_note: dataBooking.pickup_note?.trim() || null,

      special_request: dataBooking.special_request?.trim() || null,

      /*
       * Thành viên.
       *
       * Tour đoàn/gia đình có thể để [].
       * Vé lẻ sẽ gửi danh sách thành viên.
       */
      details,

      /*
       * Thanh toán
       */
      payment_method: "vnpay",

      payment_type: paymentType,
    };

    /*
     * ========================================================
     * 8. GỌI API TẠO PAYMENT HOLD
     * ========================================================
     *
     * Backend sẽ:
     *
     * 1. Kiểm tra tour
     * 2. Kiểm tra schedule
     * 3. Kiểm tra ticket_types
     * 4. Tính tổng tiền
     * 5. Tính số tiền cọc/full
     * 6. Giữ slot
     * 7. Tạo payment_hold
     * 8. Tạo URL VNPAY
     */

    console.log("PAYMENT HOLD PAYLOAD:", payload);

    const hold = await bookingService.createPaymentHold(payload);

    /*
     * ========================================================
     * 9. KIỂM TRA RESPONSE
     * ========================================================
     */

    if (!hold?.data?.success) {
      return {
        success: false,
        message:
          hold?.data?.message || "Không thể tạo yêu cầu thanh toán",
      };
    }

    /*
     * ========================================================
     * 10. LẤY DỮ LIỆU BACKEND
     * ========================================================
     */

    const resData = hold.data.data;

    /*
     * ========================================================
     * 11. KIỂM TRA URL VNPAY
     * ========================================================
     */

    if (!resData?.payment_url) {
      return {
        success: false,
        message: "Không nhận được đường dẫn thanh toán VNPAY",
      };
    }

    /*
     * ========================================================
     * 12. TRẢ KẾT QUẢ CHO COMPONENT
     * ========================================================
     */

    return {
      success: true,

      message:
        hold.data.message ||
        (paymentType === "deposit"
          ? "Đã tạo yêu cầu cọc 30%, vui lòng thanh toán VNPAY"
          : "Đã tạo yêu cầu thanh toán 100%, vui lòng thanh toán VNPAY"),

      data: resData,

      payment_url: resData.payment_url,

      hold_id: resData.hold_id || resData.id || null,

      expires_at: resData.expires_at || resData.hold_expires_at || null,

      payment_code: resData.payment_code || null,

      /*
       * Thông tin tiền backend tính
       */
      original_amount: resData.original_amount ?? null,

      discount_amount: resData.discount_amount ?? null,

      total_amount: resData.total_amount ?? null,

      payment_amount: resData.payment_amount ?? null,

      remaining_amount: resData.remaining_amount ?? null,

      payment_type: paymentType,
    };
  } catch (error) {
    /*
     * ========================================================
     * XỬ LÝ ERROR
     * ========================================================
     */

    console.error("THANH TOAN ERROR:", error);

    console.error(
      "THANH TOAN RESPONSE:",
      error?.response?.data,
    );

    return {
      success: false,

      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Có lỗi xảy ra khi thanh toán",
    };
  }
};
