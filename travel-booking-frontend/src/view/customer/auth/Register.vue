<script setup>
import { ref } from "vue";
import { useRouter, useRoute, RouterLink } from "vue-router";
import { registerStore } from "../../../stores/auth";
import Swal from "sweetalert2";

const router = useRouter();
const route = useRoute();

const full_name = ref("");
const email = ref("");
const phone = ref("");
const password = ref("");
const confirmPassword = ref("");
const date_of_birth = ref("");
const gender = ref("");
const address = ref("");

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const agreeTerms = ref(false);

const handleRegister = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  // Kiểm tra mật khẩu
  if (password.value !== confirmPassword.value) {
    await Swal.fire({
      icon: "error",
      title: "Đăng ký thất bại",
      text: "Mật khẩu xác nhận không khớp.",
      confirmButtonText: "Thử lại",
    });
    return;
  }

  if (password.value.length < 6) {
    await Swal.fire({
      icon: "error",
      title: "Đăng ký thất bại",
      text: "Mật khẩu phải có ít nhất 6 ký tự.",
      confirmButtonText: "Thử lại",
    });
    return;
  }

  if (!agreeTerms.value) {
    await Swal.fire({
      icon: "warning",
      title: "Chưa đồng ý điều khoản",
      text: "Vui lòng đồng ý với điều khoản sử dụng.",
      confirmButtonText: "Đã hiểu",
    });
    return;
  }

  loading.value = true;

  try {
    const result = await registerStore({
      full_name: full_name.value,
      email: email.value,
      password: password.value,
      phone: phone.value,
      date_of_birth: date_of_birth.value || null,
      gender: gender.value || null,
      address: address.value || null,
    });

    // Đăng ký thất bại
    if (!result?.success) {
      errorMessage.value = result?.message || "Đăng ký tài khoản thất bại";

      await Swal.fire({
        icon: "error",
        title: "Đăng ký thất bại",
        text: errorMessage.value,
        confirmButtonText: "Thử lại",
      });

      return;
    }

    // Đăng ký thành công
    successMessage.value = result.message || "Đăng ký tài khoản thành công";

    await Swal.fire({
      icon: "success",
      title: "Đăng ký thành công!",
      text: "Tài khoản của bạn đã được tạo. Vui lòng đăng nhập.",
      confirmButtonText: "Đăng nhập",
      timer: 2000,
      timerProgressBar: true,
    });

    // Giữ lại trang người dùng muốn quay lại
    const redirect = route.query.redirect;

    router.push({
      path: "/login",
      query: redirect ? { redirect } : {},
    });
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message || "Có lỗi xảy ra khi đăng ký tài khoản";

    await Swal.fire({
      icon: "error",
      title: "Có lỗi xảy ra",
      text: errorMessage.value,
      confirmButtonText: "Thử lại",
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-950">
    <!-- BACKGROUND -->
    <div class="fixed inset-0 overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2400&q=95"
        alt="Sunset travel"
        class="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div class="absolute inset-0 bg-black/25"></div>

      <div
        class="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/50"
      ></div>

      <div
        class="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/70 via-black/10 to-transparent"
      ></div>

      <div
        class="absolute left-1/2 top-[30%] h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-white/10 blur-[120px]"
      ></div>
    </div>

    <!-- MAIN -->
    <main
      class="relative flex min-h-screen items-center justify-center px-5 py-10"
    >
      <!-- LOGO -->
      <div class="absolute left-6 top-6 z-30 lg:left-10 lg:top-10">
        <RouterLink to="/" class="group flex items-center gap-3">
          <div
            class="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/30 bg-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.25)] backdrop-blur-2xl transition group-hover:bg-white/20"
          >
            <svg
              class="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-5"
              />
            </svg>
          </div>

          <div class="hidden sm:block">
            <div
              class="text-xl font-bold tracking-tight text-white drop-shadow-lg"
            >
              Travel<span class="text-white/70">Go</span>
            </div>

            <div class="text-[9px] uppercase tracking-[0.3em] text-white/55">
              Travel & Explore
            </div>
          </div>
        </RouterLink>
      </div>

      <!-- REGISTER CARD -->
      <div class="relative z-20 w-full max-w-[520px]">
        <div
          class="relative overflow-hidden rounded-[2.25rem] border border-white/25 bg-white/[0.13] p-7 shadow-[0_35px_100px_rgba(0,0,0,0.5)] backdrop-blur-[28px] sm:p-9"
        >
          <!-- DECORATION -->
          <div
            class="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/20 via-white/5 to-transparent"
          ></div>

          <div
            class="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-white/10 blur-[80px]"
          ></div>

          <div
            class="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-white/10 blur-[80px]"
          ></div>

          <div class="relative">
            <!-- BADGE -->
            <div class="mb-6 flex justify-center">
              <div
                class="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/80 backdrop-blur-xl"
              >
                <span class="relative flex h-2 w-2">
                  <span
                    class="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/50"
                  ></span>

                  <span
                    class="relative inline-flex h-2 w-2 rounded-full bg-white"
                  ></span>
                </span>

                Start your journey
              </div>
            </div>

            <!-- TITLE -->
            <div class="mb-7 text-center">
              <h1
                class="text-[32px] font-bold tracking-[-0.03em] text-white sm:text-[36px]"
              >
                Tạo tài khoản
              </h1>

              <p class="mt-3 text-sm leading-6 text-white/65">
                Bắt đầu hành trình khám phá những điểm đến tuyệt vời cùng
                TravelGo.
              </p>
            </div>

            <!-- ERROR -->
            <div
              v-if="errorMessage"
              class="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300"
            >
              {{ errorMessage }}
            </div>

            <!-- SUCCESS -->
            <div
              v-if="successMessage"
              class="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300"
            >
              {{ successMessage }}
            </div>

            <!-- FORM -->
            <form @submit.prevent="handleRegister" class="space-y-4">
              <!-- HỌ TÊN -->
              <div>
                <label
                  for="full_name"
                  class="mb-2 block text-sm font-semibold text-white/90"
                >
                  Họ và tên
                </label>

                <input
                  v-model.trim="full_name"
                  type="text"
                  id="full_name"
                  name="full_name"
                  placeholder="Nguyễn Văn A"
                  autocomplete="name"
                  required
                  class="w-full rounded-[17px] border border-white/20 bg-black/15 px-4 py-[14px] text-sm text-white outline-none transition-all duration-300 placeholder:text-white/35 hover:border-white/30 focus:border-white/55 focus:bg-black/20 focus:ring-4 focus:ring-white/10"
                />
              </div>

              <!-- EMAIL -->
              <div>
                <label
                  for="email"
                  class="mb-2 block text-sm font-semibold text-white/90"
                >
                  Email
                </label>

                <input
                  v-model.trim="email"
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  autocomplete="email"
                  required
                  class="w-full rounded-[17px] border border-white/20 bg-black/15 px-4 py-[14px] text-sm text-white outline-none transition-all duration-300 placeholder:text-white/35 hover:border-white/30 focus:border-white/55 focus:bg-black/20 focus:ring-4 focus:ring-white/10"
                />
              </div>

              <!-- PHONE -->
              <div>
                <label
                  for="phone"
                  class="mb-2 block text-sm font-semibold text-white/90"
                >
                  Số điện thoại
                </label>

                <input
                  v-model.trim="phone"
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="0987654321"
                  autocomplete="tel"
                  required
                  class="w-full rounded-[17px] border border-white/20 bg-black/15 px-4 py-[14px] text-sm text-white outline-none transition-all duration-300 placeholder:text-white/35 hover:border-white/30 focus:border-white/55 focus:bg-black/20 focus:ring-4 focus:ring-white/10"
                />
              </div>

              <!-- NGÀY SINH + GIỚI TÍNH -->
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <!-- DATE OF BIRTH -->
                <div>
                  <label
                    for="date_of_birth"
                    class="mb-2 block text-sm font-semibold text-white/90"
                  >
                    Ngày sinh
                  </label>

                  <input
                    v-model="date_of_birth"
                    type="date"
                    id="date_of_birth"
                    name="date_of_birth"
                    class="w-full rounded-[17px] border border-white/20 bg-black/15 px-4 py-[14px] text-sm text-white outline-none transition-all duration-300 focus:border-white/55 focus:ring-4 focus:ring-white/10"
                  />
                </div>

                <!-- GENDER -->
                <div>
                  <label
                    for="gender"
                    class="mb-2 block text-sm font-semibold text-white/90"
                  >
                    Giới tính
                  </label>

                  <select
                    v-model="gender"
                    id="gender"
                    name="gender"
                    class="w-full rounded-[17px] border border-white/20 bg-slate-900/80 px-4 py-[14px] text-sm text-white outline-none transition-all duration-300 focus:border-white/55 focus:ring-4 focus:ring-white/10"
                  >
                    <option value="">Chọn giới tính</option>

                    <option value="MALE">Nam</option>

                    <option value="FEMALE">Nữ</option>

                    <option value="OTHER">Khác</option>
                  </select>
                </div>
              </div>

              <!-- ĐỊA CHỈ -->
              <div>
                <label
                  for="address"
                  class="mb-2 block text-sm font-semibold text-white/90"
                >
                  Địa chỉ
                </label>

                <input
                  v-model.trim="address"
                  type="text"
                  id="address"
                  name="address"
                  placeholder="Hà Nội, Việt Nam"
                  autocomplete="street-address"
                  class="w-full rounded-[17px] border border-white/20 bg-black/15 px-4 py-[14px] text-sm text-white outline-none transition-all duration-300 placeholder:text-white/35 hover:border-white/30 focus:border-white/55 focus:bg-black/20 focus:ring-4 focus:ring-white/10"
                />
              </div>

              <!-- PASSWORD -->
              <div>
                <label
                  for="password"
                  class="mb-2 block text-sm font-semibold text-white/90"
                >
                  Mật khẩu
                </label>

                <input
                  v-model="password"
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Tối thiểu 6 ký tự"
                  autocomplete="new-password"
                  minlength="6"
                  required
                  class="w-full rounded-[17px] border border-white/20 bg-black/15 px-4 py-[14px] text-sm text-white outline-none transition-all duration-300 placeholder:text-white/35 hover:border-white/30 focus:border-white/55 focus:bg-black/20 focus:ring-4 focus:ring-white/10"
                />
              </div>

              <!-- CONFIRM PASSWORD -->
              <div>
                <label
                  for="confirmPassword"
                  class="mb-2 block text-sm font-semibold text-white/90"
                >
                  Xác nhận mật khẩu
                </label>

                <input
                  v-model="confirmPassword"
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Nhập lại mật khẩu"
                  autocomplete="new-password"
                  required
                  class="w-full rounded-[17px] border border-white/20 bg-black/15 px-4 py-[14px] text-sm text-white outline-none transition-all duration-300 placeholder:text-white/35 hover:border-white/30 focus:border-white/55 focus:bg-black/20 focus:ring-4 focus:ring-white/10"
                />
              </div>

              <!-- TERMS -->
              <div class="pt-1">
                <label
                  class="flex cursor-pointer items-start gap-3 select-none"
                >
                  <input
                    v-model="agreeTerms"
                    type="checkbox"
                    required
                    class="mt-1 h-4 w-4 rounded border-white/30 bg-white/10"
                  />

                  <span class="text-xs leading-5 text-white/60">
                    Tôi đồng ý với
                    <a
                      href="#"
                      class="font-medium text-white underline underline-offset-4 decoration-white/30 hover:decoration-white"
                    >
                      Điều khoản sử dụng
                    </a>
                    và
                    <a
                      href="#"
                      class="font-medium text-white underline underline-offset-4 decoration-white/30 hover:decoration-white"
                    >
                      Chính sách bảo mật
                    </a>
                    của TravelGo.
                  </span>
                </label>
              </div>

              <!-- REGISTER -->
              <button
                type="submit"
                :disabled="loading"
                class="group relative w-full overflow-hidden rounded-[17px] bg-white py-[15px] text-sm font-bold text-slate-900 shadow-[0_15px_35px_rgba(0,0,0,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-[0_20px_45px_rgba(0,0,0,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span class="relative flex items-center justify-center gap-2">
                  <span v-if="loading"> Đang tạo tài khoản... </span>

                  <span v-else> Tạo tài khoản </span>

                  <svg
                    v-if="!loading"
                    class="h-4 w-4 transition duration-300 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 12h14M13 6l6 6-6 6"
                    />
                  </svg>
                </span>
              </button>
            </form>

            <!-- DIVIDER -->
            <div class="my-7 flex items-center gap-4">
              <div class="h-px flex-1 bg-white/15"></div>

              <span
                class="text-[10px] font-semibold tracking-[0.2em] text-white/40"
              >
                HOẶC
              </span>

              <div class="h-px flex-1 bg-white/15"></div>
            </div>

            <!-- SOCIAL -->
            <div class="grid grid-cols-2 gap-3">
              <!-- GOOGLE -->

              <button
                type="button"
                class="group flex items-center justify-center gap-3 rounded-[16px] border border-white/20 bg-white/95 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:bg-white hover:border-white hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              >
                <svg
                  class="w-[19px] h-[19px] shrink-0"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="#EA4335"
                    d="M12 10.2v4h5.6c-.24 1.29-.98 2.38-2.08 3.11l3.36 2.61C20.84 18.01 22 15.3 22 12.07c0-.73-.07-1.43-.19-2.1H12v.23z"
                  />

                  <path
                    fill="#4285F4"
                    d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.36-2.61c-.9.6-2.05.96-3.25.96-2.59 0-4.79-1.75-5.58-4.1H2.95v2.69A9.99 9.99 0 0012 22z"
                  />

                  <path
                    fill="#FBBC05"
                    d="M6.42 13.81A6.01 6.01 0 016.1 12c0-.63.11-1.24.32-1.81V7.5H2.95A10 10 0 002 12c0 1.61.39 3.13.95 4.5l3.47-2.69z"
                  />

                  <path
                    fill="#34A853"
                    d="M12 6.09c1.47 0 2.79.51 3.83 1.51l2.87-2.87C16.95 3.09 14.7 2 12 2a9.99 9.99 0 00-9.05 5.5l3.47 2.69c.79-2.35 2.99-4.1 5.58-4.1z"
                  />
                </svg>

                <span>Google</span>
              </button>

              <!-- FACEBOOK -->

              <button
                type="button"
                class="group flex items-center justify-center gap-3 rounded-[16px] border border-white/20 bg-white/95 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:bg-white hover:border-white hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              >
                <svg
                  class="w-[20px] h-[20px] shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="12" cy="12" r="10" fill="#1877F2" />

                  <path
                    fill="white"
                    d="M13.4 20v-7h2.35l.35-2.73H13.4V8.53c0-.79.22-1.33 1.35-1.33h1.44V4.76c-.25-.03-1.1-.1-2.1-.1-2.08 0-3.5 1.27-3.5 3.6v2.01H8.24V13h2.35v7h2.81z"
                  />
                </svg>

                <span>Facebook</span>
              </button>
            </div>

            <!-- LOGIN -->
            <div class="mt-7 text-center">
              <p class="text-sm text-white/55">
                Đã có tài khoản?

                <RouterLink
                  to="/login"
                  class="ml-1 font-semibold text-white underline underline-offset-4 decoration-white/30 transition hover:decoration-white"
                >
                  Đăng nhập
                </RouterLink>
              </p>
            </div>

            <!-- SECURITY -->
            <div class="mt-7 border-t border-white/10 pt-5">
              <div
                class="flex items-center justify-center gap-2 text-[11px] text-white/35"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v2h8z"
                  />
                </svg>

                Secure & encrypted connection
              </div>
            </div>
          </div>
        </div>

        <!-- BACK HOME -->
        <div class="mt-6 text-center">
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <span>←</span>
            Quay lại trang chủ
          </RouterLink>
        </div>
      </div>
    </main>

    <!-- BOTTOM -->
    <div
      class="fixed bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-white/35 md:flex"
    >
      <span>Discover</span>

      <span class="h-1 w-1 rounded-full bg-white/50"></span>

      <span>Travel</span>

      <span class="h-1 w-1 rounded-full bg-white/50"></span>

      <span>Experience</span>
    </div>
  </div>
</template>

<!-- =================================================
                 SOCIAL REGISTER
            ================================================== -->
