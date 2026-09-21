<script setup>
import { ref, computed } from "vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import rolesService from "../../../services/roles.service";
import permissionsService from "../../../services/permissions.service";
import Swal from "sweetalert2";

const queryClient = useQueryClient();

const { data: dataRolePermissions, isLoading: isLoadingRolePermissions } =
  useQuery({
    queryKey: ["rolesPermissions"],
    queryFn: async () => {
      const res = await rolesService.viewPermissionsRole();
      return res.data?.data || res.data || [];
    },
  });

const { data: dataRoles } = useQuery({
  queryKey: ["rolesAll"],
  queryFn: async () => {
    const res = await rolesService.getAll();
    return res.data?.data || res.data || [];
  },
});

// 3. Lấy danh sách nhóm quyền
const { data: permissionsData } = useQuery({
  queryKey: ["permissionsAll"],
  queryFn: async () => {
    const res = await permissionsService.getAll();
    return res.data?.data || res.data || [];
  },
});

const roles = computed(() => dataRoles.value || []);
const permissions = computed(() => permissionsData.value || []);

const permissionChanges = ref({});

const hasPermission = (role, permission) => {
  return dataRolePermissions.value?.some(
    (item) =>
      String(item.role_id) === String(role.id) &&
      String(item.permission_id) === String(permission.id),
  );
};

const togglePermission = (role, permission, event) => {
  const key = `${role.id}-${permission.id}`;
  permissionChanges.value[key] = event.target.checked;
};

const getChecked = (role, permission) => {
  const key = `${role.id}-${permission.id}`;
  if (key in permissionChanges.value) {
    return permissionChanges.value[key];
  }
  return hasPermission(role, permission);
};

const resetChanges = () => {
  permissionChanges.value = {};
};

const submitRolePermission = async () => {
  const payload = Object.entries(permissionChanges.value).map(
    ([key, checked]) => {
      const [role_id, permission_id] = key.split("-");
      return {
        role_id,
        permission_id,
        checked,
      };
    },
  );

  if (payload.length === 0) {
    await Swal.fire({
      title: "Không có thay đổi",
      text: "Bạn chưa thay đổi quyền nào.",
      icon: "info",
      confirmButtonText: "Đã hiểu",
    });
    return;
  }

  const isConfirm = await Swal.fire({
    title: "Xác nhận thay đổi?",
    text: "Bạn có chắc muốn cập nhật phân quyền không?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Cập nhật",
    cancelButtonText: "Hủy",
    reverseButtons: true,
  });

  if (!isConfirm.isConfirmed) return;

  try {
    const result = await rolesService.permissions(payload);

    if (!result.data?.success) {
      await Swal.fire({
        title: "Cập nhật thất bại!",
        text: result.data?.message || "Không thể cập nhật phân quyền.",
        icon: "error",
        confirmButtonText: "Đóng",
      });
      return;
    }

    permissionChanges.value = {};

    await queryClient.invalidateQueries({ queryKey: ["rolesPermissions"] });

    await Swal.fire({
      title: "Thành công!",
      text: result.data?.message || "Cập nhật phân quyền thành công.",
      icon: "success",
      confirmButtonText: "OK",
    });
  } catch (error) {
    console.error("Lỗi cập nhật phân quyền:", error);
    await Swal.fire({
      title: "Có lỗi xảy ra!",
      text:
        error.response?.data?.message ||
        error.message ||
        "Không thể kết nối đến máy chủ.",
      icon: "error",
      confirmButtonText: "Đóng",
    });
  }
};
</script>

<template>
  <div class="space-y-6 text-slate-200">
    <!-- Topbar: Tiêu đề & Hành động -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="h-2 w-2 rounded-full bg-amber-400"></span>
          <h1 class="text-xl font-bold text-white">
            Quản lý Vai trò & Phân quyền
          </h1>
        </div>
        <p class="mt-1 text-xs text-white/40">
          Thiết lập đặc quyền truy cập và ma trận quyền hạn cho từng nhóm người
          dùng
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="resetChanges"
          type="button"
          class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          Đặt lại mặc định
        </button>
        <button
          @click="submitRolePermission"
          type="button"
          class="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md transition hover:opacity-90"
        >
          Lưu thay đổi
        </button>
      </div>
    </div>

    <!-- Danh sách thẻ vai trò (Roles Grid) -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="value in roles"
        :key="value.id || value.name"
        class="rounded-2xl border border-amber-400/30 bg-amber-400/[0.03] p-5 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <span
            class="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-0.5 text-xs font-bold text-amber-300"
          >
            {{ value.name }}
          </span>
          <span class="text-xs text-white/40">3 tài khoản</span>
        </div>
        <h3 class="mt-3 text-sm font-semibold text-white">
          {{
            value.name == "ADMIN"
              ? "Quản trị viên"
              : value.name == "STAFF"
                ? "Nhân viên"
                : value.name == "TOUR_GUIDE"
                  ? "Người dẫn tour"
                  : "Người dùng"
          }}
        </h3>
        <p class="mt-1 line-clamp-2 text-xs text-white/40">
          {{ value.description }}
        </p>
      </div>

      <!-- Nút thêm vai trò -->
      <button
        type="button"
        class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.01] p-5 text-center transition hover:border-amber-400/50 hover:bg-white/[0.02]"
      >
        <div
          class="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
        <span class="mt-2 text-xs font-medium text-white/70">
          Thêm vai trò mới
        </span>
      </button>
    </div>

    <!-- Ma trận phân quyền (Permission Matrix Table) -->
    <div
      class="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm"
    >
      <div
        class="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] px-6 py-4"
      >
        <div>
          <h2 class="text-base font-semibold text-white">
            Ma trận cấp quyền chi tiết
          </h2>
          <p class="text-xs text-white/40">
            Tích chọn các ô để gán hành động cho từng nhóm người dùng
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-white/40">Tổng quyền hệ thống:</span>
          <span
            class="rounded-lg border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-300"
          >
            {{
              permissions.reduce(
                (total, cur) => total + (cur.permissions?.length || 0),
                0,
              )
            }}
            quyền
          </span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[850px] text-left">
          <thead>
            <tr
              class="border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-wider text-white/40"
            >
              <th class="w-1/3 px-6 py-4">Phân hệ & Hành động</th>
              <th
                v-for="role in roles"
                :key="role.id || role.name"
                class="px-4 py-4 text-center"
              >
                {{ role.name }}
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-white/[0.05] text-sm">
            <template v-for="groupItem in permissions" :key="groupItem.group">
              <!-- Dòng tên nhóm phân hệ -->
              <tr class="bg-white/[0.02]">
                <td
                  :colspan="roles.length + 1"
                  class="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-300/80"
                >
                  {{ groupItem.group }}
                </td>
              </tr>

              <!-- Các quyền thuộc nhóm -->
              <tr
                v-for="perm in groupItem.permissions"
                :key="perm.id"
                class="transition hover:bg-white/[0.02]"
              >
                <td class="px-6 py-3.5">
                  <p class="font-medium text-white/90">
                    {{ perm.description }}
                  </p>
                  <p class="text-xs font-mono text-white/40">
                    {{ perm.name }}
                  </p>
                </td>
                <td
                  v-for="role in roles"
                  :key="role.id || role.name"
                  class="px-4 py-3.5 text-center"
                >
                  <input
                    :checked="getChecked(role, perm)"
                    @change="togglePermission(role, perm, $event)"
                    type="checkbox"
                    class="h-4 w-4 cursor-pointer rounded border-white/20 bg-white/5 accent-amber-400"
                  />
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Footer lưu -->
      <div
        class="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.01] px-6 py-4"
      >
        <span class="text-xs text-white/40">
          Lưu ý: Quản trị viên (ADMIN) mặc định luôn giữ toàn quyền hệ thống.
        </span>
        <button
          @click="submitRolePermission"
          type="button"
          class="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md transition hover:opacity-90"
        >
          Cập nhật thay đổi
        </button>
      </div>
    </div>
  </div>
</template>
