import { defineStore } from "pinia";
import { ref } from "vue";
import bookingService from "../services/booking.service.js";

export const useBookingStore = defineStore("booking", () => {
  const defaultBookingData = {
    tour_id: null,
    schedule_id: null,

    people: 1,

    booker_name: "",
    booker_phone: "",
    booker_email: "",
    booker_identity_number: "",

    departure: "",
    special_request: "",

    booking_details: [],

    booking_id: null,

    payment_id: null,

    payment_code: null,

    hold_id: null,

    hold_expires_at: null,

    paymentMethod: "vnpay",

    payment_method: "vnpay",
  };

  const savedBooking = localStorage.getItem("bookingData");

  const bookingData = ref(
    savedBooking
      ? JSON.parse(savedBooking)
      : {
          ...defaultBookingData,
          booking_details: [],
        },
  );

  const setBooking = (data) => {
    bookingData.value = {
      ...bookingData.value,
      ...data,
    };

    localStorage.setItem("bookingData", JSON.stringify(bookingData.value));
  };

  const setBookingDetails = (details) => {
    bookingData.value.booking_details = details;

    localStorage.setItem("bookingData", JSON.stringify(bookingData.value));
  };

  const setPayment = (data) => {
    bookingData.value = {
      ...bookingData.value,
      ...data,
    };

    localStorage.setItem("bookingData", JSON.stringify(bookingData.value));
  };

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
