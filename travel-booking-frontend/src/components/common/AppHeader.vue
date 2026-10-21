<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter, RouterLink } from "vue-router";
import {
  ShieldCheck,
  BriefcaseBusiness,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
  Compass,
  Sparkles,
} from "lucide-vue-next";
import { getCurrentUser, logOut } from "../../stores/auth";

const router = useRouter();
const user = ref(JSON.parse(localStorage.getItem("user") || "null"));
const isMenuOpen = ref(false);
const isMobileNavOpen = ref(false);
const dropdownRef = ref(null);

onMounted(async () => {
  const userData = await getCurrentUser();
  if (userData) {
    user.value = userData;
    localStorage.setItem("user", JSON.stringify(userData));
  } else {
    logOut();
    user.value = null;
  }
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

const handleClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isMenuOpen.value = false;
  }
};

const handleLogout = () => {
  isMenuOpen.value = false;
  isMobileNavOpen.value = false;
  logOut();
  user.value = null;
  router.push("/");
};

const isStaffOrAdmin = () => {
  const role = user.value?.role_name?.toUpperCase();
  return role === "ADMIN" || role === "STAFF";
};

const isOperator = () => {
  const role = user.value?.role_name?.toUpperCase();
  return (
    role === "TOUR_GUIDE" ||
    role === "TOUR_OPERATOR_OWNER" ||
    role === "OPERATOR"
  );
};
</script>

<template>
  <header
    class="site-header fixed left-0 right-0 top-0 z-50 transition-all duration-300"
  >
    <div class="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
      <div
        class="mt-4 flex h-[68px] items-center justify-between rounded-2xl border border-white/[0.08] bg-[#07090d]/80 px-4 shadow-[0_16px_36px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition hover:border-white/[0.14] sm:px-6"
      >
        <!-- ================= LOGO ================= -->
        <RouterLink to="/" class="group flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-700 shadow-md shadow-blue-500/10 transition-transform duration-300 group-hover:scale-105"
          >
            <Compass
              class="h-5 w-5 stroke-[2] transition-transform duration-500 group-hover:rotate-45"
            />
          </div>

          <div>
            <div class="text-lg font-black tracking-tight text-white">
              Travel<span class="text-blue-600">Go</span>
            </div>
            <div
              class="text-[8px] font-bold uppercase tracking-[0.3em] text-blue-600/70"
            >
              Sunset Horizon
            </div>
          </div>
        </RouterLink>

        <!-- ================= NAVIGATION LINKS ================= -->
        <nav class="hidden items-center gap-1 lg:flex">
          <RouterLink
            to="/"
            class="rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
            exact-active-class="!bg-blue-50 !text-blue-800 !border-blue-200 border"
          >
            Trang chủ
          </RouterLink>

          <RouterLink
            to="/tours"
            class="rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
            active-class="!bg-blue-50 !text-blue-800 !border-blue-200 border"
          >
            Tours
          </RouterLink>

          <RouterLink
            to="/destinations"
            class="rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
            active-class="!bg-blue-50 !text-blue-800 !border-blue-200 border"
          >
            Điểm đến
          </RouterLink>

          <RouterLink
            to="/community"
            class="rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
            active-class="!bg-blue-50 !text-blue-800 !border-blue-200 border"
          >
            Cộng đồng
          </RouterLink>

          <RouterLink
            to="/aboutUs"
            class="rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
            active-class="!bg-blue-50 !text-blue-800 !border-blue-200 border"
          >
            Về chúng tôi
          </RouterLink>

          <!-- AI TRIP BADGE LINK -->
          <RouterLink
            to="/aiTripPlanner"
            class="ml-1.5 flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-100 hover:border-blue-300"
            active-class="!bg-blue-100 !text-blue-800 !border-blue-200"
          >
            <Sparkles class="h-3.5 w-3.5 fill-blue-600 text-blue-600" />
            <span>Lập lịch AI</span>
          </RouterLink>
        </nav>

        <!-- ================= USER ACTIONS ================= -->
        <div class="flex items-center gap-3">
          <!-- PORTAL BUTTON NHANH NẾU LÀ ADMIN / NHÀ TOUR -->
          <RouterLink
            v-if="user && isStaffOrAdmin()"
            to="/admin"
            class="hidden items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 md:flex"
          >
            <ShieldCheck class="h-4 w-4" />
            <span>Quản trị</span>
          </RouterLink>

          <RouterLink
            v-else-if="user && isOperator()"
            to="/tour-manager"
            class="hidden items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 md:flex"
          >
            <BriefcaseBusiness class="h-4 w-4" />
            <span>Cổng nhà tour</span>
          </RouterLink>

          <!-- DROPDOWN TÀI KHOẢN (ĐÃ ĐĂNG NHẬP) -->
          <div v-if="user" ref="dropdownRef" class="relative">
            <button
              type="button"
              @click="isMenuOpen = !isMenuOpen"
              class="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] p-1.5 pr-3 text-xs font-medium text-white transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              <div
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 font-bold text-white"
              >
                {{
                  user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"
                }}
              </div>
              <span
                class="max-w-[120px] truncate text-slate-200 sm:max-w-[150px]"
              >
                {{ user.full_name || "Tài khoản" }}
              </span>
              <ChevronDown
                class="h-3.5 w-3.5 text-slate-400 transition-transform duration-200"
                :class="{ 'rotate-180': isMenuOpen }"
              />
            </button>

            <!-- MENU DROPDOWN LIST -->
            <Transition name="fade-drop">
              <div
                v-if="isMenuOpen"
                class="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-slate-200"
              >
                <div class="border-b border-slate-100 px-3 py-2.5">
                  <p class="text-[11px] font-medium text-slate-500">
                    Đăng nhập với vai trò
                  </p>
                  <p
                    class="mt-0.5 truncate text-xs font-bold text-blue-700 uppercase font-mono"
                  >
                    {{ user.role_name || "Khách hàng" }}
                  </p>
                </div>

                <div class="space-y-1 py-1.5 text-xs">
                  <RouterLink
                    to="/profile"
                    @click="isMenuOpen = false"
                    class="flex items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-blue-50 hover:text-blue-800"
                  >
                    <User class="h-4 w-4 text-slate-500" />
                    <span>Hồ sơ cá nhân</span>
                  </RouterLink>
                  <RouterLink
                    to="/userExample"
                    @click="isMenuOpen = false"
                    class="flex items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-blue-50 hover:text-blue-800"
                  >
                    <User class="h-4 w-4 text-slate-500" />
                    <span>Ví người dùng</span>
                  </RouterLink>
                  <RouterLink
                    to="/myBooking"
                    @click="isMenuOpen = false"
                    class="flex items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-blue-50 hover:text-blue-800"
                  >
                    <User class="h-4 w-4 text-slate-500" />
                    <span>Chuyến đi</span>
                  </RouterLink>

                  <RouterLink
                    to="/myGroupRequests"
                    @click="isMenuOpen = false"
                    class="flex items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-blue-50 hover:text-blue-800"
                  >
                    <User class="h-4 w-4 text-slate-500" />
                    <span>Yêu cầu tour đoàn</span>
                  </RouterLink>

                  <RouterLink
                    v-if="isStaffOrAdmin()"
                    to="/admin"
                    @click="isMenuOpen = false"
                    class="flex items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-blue-50 hover:text-blue-800"
                  >
                    <ShieldCheck class="h-4 w-4 text-blue-600" />
                    <span>Trang quản trị (Admin)</span>
                  </RouterLink>

                  <RouterLink
                    v-if="isOperator()"
                    to="/admin"
                    @click="isMenuOpen = false"
                    class="flex items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-blue-50 hover:text-blue-800"
                  >
                    <BriefcaseBusiness class="h-4 w-4 text-blue-600" />
                    <span>Quản lý tour cung cấp</span>
                  </RouterLink>
                </div>

                <div class="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    @click="handleLogout"
                    class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10"
                  >
                    <LogOut class="h-4 w-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <!-- CHƯA ĐĂNG NHẬP -->
          <div v-else class="flex items-center gap-2">
            <RouterLink
              to="/login"
              class="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
            >
              Đăng nhập
            </RouterLink>

            <RouterLink
              to="/register"
              class="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
            >
              Đăng ký
            </RouterLink>
          </div>

          <!-- HAMBURGER MENU (MOBILE) -->
          <button
            type="button"
            @click="isMobileNavOpen = !isMobileNavOpen"
            class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 lg:hidden hover:text-white"
          >
            <X v-if="isMobileNavOpen" class="h-5 w-5" />
            <Menu v-else class="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- ================= MOBILE NAVIGATION DRAWER ================= -->
    <Transition name="slide-down">
      <div
        v-if="isMobileNavOpen"
        class="mx-4 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-lg lg:hidden"
      >
        <nav class="flex flex-col gap-2 text-sm">
          <RouterLink
            to="/"
            @click="isMobileNavOpen = false"
            class="rounded-xl px-4 py-2.5 text-slate-700 hover:bg-blue-50"
            exact-active-class="bg-blue-50 text-blue-800 font-bold"
          >
            Trang chủ
          </RouterLink>
          <RouterLink
            to="/tours"
            @click="isMobileNavOpen = false"
            class="rounded-xl px-4 py-2.5 text-slate-700 hover:bg-blue-50"
            active-class="bg-blue-50 text-blue-800 font-bold"
          >
            Tours du lịch
          </RouterLink>
          <RouterLink
            to="/destinations"
            @click="isMobileNavOpen = false"
            class="rounded-xl px-4 py-2.5 text-slate-700 hover:bg-blue-50"
            active-class="bg-blue-50 text-blue-800 font-bold"
          >
            Điểm đến
          </RouterLink>
          <RouterLink
            to="/community"
            @click="isMobileNavOpen = false"
            class="rounded-xl px-4 py-2.5 text-slate-700 hover:bg-blue-50"
            active-class="bg-blue-50 text-blue-800 font-bold"
          >
            Cộng đồng
          </RouterLink>
          <RouterLink
            to="/aiTripPlanner"
            @click="isMobileNavOpen = false"
            class="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 font-bold text-blue-800"
          >
            <Sparkles class="h-4 w-4" />
            <span>TravelGo AI Lập lịch</span>
          </RouterLink>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.fade-drop-enter-active,
.fade-drop-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-drop-enter-from,
.fade-drop-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease-out;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
