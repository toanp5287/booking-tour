<script setup>
import { ref, computed } from "vue";
import { RouterLink } from "vue-router";

const userData = localStorage.getItem("user");
const user = ref(userData ? JSON.parse(userData) : null);

// 1. Phân loại vai trò chi tiết
const isAdminOrStaff = computed(() => {
  const role = user.value?.role_name;
  return role === "ADMIN" || role === "STAFF";
});

const isOperator = computed(() => {
  return user.value?.role_name === "TOUR_OPERATOR_OWNER";
});

// Cả 2 nhóm đều có quyền truy cập (Admin/Staff hoặc Chủ tour)
const canAccessOperations = computed(() => {
  return isAdminOrStaff.value || isOperator.value;
});
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-50 hidden w-[265px] border-r border-white/[0.08] bg-[#090c11]/90 backdrop-blur-2xl lg:flex lg:flex-col"
  >
    <!-- LOGO -->
    <div class="flex h-[82px] items-center border-b border-white/[0.07] px-6">
      <RouterLink to="/" class="flex items-center gap-3">
        <div
          class="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.07]"
        >
          <svg
            class="h-5 w-5 text-white"
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

        <div>
          <div class="text-lg font-bold text-white">
            Travel<span class="text-white/40">Go</span>
          </div>
          <div
            class="text-[9px] uppercase tracking-[0.25em] text-orange-300/60"
          >
            {{ isAdminOrStaff ? "Administration" : "Operator Portal" }}
          </div>
        </div>
      </RouterLink>
    </div>

    <!-- NAVIGATION -->
    <nav class="flex-1 overflow-y-auto px-4 py-6">
      <!-- 1. TỔNG QUAN -->
      <p
        class="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/25"
      >
        Tổng quan
      </p>

      <RouterLink
        to="/admin"
        exact
        class="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/45 transition hover:bg-white/5 hover:text-white"
        exact-active-class="!border !border-orange-300/10 !bg-orange-300/[0.07] !font-semibold !text-orange-200"
      >
        <span>▦</span>
        Dashboard
      </RouterLink>

      <!-- 2. QUẢN LÝ TOUR & DỊCH VỤ (CẢ HAI NHÓM ĐỀU CẦN) -->
      <template v-if="canAccessOperations">
        <p
          class="mb-3 mt-7 px-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/25"
        >
          Vận hành Tour
        </p>

        <!-- Quản lý Tour -->
        <RouterLink
          to="/admin/tours"
          class="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/45 transition hover:bg-white/5 hover:text-white"
          active-class="!border !border-orange-300/10 !bg-orange-300/[0.07] !font-semibold !text-orange-200"
        >
          <span>◈</span>
          {{ isOperator ? "Tour của tôi" : "Tất cả Tours" }}
        </RouterLink>

        <!-- Lịch trình khởi hành -->
        <RouterLink
          to="/admin/itineraries"
          class="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/45 transition hover:bg-white/5 hover:text-white"
          active-class="!border !border-orange-300/10 !bg-orange-300/[0.07] !font-semibold !text-orange-200"
        >
          <span>☷</span>
          Lịch trình
        </RouterLink>

        <!-- Đặt tour / Booking -->
        <RouterLink
          to="/admin/bookingList"
          class="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/45 transition hover:bg-white/5 hover:text-white"
          active-class="!border !border-orange-300/10 !bg-orange-300/[0.07] !font-semibold !text-orange-200"
        >
          <span>▣</span>
          Đơn đặt tour
        </RouterLink>

        <!-- Điểm đến: Chỉ Admin/Staff quản lý danh mục dùng chung -->
        <RouterLink
          v-if="isAdminOrStaff"
          to="/admin/destinations"
          class="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/45 transition hover:bg-white/5 hover:text-white"
          active-class="!border !border-orange-300/10 !bg-orange-300/[0.07] !font-semibold !text-orange-200"
        >
          <span>⌖</span>
          Điểm đến
        </RouterLink>
      </template>

      <!-- 3. TƯƠNG TÁC & PHẢN HỒI -->
      <template v-if="canAccessOperations">
        <p
          class="mb-3 mt-7 px-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/25"
        >
          Tương tác khách hàng
        </p>

        <!-- Đánh giá: Nhà tour xem đánh giá dịch vụ mình, Admin xem toàn sàn -->
        <RouterLink
          to="/admin/reviews"
          class="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/45 transition hover:bg-white/5 hover:text-white"
          active-class="!border !border-orange-300/10 !bg-orange-300/[0.07] !font-semibold !text-orange-200"
        >
          <span>☆</span>
          Đánh giá
        </RouterLink>

        <!-- Bài viết & Báo cáo: Chỉ Admin/Staff kiểm duyệt cộng đồng -->
        <template v-if="isAdminOrStaff">
          <RouterLink
            to="/admin/posts"
            class="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/45 transition hover:bg-white/5 hover:text-white"
            active-class="!border !border-orange-300/10 !bg-orange-300/[0.07] !font-semibold !text-orange-200"
          >
            <span>▤</span>
            Bài viết
          </RouterLink>

          <RouterLink
            to="/admin/reports"
            class="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/45 transition hover:bg-white/5 hover:text-white"
            active-class="!border !border-orange-300/10 !bg-orange-300/[0.07] !font-semibold !text-orange-200"
          >
            <span>⚑</span>
            Báo cáo vi phạm
          </RouterLink>
        </template>
      </template>

      <!-- 4. QUẢN LÝ TÀI KHOẢN (CHỈ DÀNH CHO ADMIN & STAFF) -->
      <template v-if="isAdminOrStaff">
        <p
          class="mb-3 mt-7 px-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/25"
        >
          Tài khoản & Phân quyền
        </p>

        <RouterLink
          to="/admin/users"
          class="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/45 transition hover:bg-white/5 hover:text-white"
          active-class="!border !border-orange-300/10 !bg-orange-300/[0.07] !font-semibold !text-orange-200"
        >
          <span>♙</span>
          Người dùng
        </RouterLink>

        <RouterLink
          to="/admin/roles"
          class="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/45 transition hover:bg-white/5 hover:text-white"
          active-class="!border !border-orange-300/10 !bg-orange-300/[0.07] !font-semibold !text-orange-200"
        >
          <span>♜</span>
          Vai trò & quyền
        </RouterLink>
      </template>

      <!-- 5. CẤU HÌNH HỆ THỐNG (CHỈ DÀNH CHO ADMIN & STAFF) -->
      <template v-if="isAdminOrStaff">
        <p
          class="mb-3 mt-7 px-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/25"
        >
          Hệ thống
        </p>

        <RouterLink
          to="/admin/vouchers"
          class="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/45 transition hover:bg-white/5 hover:text-white"
          active-class="!border !border-orange-300/10 !bg-orange-300/[0.07] !font-semibold !text-orange-200"
        >
          <span>◇</span>
          Voucher sàn
        </RouterLink>

        <RouterLink
          to="/admin/ai-management"
          class="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/45 transition hover:bg-white/5 hover:text-white"
          active-class="!border !border-orange-300/10 !bg-orange-300/[0.07] !font-semibold !text-orange-200"
        >
          <span>✦</span>
          TravelGo AI
        </RouterLink>
      </template>
    </nav>

    <!-- ADMIN FOOTER PROFILE -->
    <div class="border-t border-white/[0.07] p-4">
      <RouterLink
        to="/profile"
        class="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-white/5"
      >
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-300 font-bold text-slate-900"
        >
          {{ user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U" }}
        </div>

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-white">
            {{ user?.full_name || "Thành viên" }}
          </p>
          <p class="text-[11px] text-white/35">
            {{ user?.role_name || "Guest" }}
          </p>
        </div>

        <span class="text-white/30">⋮</span>
      </RouterLink>
    </div>
  </aside>
</template>
