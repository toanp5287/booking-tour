<script setup>
import { ref, onMounted } from "vue";
import { storeLogin } from "../../../stores/auth";
import { useRouter, useRoute } from "vue-router";
import Swal from "sweetalert2";

const email = ref("");
const password = ref("");
const errorMessage = ref("");

const router = useRouter();
const route = useRoute();

const handleLogin = async () => {
  const result = await storeLogin(email.value, password.value);

  // Đăng nhập thất bại
  if (!result.success) {
    errorMessage.value = result.message;

    await Swal.fire({
      icon: "error",
      title: "Đăng nhập thất bại",
      text: result.message || "Email hoặc mật khẩu không chính xác.",
      confirmButtonText: "Thử lại",
    });

    return;
  }

  // Đăng nhập thành công
  await Swal.fire({
    icon: "success",
    title: "Đăng nhập thành công!",
    text: "Chào mừng bạn quay trở lại.",
    confirmButtonText: "Tiếp tục",
    timer: 1500,
    timerProgressBar: true,
  });

  // Lấy trang trước đó
  const redirect = route.query.redirect || "/";

  // Quay lại trang trước đó
  router.push(redirect);
};

const loginWithGoogle = () => {
  window.location.href = "https://booking-tour-lo20.onrender.com/google";
};
onMounted(() => {
  const token = route.query.token;

  if (token) {
    localStorage.setItem("accessToken", token);

    router.push("/");
  }
});
</script>

<template>
  <div class="min-h-screen bg-slate-950">
    <div class="fixed inset-0 overflow-hidden">
      <!-- Sunset travel image -->
      <img
        src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2400&q=95"
        alt="Sunset travel"
        class="absolute inset-0 w-full h-full object-cover object-center"
      />

      <!-- Soft cinematic darkness -->
      <div class="absolute inset-0 bg-black/20"></div>

      <!-- Dark edges -->
      <div
        class="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/40"
      ></div>

      <!-- Bottom cinematic shadow -->
      <div
        class="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-black/55 via-black/10 to-transparent"
      ></div>

      <!-- Very soft sunset light -->
      <div
        class="absolute left-1/2 top-[30%] -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-white/10 blur-[120px]"
      ></div>
    </div>

    <!-- =====================================================
         MAIN
    ====================================================== -->

    <main
      class="relative min-h-screen flex items-center justify-center px-5 py-10"
    >
      <!-- =================================================
           LOGO
      ================================================== -->

      <div class="absolute top-7 left-7 lg:top-10 lg:left-10 z-30">
        <a href="index.html" class="group flex items-center gap-3">
          <!-- Logo icon -->
          <div
            class="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/30 flex items-center justify-center shadow-[0_10px_35px_rgba(0,0,0,0.25)] transition group-hover:bg-white/20"
          >
            <svg
              class="w-6 h-6 text-white"
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

          <!-- Brand -->
          <div>
            <div
              class="text-xl font-bold tracking-tight text-white drop-shadow-lg"
            >
              Travel<span class="text-white/70">Go</span>
            </div>

            <div class="text-[9px] uppercase tracking-[0.3em] text-white/55">
              Travel & Explore
            </div>
          </div>
        </a>
      </div>

      <!-- =================================================
           LOGIN
      ================================================== -->

      <div class="relative z-20 w-full max-w-[430px]">
        <!-- =================================================
             MAIN CARD
        ================================================== -->

        <div
          class="relative overflow-hidden rounded-[2.25rem] border border-white/30 bg-white/[0.13] backdrop-blur-[28px] shadow-[0_35px_100px_rgba(0,0,0,0.45)] p-7 sm:p-9"
        >
          <!-- =================================================
               GLASS REFLECTION
          ================================================== -->

          <div
            class="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/20 via-white/5 to-transparent"
          ></div>

          <!-- Top-right glow -->
          <div
            class="pointer-events-none absolute -top-32 -right-32 w-72 h-72 rounded-full bg-white/10 blur-[80px]"
          ></div>

          <!-- Bottom glow -->
          <div
            class="pointer-events-none absolute -bottom-32 -left-32 w-72 h-72 rounded-full bg-white/10 blur-[80px]"
          ></div>

          <!-- =================================================
               CONTENT
          ================================================== -->

          <div class="relative">
            <!-- =================================================
                 BADGE
            ================================================== -->

            <div class="flex justify-center mb-7">
              <div
                class="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 backdrop-blur-xl px-4 py-2 shadow-lg text-[10px] font-semibold uppercase tracking-[0.12em] text-white/80"
              >
                <span class="relative flex w-2 h-2">
                  <span
                    class="absolute inline-flex w-full h-full rounded-full bg-white/50 animate-ping"
                  ></span>

                  <span
                    class="relative inline-flex w-2 h-2 rounded-full bg-white"
                  ></span>
                </span>

                Your journey starts here
              </div>
            </div>

            <!-- =================================================
                 HEADING
            ================================================== -->

            <div class="text-center mb-8">
              <h1
                class="text-[32px] sm:text-[36px] font-bold tracking-[-0.03em] text-white drop-shadow-[0_4px_15px_rgba(0,0,0,0.25)]"
              >
                Chào mừng trở lại
              </h1>

              <p class="mt-3 text-sm leading-6 text-white/65">
                Đăng nhập để tiếp tục hành trình khám phá thế giới cùng
                TravelGo.
              </p>
            </div>

            <!-- =================================================
                 FORM
            ================================================== -->

            <form class="space-y-5" @submit.prevent="handleLogin">
              <!-- =================================================
                   EMAIL
              ================================================== -->

              <div>
                <label
                  for="email"
                  class="block mb-2 text-sm font-semibold text-white/90"
                >
                  Email
                </label>

                <div class="relative">
                  <!-- Icon container -->

                  <div
                    class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                  >
                    <svg
                      class="w-[19px] h-[19px] text-white/45"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.7"
                        d="M3 8l9 6 9-6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
                      />
                    </svg>
                  </div>

                  <input
                    v-model="email"
                    type="email"
                    id="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                    class="peer w-full rounded-[17px] border border-white/20 bg-black/15 backdrop-blur-xl px-12 py-[15px] text-sm text-white placeholder-white/35 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:border-white/30 focus:border-white/55 focus:bg-black/20 focus:ring-4 focus:ring-white/10"
                  />
                </div>
              </div>

              <!-- =================================================
                   PASSWORD
              ================================================== -->

              <div>
                <div class="flex items-center justify-between mb-2">
                  <label
                    for="password"
                    class="text-sm font-semibold text-white/90"
                  >
                    Mật khẩu
                  </label>

                  <a
                    href="forgot-password.html"
                    class="text-xs font-medium text-white/55 hover:text-white transition"
                  >
                    Quên mật khẩu?
                  </a>
                </div>

                <div class="relative">
                  <!-- Lock icon -->

                  <div
                    class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                  >
                    <svg
                      class="w-[19px] h-[19px] text-white/45"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <rect
                        x="4"
                        y="10"
                        width="16"
                        height="10"
                        rx="2"
                        stroke-width="1.7"
                      />

                      <path
                        stroke-linecap="round"
                        stroke-width="1.7"
                        d="M8 10V7a4 4 0 018 0v3"
                      />
                    </svg>
                  </div>

                  <input
                    v-model="password"
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Nhập mật khẩu"
                    required
                    class="w-full rounded-[17px] border border-white/20 bg-black/15 backdrop-blur-xl px-12 py-[15px] text-sm text-white placeholder-white/35 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:border-white/30 focus:border-white/55 focus:bg-black/20 focus:ring-4 focus:ring-white/10"
                  />
                </div>
              </div>

              <!-- =================================================
                   REMEMBER
              ================================================== -->

              <div>
                <label
                  class="flex items-center gap-3 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    class="w-4 h-4 rounded border-white/30 bg-white/10 text-slate-900 focus:ring-white/20"
                  />

                  <span class="text-sm text-white/60"> Ghi nhớ tôi </span>
                </label>
              </div>

              <!-- =================================================
                   LOGIN BUTTON
              ================================================== -->

              <button
                type="submit"
                class="group relative w-full overflow-hidden rounded-[17px] bg-white py-[15px] text-sm font-bold text-slate-900 shadow-[0_15px_35px_rgba(0,0,0,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(0,0,0,0.35)] active:translate-y-0"
              >
                <!-- Button shine -->

                <span
                  class="absolute inset-y-0 -left-full w-1/2 skew-x-[-20deg] bg-gradient-to-r from-transparent via-black/5 to-transparent transition-all duration-700 group-hover:left-[130%]"
                ></span>

                <span class="relative flex items-center justify-center gap-2">
                  Đăng nhập

                  <svg
                    class="w-4 h-4 transition duration-300 group-hover:translate-x-1"
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

            <!-- =================================================
                 DIVIDER
            ================================================== -->

            <div class="flex items-center gap-4 my-7">
              <div class="h-px flex-1 bg-white/15"></div>

              <span
                class="text-[10px] font-semibold tracking-[0.2em] text-white/40"
              >
                HOẶC
              </span>

              <div class="h-px flex-1 bg-white/15"></div>
            </div>

            <!-- =================================================
                 SOCIAL LOGIN
            ================================================== -->

            <!-- =================================================
     SOCIAL LOGIN
================================================== -->

            <div class="grid grid-cols-2 gap-3">
              <!-- GOOGLE -->
              <button
                @click="loginWithGoogle"
                type="button"
                class="group flex items-center justify-center gap-3 rounded-[16px] border border-white/20 bg-white/95 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:bg-white hover:border-white hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              >
                <!-- Google Logo -->
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

                <span> Google </span>
              </button>

              <!-- FACEBOOK -->
              <button
                type="button"
                class="group flex items-center justify-center gap-3 rounded-[16px] border border-white/20 bg-white/95 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:bg-white hover:border-white hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              >
                <!-- Facebook Logo -->
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

                <span> Facebook </span>
              </button>
            </div>

            <!-- =================================================
                 REGISTER
            ================================================== -->

            <div class="text-center mt-7">
              <p class="text-sm text-white/55">
                Chưa có tài khoản?
                <RouterLink
                  to="/register"
                  class="ml-1 font-semibold text-white underline underline-offset-4 decoration-white/30 hover:decoration-white transition"
                >
                  Đăng ký ngay</RouterLink
                >
              </p>
            </div>

            <!-- =================================================
                 SECURITY
            ================================================== -->

            <div class="mt-7 pt-5 border-t border-white/10">
              <div
                class="flex items-center justify-center gap-2 text-[11px] text-white/35"
              >
                <svg
                  class="w-4 h-4"
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

        <!-- =================================================
             BACK HOME
        ================================================== -->

        <div class="text-center mt-6">
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition"
          >
            <span>←</span>

            Quay lại trang chủ
          </RouterLink>
        </div>
      </div>
    </main>

    <!-- =====================================================
         BOTTOM DECORATION
    ====================================================== -->

    <div
      class="fixed bottom-5 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-white/35"
    >
      <span>Discover</span>

      <span class="w-1 h-1 rounded-full bg-white/50"></span>

      <span>Travel</span>

      <span class="w-1 h-1 rounded-full bg-white/50"></span>

      <span>Experience</span>
    </div>
  </div>
</template>
