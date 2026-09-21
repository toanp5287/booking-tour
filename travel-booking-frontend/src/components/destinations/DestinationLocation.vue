```vue
<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

const props = defineProps({
  latitude: {
    type: [Number, String],
    default: null,
  },

  longitude: {
    type: [Number, String],
    default: null,
  },

  name: {
    type: String,
    default: "Địa điểm",
  },
});

const mapContainer = ref(null);

let map = null;
let marker = null;
let locationButton = null;

const getCoordinates = () => ({
  lat: Number(props.latitude),
  lng: Number(props.longitude),
});

const validCoordinates = () => {
  const { lat, lng } = getCoordinates();

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

/* =========================
   MARKER
========================= */

const createMarkerIcon = () => {
  return L.divIcon({
    className: "travelgo-marker",
    html: `
      <div class="travelgo-marker-wrap">
        <div class="travelgo-marker-pulse"></div>

        <div class="travelgo-marker-ring"></div>

        <div class="travelgo-marker-core">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/>
            <circle cx="12" cy="10" r="2.5"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [90, 90],
    iconAnchor: [45, 45],
    popupAnchor: [0, -42],
  });
};

/* =========================
   POPUP
========================= */

const createPopup = () => {
  const { lat, lng } = getCoordinates();

  return `
    <div class="travelgo-popup-inner">

      <div class="flex items-start gap-3">

        <div
          class="
            flex h-11 w-11 shrink-0 items-center justify-center
            rounded-2xl
            border border-white/10
            bg-white/[0.07]
          "
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>

        <div class="min-w-0">
          <p
            class="
              text-[8px]
              font-bold
              uppercase
              tracking-[0.25em]
              text-white/35
            "
          >
            DESTINATION
          </p>

          <p
            class="
              mt-1
              max-w-[190px]
              truncate
              text-sm
              font-bold
              text-white
            "
          >
            ${props.name}
          </p>
        </div>

      </div>

      <div class="my-4 h-px bg-white/10"></div>

      <div class="grid grid-cols-2 gap-2">

        <div
          class="
            rounded-xl
            border border-white/[0.07]
            bg-white/[0.035]
            px-3 py-2.5
          "
        >
          <p
            class="
              text-[8px]
              uppercase
              tracking-[0.15em]
              text-white/30
            "
          >
            LATITUDE
          </p>

          <p class="mt-1 text-[10px] font-semibold text-white/75">
            ${lat.toFixed(5)}°
          </p>
        </div>

        <div
          class="
            rounded-xl
            border border-white/[0.07]
            bg-white/[0.035]
            px-3 py-2.5
          "
        >
          <p
            class="
              text-[8px]
              uppercase
              tracking-[0.15em]
              text-white/30
            "
          >
            LONGITUDE
          </p>

          <p class="mt-1 text-[10px] font-semibold text-white/75">
            ${lng.toFixed(5)}°
          </p>
        </div>

      </div>

      <a
        href="https://www.google.com/maps?q=${lat},${lng}"
        target="_blank"
        rel="noopener noreferrer"
        class="
          mt-3
          flex
          items-center
          justify-between
          rounded-xl
          border border-white/10
          bg-white/[0.06]
          px-3
          py-3
          text-[10px]
          font-semibold
          text-white
          no-underline
          transition
          hover:bg-white/[0.11]
        "
      >
        <span>Mở Google Maps</span>

        <span
          class="
            flex h-7 w-7
            items-center justify-center
            rounded-lg
            bg-white/[0.08]
          "
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <path d="M5 12h14"/>
            <path d="m12 5 7 7-7 7"/>
          </svg>
        </span>
      </a>

    </div>
  `;
};

/* =========================
   MAP
========================= */

const initMap = async () => {
  if (!validCoordinates()) return;

  await nextTick();

  if (!mapContainer.value) return;

  const { lat, lng } = getCoordinates();

  /* MAP ĐÃ TỒN TẠI */

  if (map) {
    map.flyTo([lat, lng], 14, {
      duration: 0.9,
    });

    if (marker) {
      marker.setLatLng([lat, lng]);
      marker.setPopupContent(createPopup());
    }

    setTimeout(() => {
      map?.invalidateSize();
    }, 300);

    return;
  }

  /* CREATE MAP */

  map = L.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: false,

    scrollWheelZoom: false,
    doubleClickZoom: true,

    dragging: true,
    touchZoom: true,

    minZoom: 3,
    maxZoom: 19,
  }).setView([lat, lng], 14);

  /* =========================
     TILE
  ========================= */

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,

    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  /* =========================
     MARKER
  ========================= */

  marker = L.marker([lat, lng], {
    icon: createMarkerIcon(),
    riseOnHover: true,
  })
    .addTo(map)
    .bindPopup(createPopup(), {
      className: "travelgo-popup",
      closeButton: false,
      offset: [0, -28],
      maxWidth: 300,
      minWidth: 270,
    });

  /* MỞ POPUP */

  setTimeout(() => {
    marker?.openPopup();
  }, 500);

  /* =========================
     ZOOM CONTROL
  ========================= */

  L.control
    .zoom({
      position: "bottomright",
    })
    .addTo(map);

  /* =========================
     LOCATION BUTTON
  ========================= */

  const LocationButton = L.Control.extend({
    options: {
      position: "bottomright",
    },

    onAdd() {
      const button = L.DomUtil.create("button", "travelgo-location");

      button.type = "button";

      button.title = "Đưa về địa điểm";

      button.innerHTML = `
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
        >
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v4"/>
          <path d="M12 18v4"/>
          <path d="M2 12h4"/>
          <path d="M18 12h4"/>
        </svg>
      `;

      L.DomEvent.disableClickPropagation(button);

      button.onclick = () => {
        map?.flyTo([lat, lng], 14, {
          duration: 1,
        });

        setTimeout(() => {
          marker?.openPopup();
        }, 650);
      };

      return button;
    },
  });

  locationButton = new LocationButton();

  map.addControl(locationButton);

  /* =========================
     ATTRIBUTION
  ========================= */

  L.control
    .attribution({
      position: "bottomleft",
      prefix: false,
    })
    .addAttribution(
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    )
    .addTo(map);

  /* =========================
     RESIZE
  ========================= */

  setTimeout(() => {
    map?.invalidateSize();
  }, 500);
};

/* =========================
   LIFECYCLE
========================= */

onMounted(() => {
  initMap();
});

watch(
  () => [props.latitude, props.longitude, props.name],
  () => {
    initMap();
  },
);

onBeforeUnmount(() => {
  if (map) {
    map.remove();
    map = null;
    marker = null;
    locationButton = null;
  }
});
</script>

<template>
  <section
    class="travelgo-map group relative h-[560px] w-full overflow-hidden rounded-[34px] border border-white/[0.08] bg-[#070b11] shadow-[0_40px_120px_rgba(0,0,0,.55)]"
  >
    <!-- MAP -->

    <div ref="mapContainer" class="absolute inset-0 h-full w-full"></div>

    <!-- DARK CINEMATIC OVERLAY -->

    <div
      class="pointer-events-none absolute inset-0 z-[400] bg-gradient-to-b from-[#05080d]/70 via-transparent to-[#05080d]/90"
    ></div>

    <!-- TOP LEFT -->

    <div
      class="absolute left-5 top-5 z-[500] flex items-center gap-3 rounded-[20px] border border-white/[0.09] bg-[#080d14]/75 px-3 py-3 shadow-[0_20px_60px_rgba(0,0,0,.4)] backdrop-blur-2xl sm:left-6 sm:top-6"
    >
      <div
        class="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.055]"
      >
        <div
          class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"
        ></div>

        <svg
          class="relative"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>

      <div class="min-w-0 pr-2">
        <div class="flex items-center gap-2">
          <span
            class="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,.8)]"
          ></span>

          <p
            class="text-[8px] font-bold uppercase tracking-[0.25em] text-white/35"
          >
            EXPLORE
          </p>
        </div>

        <h3
          class="mt-1 max-w-[220px] truncate text-sm font-bold tracking-tight text-white"
        >
          {{ name }}
        </h3>
      </div>
    </div>

    <!-- TOP RIGHT STATUS -->

    <div
      class="absolute right-5 top-5 z-[500] hidden items-center gap-2 rounded-full border border-white/[0.08] bg-[#080d14]/70 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45 backdrop-blur-2xl sm:flex sm:right-6 sm:top-6"
    >
      <span
        class="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.8)]"
      ></span>

      Interactive map
    </div>

    <!-- CENTER GLOW -->

    <div
      class="pointer-events-none absolute left-1/2 top-1/2 z-[350] -translate-x-1/2 -translate-y-1/2"
    >
      <div class="h-72 w-72 rounded-full bg-white/[0.025] blur-[80px]"></div>
    </div>

    <!-- BOTTOM INFORMATION -->

    <div
      class="absolute bottom-5 left-5 right-5 z-[500] flex flex-col gap-3 sm:bottom-6 sm:left-6 sm:right-6 sm:flex-row sm:items-end sm:justify-between"
    >
      <!-- COORDINATES -->

      <div
        class="w-fit rounded-[20px] border border-white/[0.08] bg-[#080d14]/75 px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,.4)] backdrop-blur-2xl"
      >
        <p
          class="text-[8px] font-bold uppercase tracking-[0.22em] text-white/30"
        >
          LOCATION DATA
        </p>

        <div class="mt-1.5 flex items-center gap-2">
          <span
            class="text-[10px] font-semibold tabular-nums text-white/75 sm:text-[11px]"
          >
            {{ Number(latitude).toFixed(5) }}° N
          </span>

          <span class="text-white/20">•</span>

          <span
            class="text-[10px] font-semibold tabular-nums text-white/75 sm:text-[11px]"
          >
            {{ Number(longitude).toFixed(5) }}° E
          </span>
        </div>
      </div>

      <!-- GOOGLE MAPS -->

      <a
        :href="`https://www.google.com/maps?q=${latitude},${longitude}`"
        target="_blank"
        rel="noopener noreferrer"
        class="group/google flex items-center justify-between gap-4 rounded-[20px] border border-white/[0.09] bg-[#080d14]/80 px-4 py-3 text-xs font-semibold text-white no-underline shadow-[0_20px_60px_rgba(0,0,0,.45)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-[#0c121b]/90"
      >
        <div>
          <p
            class="text-[8px] font-bold uppercase tracking-[0.2em] text-white/30"
          >
            NAVIGATION
          </p>

          <span class="mt-0.5 block"> Mở Google Maps </span>
        </div>

        <span
          class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.06] transition duration-300 group-hover/google:translate-x-0.5 group-hover/google:bg-white/[0.1]"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </span>
      </a>
    </div>
  </section>
</template>

<style>
/* =========================================
   TRAVELGO MAP
========================================= */

.travelgo-map {
  isolation: isolate;
}

/* =========================================
   DARK MAP
========================================= */

.travelgo-map .leaflet-tile {
  filter: brightness(0.52) contrast(1.12) saturate(0.62);
}

.travelgo-map .leaflet-container {
  background: #070b11;
  font-family: inherit;
}

/* =========================================
   MARKER
========================================= */

.travelgo-marker {
  background: transparent !important;
  border: none !important;
}

.travelgo-marker-wrap {
  position: relative;

  width: 90px;
  height: 90px;

  display: flex;
  align-items: center;
  justify-content: center;
}

.travelgo-marker-pulse {
  position: absolute;

  width: 70px;
  height: 70px;

  border-radius: 9999px;

  background: rgba(255, 255, 255, 0.08);

  animation: travelgo-pulse 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.travelgo-marker-ring {
  position: absolute;

  width: 58px;
  height: 58px;

  border-radius: 9999px;

  border: 1px solid rgba(255, 255, 255, 0.28);

  background: rgba(8, 13, 20, 0.72);

  box-shadow:
    0 15px 45px rgba(0, 0, 0, 0.6),
    inset 0 0 0 5px rgba(255, 255, 255, 0.025);

  backdrop-filter: blur(12px);
}

.travelgo-marker-core {
  position: relative;

  width: 42px;
  height: 42px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 9999px;

  background: #0b1018;

  border: 2px solid rgba(255, 255, 255, 0.9);

  box-shadow:
    0 0 0 5px rgba(255, 255, 255, 0.04),
    0 15px 40px rgba(0, 0, 0, 0.65);
}

@keyframes travelgo-pulse {
  0% {
    transform: scale(0.65);
    opacity: 0.75;
  }

  70% {
    transform: scale(1.35);
    opacity: 0;
  }

  100% {
    transform: scale(1.35);
    opacity: 0;
  }
}

/* =========================================
   POPUP
========================================= */

.travelgo-popup .leaflet-popup-content-wrapper {
  padding: 0 !important;

  overflow: hidden;

  border-radius: 22px !important;

  background: linear-gradient(
    145deg,
    rgba(13, 19, 29, 0.98),
    rgba(6, 10, 16, 0.98)
  ) !important;

  color: white;

  border: 1px solid rgba(255, 255, 255, 0.09);

  box-shadow: 0 35px 100px rgba(0, 0, 0, 0.65);

  backdrop-filter: blur(30px);
}

.travelgo-popup .leaflet-popup-content {
  margin: 0 !important;
}

.travelgo-popup .leaflet-popup-tip {
  background: #0a1018 !important;
}

.travelgo-popup-inner {
  padding: 16px;
}

/* =========================================
   ZOOM
========================================= */

.travelgo-map .leaflet-control-zoom {
  margin-right: 22px !important;
  margin-bottom: 112px !important;

  border: none !important;
  box-shadow: none !important;
}

.travelgo-map .leaflet-control-zoom a {
  width: 40px !important;
  height: 40px !important;

  display: flex !important;
  align-items: center;
  justify-content: center;

  margin-top: 6px;

  border: 1px solid rgba(255, 255, 255, 0.08) !important;

  border-radius: 13px !important;

  background: rgba(7, 12, 19, 0.82) !important;

  color: rgba(255, 255, 255, 0.8) !important;

  font-size: 17px !important;

  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.45);

  backdrop-filter: blur(20px);

  transition:
    transform 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
}

.travelgo-map .leaflet-control-zoom a:hover {
  transform: translateY(-2px);

  background: rgba(18, 25, 36, 0.95) !important;

  color: white !important;
}

/* =========================================
   LOCATION
========================================= */

.travelgo-location {
  width: 40px;
  height: 40px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-top: 6px;

  border: 1px solid rgba(255, 255, 255, 0.08);

  border-radius: 13px;

  background: rgba(7, 12, 19, 0.82);

  color: rgba(255, 255, 255, 0.8);

  cursor: pointer;

  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.45);

  backdrop-filter: blur(20px);

  transition:
    transform 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
}

.travelgo-location:hover {
  transform: translateY(-2px);

  background: rgba(18, 25, 36, 0.95);

  color: white;
}

/* =========================================
   ATTRIBUTION
========================================= */

.travelgo-map .leaflet-control-attribution {
  margin-left: 10px !important;
  margin-bottom: 8px !important;

  padding: 3px 7px !important;

  border-radius: 8px !important;

  background: rgba(4, 8, 13, 0.55) !important;

  color: rgba(255, 255, 255, 0.25) !important;

  font-size: 8px !important;

  backdrop-filter: blur(10px);
}

.travelgo-map .leaflet-control-attribution a {
  color: rgba(255, 255, 255, 0.45) !important;
}

/* =========================================
   MOBILE
========================================= */

@media (max-width: 640px) {
  .travelgo-map {
    height: 500px;
    border-radius: 26px;
  }

  .travelgo-map .leaflet-control-zoom {
    margin-right: 14px !important;
    margin-bottom: 112px !important;
  }

  .travelgo-map .leaflet-control-zoom a {
    width: 36px !important;
    height: 36px !important;
  }

  .travelgo-location {
    width: 36px;
    height: 36px;
  }

  .travelgo-marker-wrap {
    transform: scale(0.9);
  }
}
</style>
