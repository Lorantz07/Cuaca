(() => {
  "use strict";

  const API = {
    geocoding: "https://geocoding-api.open-meteo.com/v1/search",
    forecast: "https://api.open-meteo.com/v1/forecast"
  };

  const STORAGE = {
    theme: "weathernow:theme",
    city: "weathernow:city",
    locations: "weathernow:locations"
  };

  const DEFAULT_CITY = "Jakarta";
  const MAX_LOCATIONS = 8;

  const WEATHER_CODES = {
    0: { label: "Cerah", icon: ["clear-day", "clear-night"] },
    1: { label: "Cerah Berawan", icon: ["partly-cloudy-day", "partly-cloudy-night"] },
    2: { label: "Sebagian Berawan", icon: ["partly-cloudy-day", "partly-cloudy-night"] },
    3: { label: "Berawan", icon: "overcast" },
    45: { label: "Berkabut", icon: "fog" },
    48: { label: "Kabut Beku", icon: "fog" },
    51: { label: "Gerimis Ringan", icon: "drizzle" },
    53: { label: "Gerimis Sedang", icon: "drizzle" },
    55: { label: "Gerimis Lebat", icon: "drizzle" },
    56: { label: "Gerimis Beku Ringan", icon: "sleet" },
    57: { label: "Gerimis Beku Lebat", icon: "sleet" },
    61: { label: "Hujan Ringan", icon: "rain" },
    63: { label: "Hujan Sedang", icon: "rain" },
    65: { label: "Hujan Lebat", icon: "rain" },
    66: { label: "Hujan Beku Ringan", icon: "sleet" },
    67: { label: "Hujan Beku Lebat", icon: "sleet" },
    71: { label: "Salju Ringan", icon: "snow" },
    73: { label: "Salju Sedang", icon: "snow" },
    75: { label: "Salju Lebat", icon: "snow" },
    77: { label: "Butiran Salju", icon: "snow" },
    80: { label: "Hujan Lokal Ringan", icon: "rain" },
    81: { label: "Hujan Lokal Sedang", icon: "rain" },
    82: { label: "Hujan Lokal Lebat", icon: "rain" },
    85: { label: "Hujan Salju Ringan", icon: "snow" },
    86: { label: "Hujan Salju Lebat", icon: "snow" },
    95: { label: "Badai Petir", icon: "thunderstorms" },
    96: { label: "Badai Petir dengan Hujan Es", icon: "hail" },
    99: { label: "Badai Petir Hebat dengan Hujan Es", icon: "hail" },
    default: { label: "Cuaca Tidak Diketahui", icon: ["partly-cloudy-day", "partly-cloudy-night"] }
  };

  const WEATHER_TINTS = {
    "clear-day": "rgba(251, 191, 36, 0.22)",
    "clear-night": "rgba(125, 150, 180, 0.18)",
    "partly-cloudy-day": "rgba(147, 197, 253, 0.20)",
    "partly-cloudy-night": "rgba(125, 150, 180, 0.17)",
    overcast: "rgba(148, 163, 184, 0.17)",
    fog: "rgba(203, 213, 225, 0.16)",
    drizzle: "rgba(96, 165, 250, 0.19)",
    rain: "rgba(59, 130, 246, 0.22)",
    sleet: "rgba(125, 211, 252, 0.19)",
    snow: "rgba(226, 232, 240, 0.22)",
    thunderstorms: "rgba(100, 116, 139, 0.24)",
    hail: "rgba(120, 140, 160, 0.21)"
  };

  const ICONS = {
    pin: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z"></path><circle cx="12" cy="10" r="2.4"></circle></svg>',
    plus: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>',
    check: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"></path></svg>',
    arrow: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path></svg>',
    trash: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"></path><path d="M9 7V4h6v3"></path><path d="m6 7 1 13h10l1-13"></path><path d="M10 11v5M14 11v5"></path></svg>'
  };

  const numberFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

  const state = {
    locations: [],
    activeCity: "",
    searchResults: [],
    searchController: null,
    weatherControllers: new Map(),
    pendingWeather: 0,
    lastUpdated: null,
    pendingDelete: null,
    toastTimer: null,
    booted: false
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    initTheme();
    initHeader();
    initSearch();
    initRefresh();
    initListActions();
    initToast();
    initConnectivity();

    state.activeCity = getActiveCity() || "";
    updateSummary();
    boot();
  }

  /* =========================================================
     Theme
     ========================================================= */

  function initTheme() {
    const current = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    applyTheme(current, false);

    $$(".theme-switch__btn").forEach((button) => {
      button.addEventListener("click", () => applyTheme(button.dataset.themeValue, true));
    });
  }

  function applyTheme(theme, persist) {
    const next = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = next;

    $$(".theme-switch__btn").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.themeValue === next));
    });

    const meta = $("#theme-color");
    if (meta) meta.setAttribute("content", next === "light" ? "#dfefff" : "#071226");

    if (persist) {
      try {
        localStorage.setItem(STORAGE.theme, next);
      } catch (error) {
        /* Tema tetap berfungsi untuk sesi ini bila penyimpanan diblokir. */
      }
    }
  }

  /* =========================================================
     Header
     ========================================================= */

  function initHeader() {
    const header = $(".site-header");
    if (!header) return;

    let scrolled = false;
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const next = scrolled ? y > 8 : y > 24;

      if (next === scrolled) return;
      scrolled = next;
      header.classList.toggle("is-scrolled", next);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* =========================================================
     Boot and saved locations
     ========================================================= */

  async function boot() {
    const stored = readLocations();

    if (stored === null) {
      await seedActiveCity();
    } else {
      state.locations = stored;

      if (!state.activeCity && state.locations.length) {
        state.activeCity = displayLocationName(state.locations[0]);
        saveActiveCity(state.activeCity);
      }

      renderList();
      updateSummary();

      if (state.locations.length) {
        refreshAll({ quiet: true });
      } else {
        setSavedSubtitle("Belum ada lokasi. Tambahkan kota pertamamu.");
      }
    }

    state.booted = true;
    updateBusyState();
  }

  async function seedActiveCity() {
    const city = getActiveCity() || DEFAULT_CITY;
    setSavedSubtitle("Menyiapkan lokasi awal…");

    try {
      const results = await geocode(city, 1);
      if (!results.length) throw createUserError("Lokasi awal tidak ditemukan.");

      if (state.locations.length) return;

      const location = toLocation(results[0]);
      state.locations = [location];

      if (!state.activeCity) {
        state.activeCity = displayLocationName(location);
        saveActiveCity(state.activeCity);
      }

      saveLocations();
      renderList();
      updateSummary();
      await refreshAll({ quiet: true });
    } catch (error) {
      if (error && error.name === "AbortError") return;
      if (state.locations.length) return;

      state.locations = [];
      renderList();
      updateSummary();
      setSavedSubtitle("Tambahkan lokasi pertamamu untuk mulai memantau cuaca.");
    }
  }

  function readLocations() {
    try {
      const raw = localStorage.getItem(STORAGE.locations);
      if (raw === null) return null;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter(isValidLocation)
        .slice(0, MAX_LOCATIONS)
        .map((location) => ({
          ...location,
          id: String(location.id),
          name: String(location.name),
          latitude: Number(location.latitude),
          longitude: Number(location.longitude),
          admin1: String(location.admin1 || ""),
          country: String(location.country || ""),
          countryCode: String(location.countryCode || ""),
          timezone: String(location.timezone || "")
        }));
    } catch (error) {
      return [];
    }
  }

  function saveLocations() {
    try {
      localStorage.setItem(STORAGE.locations, JSON.stringify(state.locations));
    } catch (error) {
      /* Daftar tetap bisa dipakai selama halaman ini terbuka. */
    }
  }

  function isValidLocation(location) {
    return Boolean(
      location &&
      typeof location === "object" &&
      typeof location.name === "string" &&
      Number.isFinite(Number(location.latitude)) &&
      Number.isFinite(Number(location.longitude)) &&
      Number(location.latitude) >= -90 &&
      Number(location.latitude) <= 90 &&
      Number(location.longitude) >= -180 &&
      Number(location.longitude) <= 180
    );
  }

  function toLocation(place) {
    const latitude = Number(place.latitude);
    const longitude = Number(place.longitude);

    return {
      id: String(place.id || `${latitude.toFixed(4)}:${longitude.toFixed(4)}`),
      name: String(place.name || "").trim(),
      latitude,
      longitude,
      admin1: String(place.admin1 || ""),
      country: String(place.country || ""),
      countryCode: String(place.country_code || place.countryCode || ""),
      timezone: String(place.timezone || ""),
      addedAt: Date.now()
    };
  }

  function isPlaceSaved(place) {
    const id = place.id ? String(place.id) : "";
    const latitude = Number(place.latitude);
    const longitude = Number(place.longitude);
    const name = normalizeCityKey(place.name);

    return state.locations.some((location) => {
      if (id && location.id === id) return true;

      const closeCoordinates = (
        Math.abs(location.latitude - latitude) < 0.025 &&
        Math.abs(location.longitude - longitude) < 0.025
      );

      return closeCoordinates && (!name || normalizeCityKey(location.name) === name);
    });
  }

  function getActiveCity() {
    try {
      const value = localStorage.getItem(STORAGE.city);
      return value && value.length < 80 ? value : "";
    } catch (error) {
      return "";
    }
  }

  function saveActiveCity(city) {
    try {
      localStorage.setItem(STORAGE.city, city);
    } catch (error) {
      /* Penyimpanan opsional. */
    }
  }

  /* =========================================================
     Rendering saved locations
     ========================================================= */

  function renderList() {
    const list = $("#locations-list");
    if (!list) return;

    list.innerHTML = state.locations.map(locationCardMarkup).join("");
    updateEmptyState();
    updateSummary();

    const searchResults = $("#search-results");
    if (!searchResults || searchResults.hidden) return;

    const query = $("#location-input");
    if (query && query.value.trim()) renderSearchResults(state.searchResults);
  }

  function locationCardMarkup(location) {
    const active = isActiveLocation(location);
    const displayName = displayLocationName(location);
    const name = escapeHtml(displayName);
    const region = escapeHtml(locationRegion(location));
    const activeBadge = active ? '<span class="city-card__active">Aktif</span>' : "";
    const removeLabel = escapeAttribute(`Hapus ${displayName} dari daftar`);
    const openLabel = escapeAttribute(`Buka cuaca ${displayName} di beranda`);
    const id = escapeAttribute(location.id);

    return `<article class="city-card glass-card is-loading${active ? " is-active" : ""}" data-id="${id}" aria-busy="true">
      <div class="city-card__glow" aria-hidden="true"></div>
      <a class="city-card__open" href="index.html" data-open-city="${escapeAttribute(displayName)}" aria-label="${openLabel}">
        <div class="city-card__top">
          <div class="city-card__place">
            <span class="city-card__pin" aria-hidden="true">${ICONS.pin}</span>
            <div class="city-card__place-copy">
              <div class="city-card__name-row">
                <h3 class="city-card__name">${name}</h3>
                ${activeBadge}
              </div>
              <p class="city-card__region">${region}</p>
            </div>
          </div>
          <div class="city-card__time">
            <span class="city-card__clock"><time data-clock>—</time><span class="city-card__zone" data-zone></span></span>
            <span class="city-card__time-label">Waktu setempat</span>
          </div>
        </div>

        <div class="city-card__body">
          <div class="city-card__weather">
            <span class="city-card__icon-shell">
              <img class="city-card__icon" src="assets/icons/partly-cloudy-day.svg" alt="" width="58" height="58">
            </span>
            <div class="city-card__weather-copy">
              <p class="city-card__condition" data-condition>Memuat cuaca…</p>
              <p class="city-card__feels" data-feels>Mengambil data terbaru</p>
            </div>
          </div>
          <div class="city-card__reading">
            <span class="city-card__temp"><span data-temp>—</span><span class="city-card__degree">°</span></span>
            <span class="city-card__range">
              <span><span class="city-card__range-arrow">H</span><span data-high>—</span></span>
              <span><span class="city-card__range-arrow">L</span><span data-low>—</span></span>
            </span>
          </div>
        </div>

        <span class="city-card__open-cue">Lihat cuaca ${ICONS.arrow}</span>
      </a>
      <button type="button" class="city-card__remove" data-remove-id="${id}" aria-label="${removeLabel}">
        ${ICONS.trash}
      </button>
    </article>`;
  }

  function isActiveLocation(location) {
    return Boolean(
      state.activeCity &&
      normalizeCityKey(location.name) === normalizeCityKey(state.activeCity)
    );
  }

  function updateEmptyState() {
    const empty = $("#locations-empty");
    const list = $("#locations-list");
    if (!empty) return;

    const isEmpty = state.locations.length === 0;
    empty.hidden = !isEmpty;
    if (list) list.hidden = isEmpty;
  }

  function getCard(id) {
    const cards = $$(".city-card", $("#locations-list") || document)
      .filter((card) => card.dataset.id === String(id));

    return cards.find((card) => !card.classList.contains("is-removing")) || cards[0] || null;
  }

  /* =========================================================
     Weather cards
     ========================================================= */

  function buildForecastUrl(location) {
    const params = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      current: "temperature_2m,apparent_temperature,is_day,weather_code",
      daily: "weather_code,temperature_2m_max,temperature_2m_min",
      timezone: "auto",
      forecast_days: "1",
      temperature_unit: "celsius"
    });

    return `${API.forecast}?${params.toString()}`;
  }

  async function loadLocationWeather(location) {
    const card = getCard(location.id);
    if (!card) return;

    const previous = state.weatherControllers.get(location.id);
    if (previous) previous.abort();

    const controller = new AbortController();
    state.weatherControllers.set(location.id, controller);
    state.pendingWeather += 1;
    card.classList.remove("is-error");
    card.classList.add("is-loading");
    card.setAttribute("aria-busy", "true");
    updateBusyState();

    try {
      const forecast = await fetchJson(buildForecastUrl(location), controller.signal);
      if (controller.signal.aborted) return;

      const view = buildCardView(location, forecast);
      updateCard(view);
      state.lastUpdated = new Date();
    } catch (error) {
      if (error && error.name === "AbortError") return;
      if (controller.signal.aborted) return;

      setCardError(location, error);
    } finally {
      state.pendingWeather = Math.max(0, state.pendingWeather - 1);

      if (state.weatherControllers.get(location.id) === controller) {
        state.weatherControllers.delete(location.id);
      }

      const currentCard = getCard(location.id);
      if (currentCard && !currentCard.classList.contains("is-loading")) {
        currentCard.setAttribute("aria-busy", "false");
      }

      updateBusyState();
      updateSummary();
    }
  }

  function buildCardView(location, forecast) {
    const current = forecast.current || {};
    const daily = forecast.daily || {};
    const isDay = Number(current.is_day) === 1;
    const weather = weatherFor(current.weather_code, isDay);
    const clock = formatClock(current.time);
    const zone = String(forecast.timezone_abbreviation || "").trim();
    const high = daily.temperature_2m_max ? daily.temperature_2m_max[0] : null;
    const low = daily.temperature_2m_min ? daily.temperature_2m_min[0] : null;

    return {
      location,
      weather,
      clock,
      zone,
      temperature: current.temperature_2m,
      apparent: current.apparent_temperature,
      high,
      low,
      datetime: typeof current.time === "string" ? current.time : ""
    };
  }

  function updateCard(view) {
    const card = getCard(view.location.id);
    if (!card) return;

    const set = (selector, value) => {
      const element = card.querySelector(selector);
      if (element) element.textContent = value;
    };

    set("[data-temp]", formatTempNumber(view.temperature));
    set("[data-condition]", view.weather.label);
    set("[data-feels]", view.apparent === null || view.apparent === undefined ? "Suhu terasa tidak tersedia" : `Terasa seperti ${formatTemp(view.apparent)}`);
    set("[data-high]", formatTemp(view.high));
    set("[data-low]", formatTemp(view.low));
    set("[data-clock]", view.clock);
    set("[data-zone]", view.zone);

    const time = card.querySelector("[data-clock]");
    if (time && view.datetime) time.dateTime = view.datetime;
    if (time && !view.datetime) time.removeAttribute("datetime");

    const icon = card.querySelector(".city-card__icon");
    if (icon) icon.src = iconPath(view.weather.icon);

    const link = card.querySelector(".city-card__open");
    if (link) {
      link.setAttribute(
        "aria-label",
        `Buka cuaca ${displayLocationName(view.location)}, ${view.weather.label}, ${formatTemp(view.temperature)} di beranda`
      );
    }

    card.style.setProperty("--weather-tint", WEATHER_TINTS[view.weather.icon] || "rgba(96, 165, 250, 0.20)");
    card.classList.remove("is-loading", "is-error");
    card.setAttribute("aria-busy", "false");
  }

  function setCardError(location, error) {
    const card = getCard(location.id);
    if (!card) return;

    const set = (selector, value) => {
      const element = card.querySelector(selector);
      if (element) element.textContent = value;
    };

    set("[data-temp]", "—");
    set("[data-condition]", "Cuaca tidak tersedia");
    set("[data-feels]", navigator.onLine ? "Perbarui untuk mencoba lagi" : "Kamu sedang offline");
    set("[data-high]", "—");
    set("[data-low]", "—");
    set("[data-clock]", "—");
    set("[data-zone]", "");

    card.classList.remove("is-loading");
    card.classList.add("is-error");
    card.setAttribute("aria-busy", "false");

    if (error && error.name !== "TimeoutError") {
      console.warn("NandaSky locations:", error);
    }
  }

  async function refreshAll(options = {}) {
    if (!state.locations.length) {
      updateSummary();
      updateBusyState();
      return;
    }

    await Promise.allSettled(state.locations.map((location) => loadLocationWeather(location)));

    if (!options.quiet) state.lastUpdated = new Date();
    updateSummary();
    updateBusyState();
  }

  function initRefresh() {
    const button = $("#refresh-locations");
    if (!button) return;

    button.addEventListener("click", () => {
      if (state.pendingWeather > 0 || !state.locations.length) return;
      refreshAll();
    });
  }

  function updateBusyState() {
    const busy = state.pendingWeather > 0;
    document.body.classList.toggle("is-loading", busy);

    const button = $("#refresh-locations");
    if (button) {
      button.classList.toggle("is-loading", busy);
      button.disabled = busy || state.locations.length === 0;
      button.setAttribute("aria-busy", String(busy));
    }
  }

  function updateSummary() {
    const count = state.locations.length;
    const countElement = $("#locations-count");
    const limitElement = $("#locations-limit");
    const subtitle = $("#saved-subtitle");

    if (countElement) countElement.textContent = String(count);
    if (limitElement) limitElement.textContent = `${count} / ${MAX_LOCATIONS}`;

    if (!subtitle) return;

    if (!count) {
      subtitle.textContent = state.booted ? "Belum ada lokasi. Tambahkan kota pertamamu." : "Menyiapkan daftar lokasi…";
      return;
    }

    if (state.pendingWeather > 0) {
      subtitle.textContent = `Memperbarui cuaca ${count} lokasi…`;
      return;
    }

    if (state.lastUpdated) {
      subtitle.textContent = `${count} lokasi · diperbarui ${formatUpdatedTime(state.lastUpdated)}`;
      return;
    }

    subtitle.textContent = `${count} lokasi tersimpan`;
  }

  function setSavedSubtitle(message) {
    const subtitle = $("#saved-subtitle");
    if (subtitle) subtitle.textContent = message;
  }

  /* =========================================================
     Add, remove and undo
     ========================================================= */

  function initListActions() {
    const list = $("#locations-list");
    if (!list) return;

    list.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const removeButton = target.closest("[data-remove-id]");
      if (removeButton) {
        event.preventDefault();
        removeLocation(removeButton.dataset.removeId);
        return;
      }

      const openLink = target.closest("[data-open-city]");
      if (openLink) {
        saveActiveCity(openLink.dataset.openCity || "");
      }
    });

    const emptyButton = $("#empty-add");
    if (emptyButton) {
      emptyButton.addEventListener("click", () => {
        const input = $("#location-input");
        if (!input) return;
        input.focus({ preventScroll: true });
        $("#tambah")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }

  function addPlace(place) {
    if (state.locations.length >= MAX_LOCATIONS) {
      setFeedback(`Kamu bisa menyimpan maksimal ${MAX_LOCATIONS} lokasi. Hapus satu lokasi untuk menambah yang baru.`, "error");
      return false;
    }

    if (isPlaceSaved(place)) {
      setFeedback(`${displayLocationName(place)} sudah ada di daftar lokasi.`, "error");
      return false;
    }

    const location = toLocation(place);
    const wasEmpty = state.locations.length === 0;
    state.locations.push(location);
    saveLocations();

    if (wasEmpty) {
      const empty = $("#locations-empty");
      if (empty) empty.hidden = true;
      const list = $("#locations-list");
      if (list) list.hidden = false;
    }

    const list = $("#locations-list");
    if (list) list.insertAdjacentHTML("beforeend", locationCardMarkup(location));

    updateEmptyState();
    updateSummary();
    updateBusyState();
    loadLocationWeather(location);
    return true;
  }

  function removeLocation(id) {
    const index = state.locations.findIndex((location) => location.id === String(id));
    if (index === -1) return;

    completePendingDelete();

    const [location] = state.locations.splice(index, 1);
    saveLocations();

    const card = getCard(location.id);
    const previousDelete = { location, index, card, timeout: null };
    state.pendingDelete = previousDelete;

    if (card) card.classList.add("is-removing");

    const refreshButton = $("#refresh-locations");
    if (refreshButton && state.pendingWeather === 0) refreshButton.disabled = state.locations.length === 0;

    updateSummary();
    showToast(`${displayLocationName(location)} dihapus dari daftar.`, true);

    window.setTimeout(() => {
      if (state.pendingDelete === previousDelete) updateEmptyState();
    }, 240);

    previousDelete.timeout = window.setTimeout(() => {
      if (card) card.remove();
      if (state.pendingDelete === previousDelete) state.pendingDelete = null;
      updateEmptyState();
      updateSummary();
      updateBusyState();
      hideToast();
    }, 6000);
  }

  function completePendingDelete() {
    const pending = state.pendingDelete;
    if (!pending) return;

    window.clearTimeout(pending.timeout);
    if (pending.card) pending.card.remove();
    state.pendingDelete = null;
    updateEmptyState();
    updateSummary();
    updateBusyState();
  }

  function undoDelete() {
    const pending = state.pendingDelete;
    if (!pending) return;

    window.clearTimeout(pending.timeout);
    state.pendingDelete = null;

    const alreadySaved = isPlaceSaved(pending.location);
    if (!alreadySaved) {
      state.locations.splice(Math.min(pending.index, state.locations.length), 0, pending.location);
      saveLocations();
    }

    if (pending.card) {
      if (alreadySaved) {
        pending.card.remove();
      } else {
        pending.card.classList.remove("is-removing");
      }
    }

    updateEmptyState();
    updateSummary();
    updateBusyState();
    hideToast();
    state.lastUpdated = new Date();
    updateSummary();
  }

  function initToast() {
    const undo = $("#toast-undo");
    if (!undo) return;

    undo.addEventListener("click", undoDelete);

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !state.pendingDelete) return;
      completePendingDelete();
      hideToast();
    });
  }

  function showToast(message, withUndo = false) {
    const toast = $("#toast");
    const text = $("#toast-message");
    const undo = $("#toast-undo");
    if (!toast || !text) return;

    window.clearTimeout(state.toastTimer);
    text.textContent = message;
    if (undo) undo.hidden = !withUndo;
    toast.hidden = false;

    if (!withUndo) {
      state.toastTimer = window.setTimeout(() => {
        toast.hidden = true;
      }, 4200);
    }
  }

  function hideToast() {
    const toast = $("#toast");
    window.clearTimeout(state.toastTimer);
    if (toast) toast.hidden = true;
  }

  /* =========================================================
     Search
     ========================================================= */

  function initSearch() {
    const form = $("#location-search");
    const input = $("#location-input");
    if (!form || !input) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = input.value.trim();

      if (!query) {
        setFeedback("Masukkan nama kota atau negara terlebih dahulu.", "error");
        input.focus();
        return;
      }

      if (query.length < 2) {
        setFeedback("Ketik minimal dua huruf untuk mencari.", "error");
        input.focus();
        return;
      }

      searchPlaces(query);
    });

    input.addEventListener("input", () => {
      const feedback = $("#search-feedback");
      if (feedback) feedback.classList.remove("is-error");

      if (!input.value.trim()) hideSearchResults();
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        hideSearchResults();
        input.blur();
      }
    });

    $$(".quick-city").forEach((button) => {
      button.addEventListener("click", () => {
        const query = button.dataset.query;
        if (!query) return;
        input.value = query;
        searchPlaces(query);
      });
    });

    const results = $("#search-results");
    if (results) {
      results.addEventListener("click", (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;

        const addButton = target.closest("[data-add-result]");
        if (!addButton) return;

        const index = Number(addButton.dataset.addResult);
        const place = state.searchResults[index];
        if (!place) return;

        const result = addPlace(place);
        if (!result) return;

        addButton.disabled = true;
        addButton.innerHTML = `${ICONS.check}Tersimpan`;
        setFeedback(`${displayLocationName(place)} ditambahkan. Klik kartunya untuk membuka cuaca di beranda.`);
      });
    }
  }

  async function searchPlaces(query) {
    if (state.searchController) state.searchController.abort();
    const controller = new AbortController();
    state.searchController = controller;

    setSearchLoading(true);
    setFeedback(`Mencari “${query}”…`, "loading");
    hideSearchResults();

    try {
      const results = await geocode(query, 8, controller.signal);
      if (controller.signal.aborted) return;

      state.searchResults = results;

      if (!results.length) {
        setFeedback(`Tidak ada hasil untuk “${query}”. Coba nama lain.`, "error");
        renderSearchEmpty("Tidak ada kota yang cocok dengan pencarian ini.");
        return;
      }

      setFeedback(`${results.length} lokasi ditemukan. Pilih salah satu untuk ditambahkan.`);
      renderSearchResults(results);
    } catch (error) {
      if (error && error.name === "AbortError") return;
      if (controller.signal.aborted) return;

      hideSearchResults();
      setFeedback(
        error && error.name === "TimeoutError"
          ? "Pencarian terlalu lama merespons. Coba lagi."
          : error && error.userMessage
            ? error.userMessage
            : "Pencarian gagal. Periksa koneksi lalu coba lagi.",
        "error"
      );
    } finally {
      if (state.searchController === controller) {
        state.searchController = null;
        setSearchLoading(false);
      }
    }
  }

  async function geocode(query, count = 8, signal) {
    const params = new URLSearchParams({
      name: query,
      count: String(count),
      language: "id",
      format: "json"
    });

    const data = await fetchJson(`${API.geocoding}?${params.toString()}`, signal);
    return Array.isArray(data.results) ? data.results.filter(isValidPlace) : [];
  }

  function renderSearchResults(results) {
    const panel = $("#search-results");
    if (!panel) return;

    const rows = results.map((place, index) => {
      const saved = isPlaceSaved(place);
      const displayName = displayLocationName(place);
      const name = escapeHtml(displayName);
      const region = escapeHtml(locationRegion(place));
      const atLimit = state.locations.length >= MAX_LOCATIONS;
      const disabled = saved || atLimit;
      const actionLabel = saved ? "Tersimpan" : atLimit ? "Penuh" : "Tambah";
      const actionIcon = saved ? ICONS.check : ICONS.plus;

      return `<div class="search-result">
        <span class="search-result__pin" aria-hidden="true">${ICONS.pin}</span>
        <div class="search-result__copy">
          <p class="search-result__name">${name}</p>
          <p class="search-result__region">${region}</p>
        </div>
        <button type="button" class="search-result__add" data-add-result="${index}"${disabled ? " disabled" : ""} aria-label="${escapeAttribute(`${actionLabel} ${displayName}`)}">
          ${actionIcon}${actionLabel}
        </button>
      </div>`;
    }).join("");

    panel.innerHTML = `<div class="search-results__head">
      <span class="search-results__title">Hasil pencarian</span>
      <span class="search-results__count">${results.length} lokasi</span>
    </div>
    <div class="search-results__list">${rows}</div>`;
    panel.hidden = false;
  }

  function renderSearchEmpty(message) {
    const panel = $("#search-results");
    if (!panel) return;

    panel.innerHTML = `<div class="search-results__empty">${escapeHtml(message)}</div>`;
    panel.hidden = false;
  }

  function hideSearchResults() {
    const panel = $("#search-results");
    if (!panel) return;
    panel.hidden = true;
    panel.innerHTML = "";
    state.searchResults = [];
  }

  function setSearchLoading(loading) {
    const button = $("#location-submit");
    if (!button) return;
    button.classList.toggle("is-loading", loading);
    button.disabled = loading;
  }

  function setFeedback(message, type) {
    const feedback = $("#search-feedback");
    if (!feedback) return;

    feedback.textContent = message;
    feedback.classList.toggle("is-error", type === "error");
    feedback.classList.toggle("is-loading", type === "loading");
  }

  function isValidPlace(place) {
    return Boolean(
      place &&
      typeof place.name === "string" &&
      Number.isFinite(Number(place.latitude)) &&
      Number.isFinite(Number(place.longitude))
    );
  }

  /* =========================================================
     Networking and connectivity
     ========================================================= */

  async function fetchJson(url, signal) {
    let requestSignal = signal;

    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      const timeoutSignal = AbortSignal.timeout(15000);
      requestSignal = signal
        ? (typeof AbortSignal.any === "function" ? AbortSignal.any([signal, timeoutSignal]) : signal)
        : timeoutSignal;
    }

    const response = await fetch(url, {
      signal: requestSignal,
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw createUserError("Layanan cuaca sedang sibuk. Coba beberapa saat lagi.");
    }

    return response.json();
  }

  function createUserError(message) {
    const error = new Error(message);
    error.userMessage = message;
    return error;
  }

  function initConnectivity() {
    window.addEventListener("offline", () => {
      setFeedback("Kamu sedang offline. Periksa koneksi internet.", "error");
    });

    window.addEventListener("online", () => {
      setFeedback("Koneksi kembali. Memperbarui cuaca…");
      if (state.locations.length) refreshAll({ quiet: true });
    });
  }

  /* =========================================================
     Formatting helpers
     ========================================================= */

  function normalizeCityKey(name) {
    return String(name || "")
      .toLowerCase()
      .replace(/^(kota|kabupaten|kab\.?)\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function displayLocationName(place) {
    const name = String(place && place.name ? place.name : "").trim();
    const countryCode = String(place && (place.countryCode || place.country_code) ? (place.countryCode || place.country_code) : "").toUpperCase();
    const country = String(place && place.country ? place.country : "").toLowerCase();

    if (countryCode === "ID" || country === "indonesia") {
      const stripped = name.replace(/^(kota|kabupaten)\s+/i, "").trim();
      if (stripped && !/^administrasi\b/i.test(stripped)) return stripped;
    }

    return name;
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function formatTemp(value) {
    const number = toNumber(value);
    return number === null ? "—" : `${Math.round(number)}°`;
  }

  function formatTempNumber(value) {
    const number = toNumber(value);
    return number === null ? "—" : String(Math.round(number));
  }

  function formatClock(iso) {
    if (!iso || typeof iso !== "string" || iso.length < 16) return "—";
    return iso.slice(11, 16);
  }

  function formatUpdatedTime(date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  function placeRegion(place) {
    const name = normalizeCityKey(place.name);
    const parts = [place.admin1, place.country].filter(Boolean);
    const unique = parts.filter((part, index) => {
      const normalized = normalizeCityKey(part);
      return normalized !== name && parts.findIndex((item) => normalizeCityKey(item) === normalized) === index;
    });

    return unique.join(", ");
  }

  function locationRegion(place) {
    const region = placeRegion(place);
    if (region) return region;

    const name = normalizeCityKey(place.name);
    const country = normalizeCityKey(place.country);
    if (country && country === name) return "Negara";
    return String(place.country || "").trim() || "Lokasi tersimpan";
  }

  function weatherFor(code, isDay) {
    const entry = WEATHER_CODES[Number(code)] || WEATHER_CODES.default;
    const icon = Array.isArray(entry.icon) ? entry.icon[isDay ? 0 : 1] : entry.icon;
    return { label: entry.label, icon };
  }

  function iconPath(slug) {
    return `assets/icons/${slug}.svg`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
})();
