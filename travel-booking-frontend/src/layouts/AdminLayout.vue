<script setup lang="ts">
import AdminFooter from "../components/admin/AdminFooter.vue";
import AdminHeader from "../components/admin/AdminHeader.vue";
import AdminSidebar from "../components/admin/AdminSidebar.vue";
</script>

<template>
  <!-- h-screen để khoá khung hình bằng đúng màn hình trình duyệt -->
  <div class="admin-layout flex h-screen overflow-hidden antialiased">
    <!-- Sidebar cố định bên trái -->
    <aside class="hidden w-[265px] shrink-0 border-r lg:block">
      <AdminSidebar />
    </aside>

    <!-- Khu vực làm việc bên phải -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- Header cố định trên cùng -->
      <header
        class="admin-header-frame shrink-0 border-b"
      >
        <AdminHeader />
      </header>

      <!-- Vùng cuộn chính chứa cả RouterView lẫn Footer -->
      <main class="flex-1 overflow-y-auto">
        <div
          class="mx-auto flex min-h-full max-w-7xl flex-col justify-between p-6"
        >
          <!-- Nội dung view -->
          <div class="flex-1">
            <RouterView />
          </div>

          <!-- Footer ở đáy trang -->
          <footer
            class="mt-8 border-t border-slate-200 pt-4 text-sm text-slate-500"
          >
            <AdminFooter />
          </footer>
        </div>
      </main>
    </div>
  </div>
</template>
