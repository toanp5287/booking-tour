<script setup>
import { useQuery } from "@tanstack/vue-query";

import { useRoute } from "vue-router";
import userService from "../../../services/users.service";
import { computed } from "vue";
const route = useRoute();
const id = route.params.id;
const { data: userDetail } = useQuery({
  queryKey: ["userDetail", id],
  queryFn: async () => {
    const res = await userService.getDetail(id);
    return res.data.data;
  },
});
const user = computed(() => {
  return userDetail.value;
});

const inactiveUser = async () => {
  const isConfirm = confirm("bạn chắc muốn khoá tài khoản này");
  if (isConfirm) {
    const result = await userService.inactiveUser(id);
    if (result) {
      alert("ngừng tài khoản thành công");
    } else {
      alert("ngừng thất bại");
    }
  }
};
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6 text-slate-200">
    <!-- Topbar -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>

        <div>
          <h1 class="text-xl font-bold text-white">Hồ sơ người dùng</h1>

          <p class="text-xs text-white/40">Mã ID: #USR-{{ user?.id }}</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="inactiveUser"
          type="button"
          class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20"
        >
          Khóa tài khoản
        </button>

        <button
          type="button"
          class="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md transition hover:opacity-90"
        >
          Chỉnh sửa thông tin
        </button>
      </div>
    </div>

    <!-- Tổng quan -->
    <div
      class="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm"
    >
      <div class="flex items-center gap-4">
        <!-- Avatar -->
        <div
          class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-xl font-bold text-slate-900 shadow-lg"
        >
          {{ user?.full_name?.charAt(0)?.toUpperCase() }}
        </div>

        <div>
          <div class="flex flex-wrap items-center gap-3">
            <h2 class="text-lg font-bold text-white">
              {{ user?.full_name }}
            </h2>

            <span
              class="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-0.5 text-xs font-medium text-amber-300"
            >
              {{ user?.role_name }}
            </span>

            <span
              class="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>

              {{ user?.status === "active" ? "Hoạt động" : "Ngừng hoạt động" }}
            </span>
          </div>

          <p class="mt-1 font-mono text-sm text-white/50">
            {{ user?.email }}
          </p>
        </div>
      </div>
    </div>

    <!-- Nội dung -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Thông tin cá nhân -->
      <div class="lg:col-span-2">
        <div class="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
          <h3
            class="mb-5 text-sm font-semibold uppercase tracking-wider text-white/50"
          >
            Thông tin cá nhân
          </h3>

          <dl class="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <!-- Họ tên -->
            <div>
              <dt class="text-xs text-white/40">Họ và tên</dt>

              <dd class="mt-1 text-sm font-medium text-white">
                {{ user?.full_name }}
              </dd>
            </div>

            <!-- Email -->
            <div>
              <dt class="text-xs text-white/40">Email</dt>

              <dd class="mt-1 break-all font-mono text-sm text-amber-300/90">
                {{ user?.email }}
              </dd>
            </div>

            <!-- Số điện thoại -->
            <div>
              <dt class="text-xs text-white/40">Số điện thoại</dt>

              <dd class="mt-1 font-mono text-sm text-white">
                {{ user?.phone || "Chưa cập nhật" }}
              </dd>
            </div>

            <!-- Giới tính -->
            <div>
              <dt class="text-xs text-white/40">Giới tính</dt>

              <dd class="mt-1 text-sm text-white">
                {{
                  user?.gender === "MALE"
                    ? "Nam"
                    : user?.gender === "FEMALE"
                      ? "Nữ"
                      : "Chưa cập nhật"
                }}
              </dd>
            </div>

            <!-- Ngày sinh -->
            <div>
              <dt class="text-xs text-white/40">Ngày sinh</dt>

              <dd class="mt-1 text-sm text-white">
                {{
                  user?.date_of_birth
                    ? new Date(user.date_of_birth).toLocaleDateString("vi-VN")
                    : "Chưa cập nhật"
                }}
              </dd>
            </div>

            <!-- Trạng thái -->
            <div>
              <dt class="text-xs text-white/40">Trạng thái</dt>

              <dd class="mt-1 text-sm font-medium text-emerald-400">
                {{ user?.status }}
              </dd>
            </div>

            <!-- Địa chỉ -->
            <div class="sm:col-span-2">
              <dt class="text-xs text-white/40">Địa chỉ</dt>

              <dd class="mt-1 text-sm text-white/80">
                {{ user?.address || "Chưa cập nhật" }}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Thông tin tài khoản -->
      <div>
        <div
          class="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6"
        >
          <h3
            class="text-sm font-semibold uppercase tracking-wider text-white/50"
          >
            Thông tin tài khoản
          </h3>

          <div class="divide-y divide-white/[0.05] text-xs">
            <!-- ID -->
            <div class="flex items-center justify-between pb-3">
              <span class="text-white/40"> User ID </span>

              <span class="font-mono text-white/80">
                {{ user?.id }}
              </span>
            </div>

            <!-- Role ID -->
            <div class="flex items-center justify-between py-3">
              <span class="text-white/40"> Role ID </span>

              <span class="font-mono text-white/80">
                {{ user?.role_id }}
              </span>
            </div>

            <!-- Role -->
            <div class="flex items-center justify-between py-3">
              <span class="text-white/40"> Vai trò </span>

              <span class="font-medium text-amber-300">
                {{ user?.role_name }}
              </span>
            </div>

            <!-- Mô tả role -->
            <div class="pt-3">
              <span class="block text-white/40"> Mô tả vai trò </span>

              <p class="mt-2 leading-relaxed text-white/70">
                {{ user?.role_description || "Không có mô tả" }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Thời gian -->
    <div class="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
      <h3
        class="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50"
      >
        Thông tin hệ thống
      </h3>

      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <p class="text-xs text-white/40">Ngày tạo tài khoản</p>

          <p class="mt-1 text-sm text-white">
            {{
              user?.created_at
                ? new Date(user.created_at).toLocaleString("vi-VN")
                : "Chưa có"
            }}
          </p>
        </div>

        <div>
          <p class="text-xs text-white/40">Cập nhật lần cuối</p>

          <p class="mt-1 text-sm text-white">
            {{
              user?.updated_at
                ? new Date(user.updated_at).toLocaleString("vi-VN")
                : "Chưa có"
            }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
