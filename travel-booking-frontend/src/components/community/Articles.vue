<script setup>
import { computed, ref } from "vue";
import communityService from "../../services/community.service";
import { useQueryClient } from "@tanstack/vue-query";

const queryClient = useQueryClient();

const showAll = ref(false);
const showComments = ref(null);

// Lưu nội dung comment theo từng bài viết
const commentContent = ref("");

const props = defineProps({
  community: {
    type: Array,
    default: () => [],
  },
});

const community = computed(() => {
  if (showAll.value) {
    return props.community;
  }

  return props.community.slice(0, 3);
});

// =========================
// TOGGLE COMMENTS
// =========================

const comments = ref([]);

const toggleComments = async (postId) => {
  console.log("POST ID:", postId);
  console.log("LENGTH:", postId?.length);

  if (showComments.value === postId) {
    showComments.value = null;
    comments.value = [];
    return;
  }

  try {
    showComments.value = postId;

    const result = await communityService.getAllComment(postId);

    console.log("COMMENT RESULT:", result);

    comments.value = result.data?.data || [];
  } catch (error) {
    console.error("Lỗi lấy comment:", error);
    comments.value = [];
  }
};
// =========================
// LIKE
// =========================
const like = async (post_id) => {
  const userData = localStorage.getItem("user");

  if (!userData) {
    alert("Cần đăng nhập để thích bài viết");
    return;
  }

  try {
    console.log("post_id:", post_id);

    await communityService.toggleLike(post_id);

    await queryClient.invalidateQueries({
      queryKey: ["communityData"],
    });
  } catch (error) {
    console.error("Lỗi like:", error);
  }
};

// =========================
// CREATE COMMENT
// =========================
const createComment = async (post_id) => {
  const userData = localStorage.getItem("user");

  if (!userData) {
    alert("Cần đăng nhập để bình luận");
    return;
  }

  const content = commentContent.value.trim();

  if (!content) {
    alert("Vui lòng nhập nội dung bình luận");
    return;
  }

  try {
    await communityService.createComment({
      post_id,
      content,
    });

    commentContent.value = "";

    await queryClient.invalidateQueries({
      queryKey: ["communityData"],
    });

    console.log("Bình luận thành công");
  } catch (error) {
    console.error("Lỗi tạo bình luận:", error);
  }
};
</script>

<template>
  <section class="space-y-6">
    <!-- CREATE POST -->
    <div
      class="rounded-[24px] border border-white/15 bg-white/[0.07] p-5 backdrop-blur-2xl"
    >
      <div class="flex gap-3">
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-orange-600 font-bold text-slate-950 shadow-lg"
        >
          V
        </div>

        <RouterLink
          to="/community/create-post"
          class="flex flex-1 items-center rounded-2xl border border-white/15 bg-black/25 px-4 text-sm text-white/60 transition hover:border-white/30 hover:text-white"
        >
          Bạn đang nghĩ gì về chuyến đi tiếp theo?
        </RouterLink>
      </div>

      <div class="mt-4 grid grid-cols-3 border-t border-white/10 pt-4">
        <RouterLink
          to="/community/create-post"
          class="flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <span>📷</span>
          Ảnh
        </RouterLink>

        <RouterLink
          to="/community/create-post"
          class="flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <span>📍</span>
          Điểm đến
        </RouterLink>

        <RouterLink
          to="/create-review"
          class="flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <span>⭐</span>
          Đánh giá
        </RouterLink>
      </div>
    </div>

    <!-- EMPTY -->
    <div
      v-if="community.length === 0"
      class="rounded-[24px] border border-white/10 bg-white/[0.05] p-8 text-center text-sm text-white/50"
    >
      Chưa có bài viết nào.
    </div>

    <!-- COMMUNITY POSTS -->
    <div v-else class="space-y-6">
      <article
        v-for="value in community"
        :key="value._id"
        class="overflow-hidden rounded-[28px] border border-white/15 bg-white/[0.07] shadow-2xl backdrop-blur-2xl"
      >
        <!-- HEADER -->
        <div class="flex items-center justify-between p-5">
          <div class="flex items-center gap-3">
            <!-- AVATAR -->
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-orange-300 to-orange-600 font-bold text-slate-950"
            >
              <img
                v-if="value.author?.avatar"
                :src="`http://localhost:8080/${value.author.avatar}`"
                alt="Avatar"
                class="h-full w-full object-cover"
              />

              <span v-else>
                {{ value.author?.full_name?.charAt(0)?.toUpperCase() }}
              </span>
            </div>

            <!-- AUTHOR -->
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-bold text-white">
                  {{ value.author?.full_name }}
                </h3>

                <span
                  v-if="value.author?.is_verified"
                  class="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[9px] font-bold text-white"
                >
                  ✓
                </span>
              </div>

              <p class="mt-0.5 text-xs text-white/60">
                {{ new Date(value.createdAt).toLocaleString("vi-VN") }}

                <span v-if="value.location"> · {{ value.location }} </span>
              </p>
            </div>
          </div>

          <!-- MORE -->
          <button
            type="button"
            class="cursor-pointer rounded-lg px-2 py-1 text-xl text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            ···
          </button>
        </div>

        <!-- CONTENT -->
        <div class="px-5 pb-4">
          <p class="text-sm leading-7 text-white/80">
            {{ value.content }}
          </p>

          <!-- HASHTAGS -->
          <div v-if="value.hashtags?.length" class="mt-3 flex flex-wrap gap-2">
            <span
              v-for="hashtag in value.hashtags"
              :key="hashtag"
              class="text-xs font-semibold text-orange-300"
            >
              {{ hashtag }}
            </span>
          </div>
        </div>

        <!-- IMAGE -->
        <div v-if="value.images?.length" class="relative">
          <img
            :src="`http://localhost:8080/${value.images[0]}`"
            alt="Ảnh bài viết"
            class="h-[430px] w-full object-cover"
          />

          <!-- LOCATION -->
          <div
            v-if="value.location"
            class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-24"
          >
            <div
              class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-xl"
            >
              📍 {{ value.location }}
            </div>
          </div>
        </div>

        <!-- TOUR -->
        <div
          v-if="value.tour_attachment?.tour_id"
          class="mx-5 mt-4 rounded-2xl border border-orange-300/10 bg-orange-300/5 p-4"
        >
          <p class="text-xs text-white/40">Tour đã trải nghiệm</p>

          <p class="mt-1 text-sm font-semibold text-orange-300">
            {{ value.tour_attachment.tour_name }}
          </p>
        </div>

        <!-- ACTIONS -->

        <div class="border-t border-white/10">
          <!-- ACTION BUTTONS -->
          <div class="flex items-center justify-between px-5 py-3">
            <div class="flex items-center gap-1">
              <!-- LIKE -->
              <button
                type="button"
                @click="like(value._id)"
                :class="[
                  'group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition',
                  value.is_liked
                    ? 'bg-rose-500/10 text-rose-500'
                    : 'text-white/65 hover:bg-white/[0.06] hover:text-rose-400',
                ]"
              >
                <span
                  :class="[
                    'text-xl leading-none transition-all',
                    value.is_liked
                      ? 'scale-110 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                      : 'group-hover:scale-110',
                  ]"
                >
                  {{ value.is_liked ? "♥" : "♡" }}
                </span>

                <span>
                  {{ value.likes_count || 0 }}
                </span>
              </button>

              <!-- COMMENT -->
              <button
                type="button"
                @click="toggleComments(value._id)"
                :class="[
                  'flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition',
                  showComments === value._id
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/65 hover:bg-white/[0.06] hover:text-white',
                ]"
              >
                <span class="text-lg leading-none"> 💬 </span>

                <span>
                  {{ value.comments_count || 0 }}
                </span>
              </button>

              <!-- SHARE -->
              <button
                type="button"
                class="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white/65 transition hover:bg-white/[0.06] hover:text-white"
              >
                <span class="text-lg leading-none"> ↗ </span>

                <span> Chia sẻ </span>
              </button>
            </div>

            <!-- SAVE -->
            <button
              type="button"
              class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-lg text-white/50 transition hover:bg-white/[0.06] hover:text-white"
              title="Lưu bài viết"
            >
              ♡
            </button>
          </div>

          <!-- COMMENTS -->
          <div
            v-if="showComments === value._id"
            class="border-t border-white/10 bg-black/10 px-5 py-4"
          >
            <!-- COMMENT INPUT -->
            <div class="flex items-center gap-3">
              <!-- USER AVATAR -->
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-orange-300 to-orange-600 text-sm font-bold text-slate-950"
              >
                V
              </div>

              <!-- INPUT -->
              <div
                class="flex flex-1 items-center rounded-2xl border border-white/10 bg-white/[0.05] px-3 transition focus-within:border-orange-400/40 focus-within:bg-white/[0.07]"
              >
                <input
                  v-model="commentContent"
                  type="text"
                  placeholder="Viết bình luận..."
                  class="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm text-white outline-none placeholder:text-white/35"
                />

                <button
                  @click="createComment(value._id)"
                  type="button"
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-orange-400 transition hover:bg-orange-400/10 hover:text-orange-300"
                  title="Gửi bình luận"
                >
                  ➤
                </button>
              </div>
            </div>

            <!-- COMMENT LIST -->
            <div class="mt-4 space-y-3">
              <!-- COMMENT ITEM -->
              <div class="flex gap-3">
                <!-- AVATAR -->
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white"
                >
                  A
                </div>

                <!-- CONTENT -->
                <div class="min-w-0">
                  <div
                    v-for="value in comments"
                    :key="value._id"
                    class="rounded-2xl bg-white/[0.06] px-4 py-3"
                  >
                    <div class="flex items-center justify-between">
                      <!-- Tên người bình luận -->
                      <p class="text-xs font-semibold text-white">
                        {{ value.full_name || "Người dùng ẩn danh" }}
                      </p>

                      <!-- Thời gian bình luận (nếu muốn hiển thị) -->
                      <span class="text-[10px] text-white/40">
                        {{
                          new Date(value.createdAt).toLocaleDateString("vi-VN")
                        }}
                      </span>
                    </div>

                    <!-- Nội dung bình luận -->
                    <p class="mt-1.5 text-sm leading-6 text-white/80">
                      {{ value.content }}
                    </p>
                  </div>

                  <!-- COMMENT ACTION -->
                  <div
                    class="mt-1 flex items-center gap-4 px-2 text-[11px] text-white/35"
                  >
                    <button
                      type="button"
                      class="transition hover:text-rose-400"
                    >
                      Thích
                    </button>

                    <button type="button" class="transition hover:text-white">
                      Trả lời
                    </button>

                    <span> 1 phút </span>
                  </div>
                </div>
              </div>

              <!-- EMPTY COMMENTS -->
              <div
                v-if="!value.comments_count"
                class="rounded-2xl border border-dashed border-white/10 py-5 text-center"
              >
                <div class="text-2xl opacity-40">💬</div>

                <p class="mt-2 text-sm text-white/40">Chưa có bình luận nào</p>

                <p class="mt-1 text-xs text-white/25">
                  Hãy là người đầu tiên bình luận.
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>

    <!-- LOAD MORE / COLLAPSE -->
    <button
      v-if="props.community.length > 3"
      type="button"
      @click="showAll = !showAll"
      class="w-full cursor-pointer rounded-2xl border border-white/15 bg-white/[0.06] py-4 text-sm font-semibold text-white/75 transition hover:bg-white/15 hover:text-white"
    >
      {{ showAll ? "Thu gọn bài viết" : "Xem thêm bài viết" }}
    </button>
  </section>
</template>
