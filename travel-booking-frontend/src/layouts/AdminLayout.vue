<script setup lang="ts">
import AdminFooter from "../components/admin/AdminFooter.vue";
import AdminHeader from "../components/admin/AdminHeader.vue";
import AdminSidebar from "../components/admin/AdminSidebar.vue";
</script>

<
<template>
  <!-- h-screen để khoá khung hình bằng đúng màn hình trình duyệt -->
  <div
    class="flex h-screen overflow-hidden bg-[#070a10] text-white antialiased"
  >
    <!-- Sidebar cố định bên trái -->
    <aside class="w-64 shrink-0 border-r border-slate-800/80 bg-[#0b0f19]">
      <AdminSidebar />
    </aside>

    <!-- Khu vực làm việc bên phải -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- Header cố định trên cùng -->
      <header
        class="shrink-0 border-b border-slate-800/80 bg-[#070a10]/80 backdrop-blur-md"
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
            class="mt-8 pt-4 border-t border-slate-800/60 text-slate-400 text-sm"
          >
            <AdminFooter />
          </footer>
        </div>
      </main>
    </div>
  </div>
</template>
