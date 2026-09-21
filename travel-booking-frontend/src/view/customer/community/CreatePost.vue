<script setup>
import { ref } from "vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { useRouter } from "vue-router";
import tourService from "../../../services/tour.service";
import communityService from "../../../services/community.service";

const router = useRouter();

const queryClient = useQueryClient();

const form = ref({
  content: "",
  image: null,
  hashtags: [],
  location: "",
  tour_id: null,
});

const imagePreview = ref(null);
const hashtagInput = ref("");
const isSubmitting = ref(false);

const toast = ref({
  show: false,
  message: "",
  type: "success",
});

const showToast = (message, type = "success") => {
  toast.value = { show: true, message, type };
  setTimeout(() => {
    toast.value.show = false;
  }, 3500);
};

const handleImage = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast("Dung lượng ảnh tối đa là 5MB", "warning");
    event.target.value = "";
    return;
  }

  form.value.image = file;
  imagePreview.value = URL.createObjectURL(file);
};

const removeImage = () => {
  form.value.image = null;
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value);
    imagePreview.value = null;
  }
};

const toggleHashtag = (tag) => {
  const cleanTag = tag.startsWith("#") ? tag : `#${tag}`;
  const index = form.value.hashtags.indexOf(cleanTag);

  if (index !== -1) {
    form.value.hashtags.splice(index, 1);
  } else {
    form.value.hashtags.push(cleanTag);
  }
};

const handleCustomHashtag = () => {
  const val = hashtagInput.value.trim().replace(/\s+/g, "");
  if (!val) return;

  const tag = val.startsWith("#") ? val : `#${val}`;
  if (!form.value.hashtags.includes(tag)) {
    form.value.hashtags.push(tag);
  }
  hashtagInput.value = "";
};

const { data: dataTour } = useQuery({
  queryKey: ["tours"],
  queryFn: async () => {
    const response = await tourService.getAll();
    return response.data.data || [];
  },
});

const create = async () => {
  if (!form.value.content.trim()) {
    showToast("Vui lòng nhập nội dung bài viết", "warning");
    return;
  }

  try {
    isSubmitting.value = true;
    const formData = new FormData();

    formData.append("content", form.value.content.trim());
    formData.append("location", form.value.location || "");

    if (form.value.tour_id) {
      formData.append("tour_id", form.value.tour_id);
    }

    form.value.hashtags.forEach((item) => {
      formData.append("hashtags", item);
    });

    if (form.value.image) {
      formData.append("image", form.value.image);
    }

    const result = await communityService.createPost(formData);

    if (result) {
      showToast("Đăng bài viết thành công!", "success");
      setTimeout(() => {
        router.push("/community");
      }, 1200);
      queryClient.invalidateQueries({ queryKey: ["communityData"] });
    }
  } catch (error) {
    console.error("Lỗi đăng bài:", error);
    showToast(
      error.response?.data?.message || "Đăng bài thất bại, vui lòng thử lại",
      "error",
    );
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="relative min-h-screen pt-20 pb-16 text-white">
    <!-- UI TOAST NOTIFICATION CONTAINER -->
    <transition
      enter-active-class="transform transition ease-out duration-300"
      enter-from-class="translate-y-[-20px] opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="toast.show"
        class="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl backdrop-blur-xl text-sm font-medium"
        :class="{
          'border-emerald-500/30 bg-emerald-950/80 text-emerald-200':
            toast.type === 'success',
          'border-rose-500/30 bg-rose-950/80 text-rose-200':
            toast.type === 'error',
          'border-amber-500/30 bg-amber-950/80 text-amber-200':
            toast.type === 'warning',
        }"
      >
        <span v-if="toast.type === 'success'">✓</span>
        <span v-else-if="toast.type === 'error'">✕</span>
        <span v-else>⚠</span>
        <span>{{ toast.message }}</span>
      </div>
    </transition>

    <!-- Background -->
    <div class="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <img
        src="/hero-bg.jpg"
        alt="Travel background"
        class="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div class="absolute inset-0 bg-black/60"></div>
      <div
        class="absolute inset-0 bg-gradient-to-br from-black/50 via-transparent to-[#080b12]/90"
      ></div>
      <div
        class="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-[#080b12] via-[#080b12]/70 to-transparent"
      ></div>
    </div>

    <!-- Main -->
    <main class="relative z-10 mx-auto max-w-4xl px-5 sm:px-8">
      <!-- Breadcrumb -->
      <div
        class="mb-6 flex items-center gap-2 text-xs font-semibold text-white/60"
      >
        <RouterLink to="/" class="transition hover:text-white"
          >Trang chủ</RouterLink
        >
        <span class="text-white/30">/</span>
        <RouterLink to="/community" class="transition hover:text-white"
          >Cộng đồng</RouterLink
        >
        <span class="text-white/30">/</span>
        <span class="text-white">Tạo bài viết</span>
      </div>

      <!-- Card -->
      <section
        class="overflow-hidden rounded-[2.5rem] border border-white/15 bg-[#080b12]/75 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-9"
      >
        <div class="mb-8">
          <div
            class="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300"
          >
            <span>✦</span> Community
          </div>
          <h1
            class="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          >
            Chia sẻ chuyến đi của bạn
          </h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            Chia sẻ trải nghiệm, hình ảnh và những địa điểm thú vị của bạn với
            cộng đồng du lịch.
          </p>
        </div>

        <form class="space-y-7" @submit.prevent="create">
          <!-- CONTENT -->
          <div>
            <div class="mb-2 flex items-center justify-between">
              <label class="text-sm font-semibold text-white/90"
                >Nội dung bài viết</label
              >
              <span class="text-xs text-white/40">Bắt buộc</span>
            </div>
            <textarea
              v-model="form.content"
              rows="6"
              placeholder="Bạn đang nghĩ gì? Hãy chia sẻ về chuyến đi, địa điểm, món ăn hoặc trải nghiệm của bạn..."
              class="w-full resize-none rounded-2xl border border-white/15 bg-black/30 p-5 text-sm leading-7 text-white placeholder-white/35 outline-none transition focus:border-orange-300/50 focus:bg-black/40 focus:ring-4 focus:ring-orange-300/10"
            ></textarea>
          </div>

          <!-- LOCATION + TOUR -->
          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-semibold text-white/90"
                >Địa điểm</label
              >
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-base"
                  >📍</span
                >
                <input
                  v-model="form.location"
                  type="text"
                  placeholder="Hà Giang, Đà Nẵng..."
                  class="w-full rounded-2xl border border-white/15 bg-black/30 py-3.5 pl-11 pr-4 text-sm text-white placeholder-white/35 outline-none transition focus:border-orange-300/50 focus:bg-black/40"
                />
              </div>
            </div>

            <div>
              <label class="mb-2 block text-sm font-semibold text-white/90"
                >Gắn tour đã trải nghiệm</label
              >
              <select
                v-model="form.tour_id"
                class="w-full rounded-2xl border border-white/15 bg-[#111722] px-4 py-3.5 text-sm text-white outline-none transition focus:border-orange-300/50"
              >
                <option :value="null" class="text-white/50">
                  -- Không gắn tour --
                </option>
                <option
                  v-for="value in dataTour"
                  :key="value.id"
                  :value="value.id"
                >
                  {{ value.name }}
                </option>
              </select>
              <p class="mt-2 text-[11px] text-white/40">Không bắt buộc</p>
            </div>
          </div>

          <!-- IMAGE UPLOAD & PREVIEW -->
          <div>
            <div class="mb-2 flex items-center justify-between">
              <label class="text-sm font-semibold text-white/90"
                >Hình ảnh</label
              >
              <span class="text-xs text-white/40">Tối đa 5MB</span>
            </div>

            <!-- Khung Preview nếu đã chọn ảnh -->
            <div
              v-if="imagePreview"
              class="relative rounded-2xl border border-white/15 bg-black/40 p-3 overflow-hidden"
            >
              <img
                :src="imagePreview"
                alt="Preview"
                class="h-64 w-full object-cover rounded-xl"
              />
              <button
                type="button"
                @click="removeImage"
                class="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-rose-600 transition"
              >
                ✕
              </button>
            </div>

            <!-- Khung Drop file nếu chưa chọn ảnh -->
            <label
              v-else
              class="block cursor-pointer rounded-2xl border-2 border-dashed border-white/15 bg-black/20 p-8 text-center transition hover:border-orange-300/40 hover:bg-black/30"
            >
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                class="hidden"
                @change="handleImage"
              />
              <div
                class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl"
              >
                📷
              </div>
              <p class="text-sm font-semibold text-white">
                Tải ảnh chuyến đi lên
              </p>
              <p class="mt-1 text-xs text-white/45">
                Hỗ trợ PNG, JPG, WEBP (Tối đa 5MB)
              </p>
            </label>
          </div>

          <!-- HASHTAGS -->
          <div>
            <label class="mb-2 block text-sm font-semibold text-white/90"
              >Hashtags</label
            >
            <div class="rounded-2xl border border-white/15 bg-black/20 p-3">
              <!-- Render các tag đã chọn -->
              <div
                class="flex flex-wrap gap-2 mb-2"
                v-if="form.hashtags.length"
              >
                <span
                  v-for="(tag, idx) in form.hashtags"
                  :key="idx"
                  class="inline-flex items-center gap-1.5 rounded-lg bg-orange-400/15 border border-orange-400/30 px-2.5 py-1 text-xs text-orange-200"
                >
                  {{ tag }}
                  <button
                    type="button"
                    @click="toggleHashtag(tag)"
                    class="text-orange-200/70 hover:text-white"
                  >
                    ✕
                  </button>
                </span>
              </div>

              <input
                v-model="hashtagInput"
                @keydown.enter.prevent="handleCustomHashtag"
                type="text"
                placeholder="Nhập hashtag rồi nhấn Enter..."
                class="w-full bg-transparent px-1 text-sm text-white placeholder-white/35 outline-none"
              />
            </div>

            <!-- Gợi ý nhanh -->
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="tag in [
                  '#VietnamTravel',
                  '#HaGiang',
                  '#Travel',
                  '#MaPiLeng',
                ]"
                :key="tag"
                type="button"
                @click="toggleHashtag(tag)"
                :class="
                  form.hashtags.includes(tag)
                    ? 'border-orange-300/30 bg-orange-300/15 text-orange-200'
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                "
                class="rounded-xl border px-3 py-1.5 text-xs transition"
              >
                {{ tag }}
              </button>
            </div>
          </div>

          <!-- ACTION BUTTONS -->
          <div
            class="flex flex-col-reverse items-center justify-end gap-3 border-t border-white/10 pt-6 sm:flex-row"
          >
            <RouterLink
              to="/community"
              class="w-full rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-center text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white sm:w-auto"
            >
              Hủy bỏ
            </RouterLink>

            <button
              :disabled="isSubmitting"
              type="submit"
              class="w-full rounded-2xl bg-white px-8 py-3.5 text-sm font-bold text-slate-900 shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-100 disabled:opacity-50 sm:w-auto"
            >
              {{ isSubmitting ? "Đang đăng bài..." : "Đăng bài viết" }}
            </button>
          </div>
        </form>
      </section>
    </main>
  </div>
</template>
