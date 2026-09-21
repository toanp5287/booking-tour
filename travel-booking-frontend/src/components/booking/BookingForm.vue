<script setup>
import { ref, watch } from "vue";
import { useBookingStore } from "@/stores/booking";

const bookingStore = useBookingStore();

const showMembers = ref(false);

// ================= NGƯỜI ĐẶT =================

const booker_name = ref(bookingStore.bookingData.booker_name || "");

const booker_phone = ref(bookingStore.bookingData.booker_phone || "");

const booker_email = ref(bookingStore.bookingData.booker_email || "");

const booker_identity_number = ref(
  bookingStore.bookingData.booker_identity_number || "",
);

const special_request = ref(bookingStore.bookingData.special_request || "");

// ================= ĐIỂM ĐÓN =================

const departure = ref(bookingStore.bookingData.departure || "");

// ================= SỐ LƯỢNG NGƯỜI =================

const memberCount = ref(Number(bookingStore.bookingData.people) || 1);

// ================= DANH SÁCH THÀNH VIÊN =================

const createMember = () => ({
  full_name: "",
  phone: "",
  email: "",
  date_of_birth: "",
  gender: "",
  identity_number: "",
  special_request: "",
});

const members = ref(
  Array.from(
    {
      length: memberCount.value,
    },
    () => createMember(),
  ),
);

// Nếu Pinia đã có dữ liệu thành viên thì lấy lại
if (
  Array.isArray(bookingStore.bookingData.booking_details) &&
  bookingStore.bookingData.booking_details.length > 0
) {
  members.value = bookingStore.bookingData.booking_details.map((member) => ({
    full_name: member.full_name || "",
    phone: member.phone || "",
    email: member.email || "",
    date_of_birth: member.date_of_birth || "",
    gender: member.gender || "",
    identity_number: member.identity_number || "",
    special_request: member.special_request || "",
  }));

  memberCount.value = members.value.length;
}

// ================= LƯU NGƯỜI ĐẶT =================

watch(
  [
    booker_name,
    booker_phone,
    booker_email,
    booker_identity_number,
    special_request,
  ],
  () => {
    bookingStore.setBooking({
      booker_name: booker_name.value,
      booker_phone: booker_phone.value,
      booker_email: booker_email.value,
      booker_identity_number: booker_identity_number.value,
      special_request: special_request.value,
    });
  },
);

// ================= LƯU ĐIỂM ĐÓN =================

watch(departure, (value) => {
  bookingStore.setBooking({
    departure: value,
  });
});

// ================= THAY ĐỔI SỐ LƯỢNG =================

const changeMemberCount = (value) => {
  const newCount = memberCount.value + value;

  if (newCount < 1 || newCount > 20) return;

  memberCount.value = newCount;
};

// ================= ĐỒNG BỘ SỐ LƯỢNG =================

watch(memberCount, (newCount) => {
  const currentCount = members.value.length;

  if (newCount > currentCount) {
    for (let i = currentCount; i < newCount; i++) {
      members.value.push(createMember());
    }
  }

  if (newCount < currentCount) {
    members.value.splice(newCount);
  }

  bookingStore.setBooking({
    people: newCount,
    booking_details: members.value,
  });
});

// ================= TỰ LƯU THÀNH VIÊN =================

watch(
  members,
  (newMembers) => {
    bookingStore.setBooking({
      booking_details: newMembers,
      people: newMembers.length,
    });
  },
  {
    deep: true,
  },
);
</script>

<template>
  <div
    class="rounded-[28px] border border-white/20 bg-black/45 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
  >
    <!-- ================================================= -->
    <!-- THÔNG TIN NGƯỜI ĐẶT -->
    <!-- ================================================= -->

    <div>
      <div class="mb-5">
        <h3 class="text-base font-bold text-white">Thông tin người đặt</h3>

        <p class="mt-1 text-sm text-white/50">
          Nhập thông tin người đại diện đặt tour
        </p>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <!-- HỌ TÊN -->
        <div>
          <label class="mb-2 block text-xs font-semibold text-white/70">
            Họ và tên <span class="text-red-400">*</span>
          </label>

          <input
            v-model="booker_name"
            type="text"
            placeholder="Nhập họ và tên"
            class="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/40"
          />
        </div>

        <!-- SỐ ĐIỆN THOẠI -->
        <div>
          <label class="mb-2 block text-xs font-semibold text-white/70">
            Số điện thoại <span class="text-red-400">*</span>
          </label>

          <input
            v-model="booker_phone"
            type="tel"
            placeholder="Nhập số điện thoại"
            class="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/40"
          />
        </div>

        <!-- EMAIL -->
        <div>
          <label class="mb-2 block text-xs font-semibold text-white/70">
            Email <span class="text-red-400">*</span>
          </label>

          <input
            v-model="booker_email"
            type="email"
            placeholder="Nhập email"
            class="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/40"
          />
        </div>

        <!-- CCCD -->
        <div>
          <label class="mb-2 block text-xs font-semibold text-white/70">
            CCCD / Hộ chiếu
            <span class="text-red-400">*</span>
          </label>

          <input
            v-model="booker_identity_number"
            type="text"
            placeholder="Nhập số CCCD / Hộ chiếu"
            class="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/40"
          />
        </div>

        <!-- ĐIỂM ĐÓN -->
        <div class="md:col-span-2">
          <label class="mb-2 block text-xs font-semibold text-white/70">
            Điểm đón
          </label>

          <input
            v-model="departure"
            type="text"
            placeholder="Nhập điểm đón của bạn"
            class="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 outline-none transition focus:border-white/40"
          />
        </div>

        <!-- GHI CHÚ -->
        <div class="md:col-span-2">
          <label class="mb-2 block text-xs font-semibold text-white/70">
            Ghi chú
          </label>

          <textarea
            v-model="special_request"
            rows="3"
            placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt..."
            class="w-full resize-none rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/40"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- ================================================= -->
    <!-- THÔNG TIN THÀNH VIÊN -->
    <!-- ================================================= -->

    <div class="mt-8 border-t border-white/10 pt-6">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-white">Thông tin thành viên</h3>

          <p class="mt-1 text-sm text-white/50">{{ memberCount }} thành viên</p>
        </div>

        <!-- HIỆN FORM -->
        <button
          v-if="!showMembers"
          type="button"
          @click="showMembers = true"
          class="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:bg-white/90"
        >
          Nhập thông tin
        </button>

        <!-- ẨN FORM -->
        <button
          v-else
          type="button"
          @click="showMembers = false"
          class="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
        >
          Thu gọn
        </button>
      </div>

      <!-- ================================================= -->
      <!-- FORM THÀNH VIÊN -->
      <!-- ================================================= -->

      <div v-if="showMembers" class="mt-5 space-y-5">
        <!-- SỐ LƯỢNG -->
        <div
          class="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
        >
          <div>
            <p class="font-semibold text-white">Số lượng thành viên</p>

            <p class="text-xs text-white/40">Điều chỉnh số người tham gia</p>
          </div>

          <div class="flex items-center gap-3">
            <!-- GIẢM -->
            <button
              type="button"
              @click="changeMemberCount(-1)"
              :disabled="memberCount <= 1"
              class="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-lg font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
            >
              −
            </button>

            <span class="min-w-[30px] text-center text-lg font-bold text-white">
              {{ memberCount }}
            </span>

            <!-- TĂNG -->
            <button
              type="button"
              @click="changeMemberCount(1)"
              :disabled="memberCount >= 20"
              class="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-lg font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>

        <!-- ================================================= -->
        <!-- TỪNG THÀNH VIÊN -->
        <!-- ================================================= -->

        <div
          v-for="(member, index) in members"
          :key="index"
          class="rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <div class="mb-5 flex items-center justify-between">
            <h4 class="font-bold text-white">Thành viên {{ index + 1 }}</h4>

            <span class="text-xs text-white/40"> Người tham gia </span>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <!-- HỌ TÊN -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Họ và tên
              </label>

              <input
                v-model="member.full_name"
                type="text"
                placeholder="Nhập họ và tên"
                class="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/40"
              />
            </div>

            <!-- SỐ ĐIỆN THOẠI -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Số điện thoại
              </label>

              <input
                v-model="member.phone"
                type="tel"
                placeholder="Nhập số điện thoại"
                class="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/40"
              />
            </div>

            <!-- EMAIL -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Email
              </label>

              <input
                v-model="member.email"
                type="email"
                placeholder="Nhập email"
                class="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/40"
              />
            </div>

            <!-- NGÀY SINH -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Ngày sinh
              </label>

              <input
                v-model="member.date_of_birth"
                type="date"
                class="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-white/40"
              />
            </div>

            <!-- GIỚI TÍNH -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Giới tính
              </label>

              <select
                v-model="member.gender"
                class="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-white/40"
              >
                <option value="" disabled class="text-black">
                  Chọn giới tính
                </option>

                <option value="MALE" class="text-black">Nam</option>

                <option value="FEMALE" class="text-black">Nữ</option>

                <option value="OTHER" class="text-black">Khác</option>
              </select>
            </div>

            <!-- CCCD -->
            <div>
              <label class="mb-2 block text-xs font-semibold text-white/70">
                CCCD / CMND
              </label>

              <input
                v-model="member.identity_number"
                type="text"
                placeholder="Nhập số CCCD / CMND"
                class="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/40"
              />
            </div>

            <!-- YÊU CẦU ĐẶC BIỆT -->
            <div class="md:col-span-2">
              <label class="mb-2 block text-xs font-semibold text-white/70">
                Yêu cầu đặc biệt
              </label>

              <textarea
                v-model="member.special_request"
                rows="3"
                placeholder="Ví dụ: ăn chay, cần hỗ trợ..."
                class="w-full resize-none rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/40"
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
