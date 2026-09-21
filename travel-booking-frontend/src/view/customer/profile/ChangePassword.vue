<script setup>
import { ref } from "vue";
import { changePasswordStore } from "../../../stores/auth";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";

const router = useRouter();

const passwordOld = ref("");
const passwordNew = ref("");
const confirmPasswordNew = ref("");

const errorPassword = ref("");
const isLoading = ref(false);

const handleChangePassword = async () => {
  errorPassword.value = "";

  // Kiểm tra mật khẩu cũ
  if (passwordOld.value.trim() === "") {
    await Swal.fire({
      icon: "warning",
      title: "Thiếu thông tin",
      text: "Vui lòng nhập mật khẩu cũ.",
      confirmButtonText: "Đã hiểu",
    });
    return;
  }

  // Kiểm tra mật khẩu mới
  if (passwordNew.value.trim() === "") {
    await Swal.fire({
      icon: "warning",
      title: "Thiếu thông tin",
      text: "Vui lòng nhập mật khẩu mới.",
      confirmButtonText: "Đã hiểu",
    });
    return;
  }

  // Kiểm tra độ dài
  if (passwordNew.value.length < 6) {
    await Swal.fire({
      icon: "warning",
      title: "Mật khẩu không hợp lệ",
      text: "Mật khẩu mới phải có ít nhất 6 ký tự.",
      confirmButtonText: "Đã hiểu",
    });
    return;
  }

  // Kiểm tra xác nhận
  if (passwordNew.value !== confirmPasswordNew.value) {
    await Swal.fire({
      icon: "warning",
      title: "Mật khẩu không khớp",
      text: "Mật khẩu xác nhận không đúng.",
      confirmButtonText: "Đã hiểu",
    });
    return;
  }

  try {
    isLoading.value = true;

    const result = await changePasswordStore({
      old_password: passwordOld.value,
      new_password: passwordNew.value,
    });

    // Đổi mật khẩu thất bại
    if (!result || result.success === false) {
      errorPassword.value = result?.message || "Đổi mật khẩu thất bại";

      await Swal.fire({
        icon: "error",
        title: "Đổi mật khẩu thất bại",
        text: errorPassword.value,
        confirmButtonText: "Thử lại",
      });

      return;
    }

    // Đổi mật khẩu thành công
    await Swal.fire({
      icon: "success",
      title: "Đổi mật khẩu thành công!",
      text: "Mật khẩu của bạn đã được cập nhật.",
      confirmButtonText: "Tiếp tục",
      timer: 1500,
      timerProgressBar: true,
    });

    // Xóa form
    passwordOld.value = "";
    passwordNew.value = "";
    confirmPasswordNew.value = "";

    // Về profile
    router.push("/profile");
  } catch (error) {
    console.error(error);

    errorPassword.value =
      error.response?.data?.message || "Đã xảy ra lỗi khi đổi mật khẩu";

    await Swal.fire({
      icon: "error",
      title: "Đổi mật khẩu thất bại",
      text: errorPassword.value,
      confirmButtonText: "Thử lại",
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="relative min-h-screen text-white pt-20 pb-16">
    <!-- BACKGROUND -->
    <div class="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <img
        src="/hero-bg.jpg"
        alt="Sunset travel"
        class="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div class="absolute inset-0 bg-black/40"></div>

      <div
        class="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-[#080b12]/80"
      ></div>

      <div
        class="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-[#080b12] via-[#080b12]/60 to-transparent"
      ></div>
    </div>

    <!-- ================= TOAST SUCCESS ================= -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-x-10 opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transition duration-300 ease-in"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="translate-x-10 opacity-0"
    >
      <div
        v-if="showToast"
        class="fixed right-5 top-24 z-[100] w-[340px] max-w-[calc(100vw-40px)]"
      >
        <div
          class="flex items-start gap-3 rounded-2xl border border-emerald-400/30 bg-[#071a13]/90 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
        >
          <!-- ICON -->
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <!-- CONTENT -->
          <div class="flex-1">
            <p class="text-sm font-bold text-white">Thành công</p>

            <p class="mt-1 text-xs leading-5 text-white/60">
              {{ successMessage }}
            </p>
          </div>

          <!-- CLOSE -->
          <button
            type="button"
            @click="showToast = false"
            class="text-white/40 transition hover:text-white"
          >
            ✕
          </button>
        </div>

        <!-- PROGRESS -->
        <div class="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
          <div
            class="h-full w-full origin-left rounded-full bg-emerald-400 animate-[toastProgress_1.5s_linear_forwards]"
          ></div>
        </div>
      </div>
    </Transition>

    <!-- ================= MAIN ================= -->
    <main class="relative z-10 mx-auto max-w-xl px-5 sm:px-8">
      <!-- BREADCRUMB -->
      <div
        class="mb-7 flex items-center gap-2 text-xs font-medium text-white/70"
      >
        <RouterLink to="/" class="transition hover:text-white">
          Trang chủ
        </RouterLink>

        <span class="text-white/40">/</span>

        <RouterLink to="/profile" class="transition hover:text-white">
          Tài khoản
        </RouterLink>

        <span class="text-white/40">/</span>

        <span class="font-semibold text-white"> Đổi mật khẩu </span>
      </div>

      <!-- FORM CARD -->
      <section
        class="overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/[0.08] p-7 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-9"
      >
        <!-- HEADER -->
        <div class="mb-8">
          <div
            class="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 backdrop-blur-xl"
          >
            <span
              class="h-1.5 w-1.5 rounded-full bg-orange-300 shadow-[0_0_8px_rgba(253,186,116,0.8)]"
            ></span>

            Security
          </div>

          <h1 class="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Đổi mật khẩu
          </h1>

          <p class="mt-2 text-xs leading-5 text-white/70">
            Cập nhật mật khẩu định kỳ để tăng tính an toàn và bảo mật cho tài
            khoản của bạn.
          </p>
        </div>

        <!-- ERROR -->
        <Transition
          enter-active-class="transition duration-300"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-200"
          leave-to-class="opacity-0"
        >
          <div
            v-if="errorPassword"
            class="mb-5 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            <span class="text-lg">⚠</span>

            <span>
              {{ errorPassword }}
            </span>
          </div>
        </Transition>

        <!-- FORM -->
        <form class="space-y-5" @submit.prevent="handleChangePassword">
          <!-- MẬT KHẨU CŨ -->
          <div>
            <label class="mb-2 block text-sm font-semibold text-white/90">
              Mật khẩu hiện tại
            </label>

            <div class="relative">
              <input
                v-model="passwordOld"
                type="password"
                placeholder="Nhập mật khẩu đang dùng"
                class="w-full rounded-2xl border border-white/20 bg-black/25 px-4 py-3.5 pr-12 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/50 focus:bg-black/35 focus:ring-4 focus:ring-white/10"
              />
            </div>
          </div>

          <!-- MẬT KHẨU MỚI -->
          <div>
            <label class="mb-2 block text-sm font-semibold text-white/90">
              Mật khẩu mới
            </label>

            <div class="relative">
              <input
                v-model="passwordNew"
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                class="w-full rounded-2xl border border-white/20 bg-black/25 px-4 py-3.5 pr-12 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/50 focus:bg-black/35 focus:ring-4 focus:ring-white/10"
              />
            </div>

            <!-- ĐỘ MẠNH -->
            <div class="mt-3 space-y-1.5">
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-white/60"> Độ mạnh mật khẩu </span>

                <span class="font-bold text-amber-400">
                  {{
                    passwordNew.length >= 8
                      ? "Đạt yêu cầu"
                      : "Tối thiểu 8 ký tự"
                  }}
                </span>
              </div>

              <div
                class="flex h-1.5 gap-1.5 overflow-hidden rounded-full bg-white/10"
              >
                <div
                  class="flex-1 rounded-full"
                  :class="
                    passwordNew.length >= 8 ? 'bg-emerald-500' : 'bg-amber-500'
                  "
                ></div>

                <div
                  class="flex-1 rounded-full"
                  :class="
                    passwordNew.length >= 10
                      ? 'bg-emerald-500'
                      : 'bg-transparent'
                  "
                ></div>

                <div
                  class="flex-1 rounded-full"
                  :class="
                    passwordNew.length >= 12
                      ? 'bg-emerald-500'
                      : 'bg-transparent'
                  "
                ></div>

                <div
                  class="flex-1 rounded-full"
                  :class="
                    passwordNew.length >= 14
                      ? 'bg-emerald-500'
                      : 'bg-transparent'
                  "
                ></div>
              </div>
            </div>
          </div>

          <!-- XÁC NHẬN -->
          <div>
            <label class="mb-2 block text-sm font-semibold text-white/90">
              Xác nhận mật khẩu mới
            </label>

            <div class="relative">
              <input
                v-model="confirmPasswordNew"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                class="w-full rounded-2xl border border-white/20 bg-black/25 px-4 py-3.5 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/50 focus:bg-black/35 focus:ring-4 focus:ring-white/10"
              />
            </div>

            <p
              v-if="confirmPasswordNew && passwordNew !== confirmPasswordNew"
              class="mt-2 text-xs text-red-400"
            >
              Mật khẩu xác nhận không khớp
            </p>

            <p
              v-if="confirmPasswordNew && passwordNew === confirmPasswordNew"
              class="mt-2 text-xs text-emerald-400"
            >
              ✓ Mật khẩu xác nhận chính xác
            </p>
          </div>

          <!-- BUTTON -->
          <div class="flex flex-col gap-3 pt-4 sm:flex-row">
            <!-- SAVE -->
            <button
              type="submit"
              :disabled="isLoading"
              class="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-bold text-slate-900 shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <!-- LOADING -->
              <svg
                v-if="isLoading"
                class="h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />

                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>

              <span>
                {{ isLoading ? "Đang cập nhật..." : "Lưu thay đổi" }}
              </span>
            </button>

            <!-- CANCEL -->
            <RouterLink
              to="/profile"
              class="rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-center text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/20"
            >
              Hủy
            </RouterLink>
          </div>
        </form>

        <!-- SECURITY NOTE -->
        <div class="mt-7 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div class="flex gap-3">
            <div class="text-lg">🔐</div>

            <div>
              <p class="text-xs font-semibold text-white">Bảo mật tài khoản</p>

              <p class="mt-1 text-[11px] leading-5 text-white/50">
                Không chia sẻ mật khẩu của bạn với bất kỳ ai. Hãy sử dụng mật
                khẩu mạnh và khác với các tài khoản khác.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
@keyframes toastProgress {
  from {
    transform: scaleX(1);
  }

  to {
    transform: scaleX(0);
  }
}
</style>
```
