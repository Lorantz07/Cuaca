(() => {
  "use strict";

  const API = {
    geocoding: "https://geocoding-api.open-meteo.com/v1/search",
    forecast: "https://api.open-meteo.com/v1/forecast",
    airQuality: "https://air-quality-api.open-meteo.com/v1/air-quality"
  };

  const DEFAULT_CITY = "Jakarta";
  const STORAGE = {
    theme: "weathernow:theme",
    city: "weathernow:city"
  };

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
    "clear-day": "rgba(251, 191, 36, 0.20)",
    "clear-night": "rgba(129, 140, 248, 0.20)",
    "partly-cloudy-day": "rgba(147, 197, 253, 0.18)",
    "partly-cloudy-night": "rgba(129, 140, 248, 0.17)",
    overcast: "rgba(148, 163, 184, 0.16)",
    fog: "rgba(203, 213, 225, 0.15)",
    drizzle: "rgba(96, 165, 250, 0.18)",
    rain: "rgba(59, 130, 246, 0.21)",
    sleet: "rgba(125, 211, 252, 0.18)",
    snow: "rgba(226, 232, 240, 0.20)",
    thunderstorms: "rgba(167, 139, 250, 0.24)",
    hail: "rgba(192, 132, 252, 0.22)"
  };

  const AQI_LEVELS = [
    { max: 50, label: "Baik", className: "good" },
    { max: 100, label: "Sedang", className: "moderate" },
    { max: 150, label: "Tidak Sehat bagi Sensitif", className: "sensitive" },
    { max: 200, label: "Tidak Sehat", className: "unhealthy" },
    { max: 300, label: "Sangat Tidak Sehat", className: "very-unhealthy" },
    { max: Infinity, label: "Berbahaya", className: "hazardous" }
  ];

  const AQI_CLASSES = [
    "aqi--good",
    "aqi--moderate",
    "aqi--sensitive",
    "aqi--unhealthy",
    "aqi--very-unhealthy",
    "aqi--hazardous",
    "aqi--unknown"
  ];

  const DROP_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3s5 5.2 5 9a5 5 0 0 1-10 0c0-3.8 5-9 5-9Z"></path></svg>';

  const numberFormatter = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1
  });

  const dateFormatters = new Map();

  const state = {
    controller: null,
    lastQuery: "",
    lastData: null,
    hourlyTemps: [],
    resizeTimer: null
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
    initMenu();
    initSearch();
    initKeyboardScrollers();
    initScrollSpy();
    initResize();

    const year = $("#current-year");
    if (year) year.textContent = String(new Date().getFullYear());

    const savedCity = getSavedCity();
    const city = savedCity || DEFAULT_CITY;
    setActiveChip(city);
    loadCity(city, { initial: true });
  }

  /* =========================================================
     Theme
     ========================================================= */

  function initTheme() {
    const current = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    applyTheme(current, false);

    $$(".theme-switch__btn").forEach((button) => {
      button.addEventListener("click", () => {
        applyTheme(button.dataset.themeValue, true);
      });
    });
  }

  function applyTheme(theme, persist) {
    const next = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = next;

    $$(".theme-switch__btn").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.themeValue === next));
    });

    const meta = $("#theme-color");
    if (meta) {
      meta.setAttribute("content", next === "light" ? "#dfefff" : "#071226");
    }

    if (persist) {
      try {
        localStorage.setItem(STORAGE.theme, next);
      } catch (error) {
        /* localStorage bisa diblokir; tema tetap berfungsi untuk sesi ini. */
      }
    }
  }

  /* =========================================================
     Header, menu, scroll spy
     ========================================================= */

  function initHeader() {
    const header = $(".site-header");
    if (!header) return;

    const update = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function initMenu() {
    const toggle = $("#menu-toggle");
    const nav = $("#primary-nav");
    if (!toggle || !nav) return;

    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
    };

    toggle.addEventListener("click", () => {
      setOpen(!nav.classList.contains("is-open"));
    });

    nav.addEventListener("click", (event) => {
      if (event.target instanceof Element && event.target.closest("a")) {
        setOpen(false);
      }
    });

    document.addEventListener("click", (event) => {
      if (!nav.classList.contains("is-open")) return;
      if (!(event.target instanceof Node)) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      setOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !nav.classList.contains("is-open")) return;
      setOpen(false);
      toggle.focus();
    });

    const desktop = window.matchMedia("(min-width: 901px)");
    const onChange = (event) => {
      if (event.matches) setOpen(false);
    };

    if (typeof desktop.addEventListener === "function") {
      desktop.addEventListener("change", onChange);
    } else {
      desktop.addListener(onChange);
    }
  }

  function initScrollSpy() {
    const links = $$(".nav__link");
    const sections = ["current", "hourly", "daily"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!links.length || !sections.length) return;

    let ticking = false;

    const update = () => {
      ticking = false;
      const marker = window.scrollY + window.innerHeight * 0.32;
      let active = "top";

      if (window.scrollY > 80) {
        sections.forEach((section) => {
          const top = section.getBoundingClientRect().top + window.scrollY;
          if (top <= marker) active = section.id;
        });
      }

      links.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${active}`);
      });
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
  }

  function initKeyboardScrollers() {
    const scroller = $("#hourly-scroller");
    if (!scroller) return;

    scroller.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      scroller.scrollBy({
        left: event.key === "ArrowRight" ? 180 : -180,
        behavior: "smooth"
      });
    });
  }

  /* =========================================================
     Search and data loading
     ========================================================= */

  function initSearch() {
    const form = $("#search-form");
    const input = $("#city-input");
    if (!form || !input) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = input.value.trim();

      if (!query) {
        setStatus("Masukkan nama kota terlebih dahulu.", "error");
        input.focus();
        return;
      }

      loadCity(query);
    });

    $$(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const city = chip.dataset.city;
        if (!city) return;
        input.value = city;
        loadCity(city);
      });
    });

    window.addEventListener("online", () => {
      if (state.lastQuery) loadCity(state.lastQuery);
    });

    window.addEventListener("offline", () => {
      setStatus("Kamu sedang offline. Periksa koneksi internet.", "error");
    });
  }

  async function loadCity(query, options = {}) {
    const normalized = String(query || "").trim();
    if (!normalized) return;

    state.lastQuery = normalized;

    if (state.controller) state.controller.abort();
    const controller = new AbortController();
    state.controller = controller;
    const { signal } = controller;

    setLoading(true);
    setStatus(options.initial ? `Memuat cuaca ${normalized}…` : `Mencari ${normalized}…`);

    try {
      const geocodingUrl = `${API.geocoding}?name=${encodeURIComponent(normalized)}&count=1&language=id&format=json`;
      const geocoding = await fetchJson(geocodingUrl, signal);

      if (signal.aborted) return;

      const place = Array.isArray(geocoding.results) ? geocoding.results[0] : null;
      if (!place) {
        throw createUserError("Kota tidak ditemukan. Coba nama kota lain.");
      }

      setStatus(`Memuat cuaca ${place.name}…`);

      const [forecastResult, airResult] = await Promise.allSettled([
        fetchJson(buildForecastUrl(place), signal),
        fetchJson(buildAirUrl(place), signal)
      ]);

      if (signal.aborted) return;

      if (forecastResult.status === "rejected") {
        throw forecastResult.reason;
      }

      const forecast = forecastResult.value;
      const air = airResult.status === "fulfilled" ? airResult.value : null;
      const view = buildView(place, forecast, air);

      renderView(view);
      state.lastData = view;

      const displayName = canonicalCityName(place.name);
      saveCity(displayName || place.name);
      setActiveChip(displayName || place.name);

      const input = $("#city-input");
      if (input) input.value = "";

      setStatus(`Diperbarui pukul ${formatClock(view.current.time)} waktu setempat.`);
    } catch (error) {
      if (error && error.name === "AbortError") return;
      if (signal.aborted) return;

      console.error("WeatherNow:", error);

      let message = "Gagal memuat data cuaca. Periksa koneksi lalu coba lagi.";
      if (error && error.name === "TimeoutError") {
        message = "Layanan cuaca terlalu lama merespons. Coba lagi.";
      } else if (error && error.userMessage) {
        message = error.userMessage;
      }

      if (state.lastData) {
        setStatus(`Gagal memperbarui data. ${message}`, "error");
      } else {
        setStatus(message, "error");
        renderEmptyState(normalized);
      }
    } finally {
      if (state.controller === controller) {
        state.controller = null;
        setLoading(false);
      }
    }
  }

  async function fetchJson(url, signal) {
    let requestSignal = signal;

    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      const timeoutSignal = AbortSignal.timeout(15000);
      requestSignal = typeof AbortSignal.any === "function"
        ? AbortSignal.any([signal, timeoutSignal])
        : signal;
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

  function buildForecastUrl(place) {
    const params = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,surface_pressure",
      hourly: "temperature_2m,weather_code,precipitation_probability,visibility,uv_index",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset",
      timezone: "auto",
      forecast_days: "7",
      wind_speed_unit: "kmh",
      precipitation_unit: "mm"
    });

    return `${API.forecast}?${params.toString()}`;
  }

  function buildAirUrl(place) {
    const params = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      current: "us_aqi,pm2_5",
      timezone: "auto"
    });

    return `${API.airQuality}?${params.toString()}`;
  }

  function createUserError(message) {
    const error = new Error(message);
    error.userMessage = message;
    return error;
  }

  /* =========================================================
     View model
     ========================================================= */

  function buildView(place, forecast, air) {
    const current = forecast.current || {};
    const hourly = forecast.hourly || {};
    const daily = forecast.daily || {};
    const startIndex = findHourIndex(hourly.time, current.time);
    const weather = weatherFor(current.weather_code, Number(current.is_day) === 1);
    const rainNow = clampNumber(hourly.precipitation_probability && hourly.precipitation_probability[startIndex], 0, 100);
    const uvNow = Math.round(numberOr(hourly.uv_index && hourly.uv_index[startIndex], 0));
    const uvMax = Math.round(numberOr(daily.uv_index_max && daily.uv_index_max[0], 0));
    const aqi = getAqi(air);
    const hours = buildHours(hourly, daily, startIndex, 24);
    const today = {
      date: daily.time && daily.time[0],
      max: daily.temperature_2m_max && daily.temperature_2m_max[0],
      min: daily.temperature_2m_min && daily.temperature_2m_min[0],
      sunrise: daily.sunrise && daily.sunrise[0],
      sunset: daily.sunset && daily.sunset[0]
    };

    return {
      place,
      current,
      hourly,
      daily,
      weather,
      startIndex,
      region: placeRegion(place),
      rainNow,
      uvNow,
      uvMax,
      aqi,
      hours,
      today,
      tip: buildTip(current, weather, rainNow, uvNow, aqi)
    };
  }

  function buildHours(hourly, daily, startIndex, count) {
    const times = hourly.time || [];
    const result = [];

    for (let i = 0; i < count; i += 1) {
      const index = startIndex + i;
      if (index >= times.length) break;

      const time = times[index];
      const code = hourly.weather_code && hourly.weather_code[index];
      const hourWeather = weatherFor(code, isDayAt(time, daily));

      result.push({
        time,
        label: i === 0 ? "Sekarang" : formatClock(time),
        temp: numberOr(hourly.temperature_2m && hourly.temperature_2m[index], 0),
        rain: clampNumber(hourly.precipitation_probability && hourly.precipitation_probability[index], 0, 100),
        weather: hourWeather
      });
    }

    return result;
  }

  function findHourIndex(times, currentIso) {
    if (!Array.isArray(times) || !times.length) return 0;

    const needle = String(currentIso || "").slice(0, 13);
    if (!needle) return 0;

    const index = times.findIndex((time) => time.slice(0, 13) >= needle);
    return index === -1 ? 0 : index;
  }

  function isDayAt(isoTime, daily) {
    if (!isoTime || !Array.isArray(daily.time)) return true;

    const date = isoTime.slice(0, 10);
    const index = daily.time.indexOf(date);
    if (index === -1) return true;

    const sunrise = daily.sunrise && daily.sunrise[index];
    const sunset = daily.sunset && daily.sunset[index];
    if (!sunrise || !sunset) return true;

    const clock = isoTime.slice(11, 16);
    return clock >= sunrise.slice(11, 16) && clock < sunset.slice(11, 16);
  }

  function weatherFor(code, isDay) {
    const entry = WEATHER_CODES[Number(code)] || WEATHER_CODES.default;
    const icon = Array.isArray(entry.icon) ? entry.icon[isDay ? 0 : 1] : entry.icon;
    return { label: entry.label, icon };
  }

  function getAqi(air) {
    const raw = air && air.current ? air.current.us_aqi : null;
    const value = toNumber(raw);
    const pm25 = air && air.current ? toNumber(air.current.pm2_5) : null;

    if (value === null) return null;

    const level = AQI_LEVELS.find((item) => value <= item.max) || AQI_LEVELS[AQI_LEVELS.length - 1];

    return {
      value: Math.round(value),
      label: level.label,
      className: level.className,
      pm25
    };
  }

  function buildTip(current, weather, rain, uv, aqi) {
    const temperature = numberOr(current.temperature_2m, 0);
    const wind = numberOr(current.wind_speed_10m, 0);

    if (weather.icon === "thunderstorms" || weather.icon === "hail") {
      return { icon: "thunderstorms", text: "Ada potensi badai petir. Sebaiknya tetap di dalam ruangan." };
    }

    if (weather.icon === "snow" || weather.icon === "sleet") {
      return { icon: "snow", text: "Ada salju atau hujan beku. Gunakan pakaian hangat dan hati-hati di jalan." };
    }

    if (rain >= 60) {
      return { icon: "umbrella", text: "Bawa payung—peluang hujan cukup tinggi hari ini." };
    }

    if (aqi && aqi.value >= 150) {
      return { icon: "fog", text: "Kualitas udara tidak sehat. Batasi aktivitas di luar ruangan dan gunakan masker." };
    }

    if (uv >= 6) {
      return { icon: "clear-day", text: "UV cukup tinggi. Gunakan tabir surya sebelum beraktivitas." };
    }

    if (temperature >= 33) {
      return { icon: "clear-day", text: "Cuaca cukup panas. Pastikan minum air yang cukup." };
    }

    if (wind >= 30) {
      return { icon: "wind", text: "Angin cukup kencang. Hati-hati saat berkendara." };
    }

    if (weather.icon === "fog") {
      return { icon: "fog", text: "Jarak pandang terbatas. Berkendara dengan hati-hati." };
    }

    if (aqi && aqi.value >= 100) {
      return { icon: "fog", text: "Kualitas udara kurang baik. Pertimbangkan memakai masker saat keluar." };
    }

    if (rain >= 30) {
      return { icon: "umbrella", text: "Ada kemungkinan hujan ringan. Siapkan payung untuk berjaga-jaga." };
    }

    if (Number(current.is_day) === 0) {
      return { icon: "clear-night", text: "Malam ini cuacanya cukup tenang. Waktu yang nyaman untuk beristirahat." };
    }

    return { icon: "partly-cloudy-day", text: "Cuaca bersahabat. Waktu yang baik untuk beraktivitas di luar." };
  }

  /* =========================================================
     Rendering
     ========================================================= */

  function renderView(view) {
    renderCurrent(view);
    renderHourly(view);
    renderDaily(view);
    renderDetails(view);
    renderAir(view);
    renderTip(view);

    const hourlyPlaceholder = $("#hourly-placeholder");
    const dailyPlaceholder = $("#daily-placeholder");
    if (hourlyPlaceholder) hourlyPlaceholder.hidden = true;
    if (dailyPlaceholder) dailyPlaceholder.hidden = true;

    setBusy("hourly", false);
    setBusy("daily", false);
    setBusy("aqi-card", false);
    setBusy("current", false);
  }

  function renderCurrent(view) {
    const { place, current, weather, today, region, rainNow } = view;

    setText("#current-city", canonicalCityName(place.name) || "—");
    setText("#current-region", region || place.country || "Lokasi");
    setText("#current-temp", formatTempNumber(current.temperature_2m));
    setText("#current-condition", weather.label);
    setText("#current-feels", formatTemp(current.apparent_temperature, true));

    const humidity = toNumber(current.relative_humidity_2m);
    const wind = toNumber(current.wind_speed_10m);

    setText("#current-humidity", humidity === null ? "—" : `${Math.round(humidity)}%`);
    setText("#current-wind", wind === null ? "—" : `${Math.round(wind)} km/jam`);
    setText("#current-rain", `${Math.round(rainNow)}%`);
    setText("#current-high", formatTemp(today.max));
    setText("#current-low", formatTemp(today.min));

    const dateIso = String(current.time || today.date || "").slice(0, 10);
    const date = $("#current-date");
    if (date) {
      date.textContent = dateIso ? formatFullDate(dateIso) : "—";
      date.dateTime = dateIso;
    }

    const icon = $("#current-icon");
    if (icon) {
      icon.src = iconPath(weather.icon);
      icon.alt = "";
    }

    const card = $("#current");
    if (card) {
      card.style.setProperty("--weather-tint", WEATHER_TINTS[weather.icon] || "rgba(96, 165, 250, 0.18)");
    }
  }

  function renderHourly(view) {
    const items = $("#hourly-items");
    if (!items) return;

    items.innerHTML = view.hours.map((hour, index) => {
      const aria = `${index === 0 ? "Sekarang" : formatClock(hour.time)}, ${hour.weather.label}, ${Math.round(hour.temp)} derajat, peluang hujan ${Math.round(hour.rain)} persen`;
      return `<div class="hourly__item${index === 0 ? " is-now" : ""}" aria-label="${escapeAttribute(aria)}">
        <span class="hourly__time">${escapeHtml(hour.label)}</span>
        <img class="hourly__icon" src="${iconPath(hour.weather.icon)}" alt="" width="43" height="43">
        <span class="hourly__temp">${formatTemp(hour.temp)}</span>
      </div>`;
    }).join("");

    const placeText = [view.place.name, view.place.country].filter(Boolean).join(", ");
    setText("#hourly-sub", placeText || "Lokasi saat ini");

    const scroller = $("#hourly-scroller");
    if (scroller) scroller.scrollLeft = 0;

    state.hourlyTemps = view.hours.map((hour) => hour.temp);
    window.requestAnimationFrame(() => renderChart(state.hourlyTemps));
  }

  function renderDaily(view) {
    const grid = $("#daily-grid");
    if (!grid || !Array.isArray(view.daily.time)) return;

    grid.innerHTML = view.daily.time.map((date, index) => {
      const weather = weatherFor(view.daily.weather_code && view.daily.weather_code[index], true);
      const max = view.daily.temperature_2m_max && view.daily.temperature_2m_max[index];
      const min = view.daily.temperature_2m_min && view.daily.temperature_2m_min[index];
      const rain = clampNumber(view.daily.precipitation_probability_max && view.daily.precipitation_probability_max[index], 0, 100);
      const dayLabel = index === 0 ? "Hari ini" : formatDay(date);
      const dateLabel = formatShortDate(date);
      const longDate = formatLongDate(date);
      const aria = `${index === 0 ? "Hari ini, " : ""}${longDate}, ${weather.label}, peluang hujan ${Math.round(rain)} persen, suhu ${Math.round(numberOr(min, 0))} sampai ${Math.round(numberOr(max, 0))} derajat`;

      return `<article class="daily__card${index === 0 ? " is-today" : ""}" aria-label="${escapeAttribute(aria)}">
        <span class="daily__day">${escapeHtml(dayLabel)}</span>
        <span class="daily__date">${escapeHtml(dateLabel)}</span>
        <img class="daily__icon" src="${iconPath(weather.icon)}" alt="" width="38" height="38">
        <span class="daily__rain">${DROP_ICON}${Math.round(rain)}%</span>
        <span class="daily__temps"><span class="daily__max">${formatTemp(max)}</span><span class="daily__min">${formatTemp(min)}</span></span>
      </article>`;
    }).join("");

    const placeText = [view.place.name, view.place.country].filter(Boolean).join(", ");
    setText("#daily-sub", placeText || "Lokasi saat ini");

    const scroller = $("#daily-scroller");
    if (scroller) scroller.scrollLeft = 0;
  }

  function renderDetails(view) {
    const pressure = toNumber(view.current.surface_pressure);
    const visibility = view.hourly.visibility && view.hourly.visibility[view.startIndex];

    setText("#detail-pressure", pressure === null ? "—" : `${Math.round(pressure)} hPa`);
    setText("#detail-uv", Number.isFinite(view.uvMax) ? String(view.uvMax) : "—");
    setText("#detail-visibility", formatVisibility(visibility));
    setText("#detail-sunrise", formatClock(view.today.sunrise));
    setText("#detail-sunset", formatClock(view.today.sunset));

    const badge = $("#detail-uv-badge");
    if (badge) {
      const info = uvInfo(view.uvMax);
      badge.textContent = info.label;
      badge.className = `uv-badge ${info.className}`;
    }
  }

  function renderAir(view) {
    const card = $("#aqi-card");
    if (!card) return;

    card.classList.remove(...AQI_CLASSES);

    if (!view.aqi) {
      card.classList.add("aqi--unknown");
      setText("#aqi-value", "—");
      setText("#aqi-label", "Tidak tersedia");
      setText("#aqi-note", "Data kualitas udara tidak tersedia.");
      const emptyFill = $("#aqi-fill");
      if (emptyFill) emptyFill.style.width = "0%";
      return;
    }

    const { aqi } = view;
    card.classList.add(`aqi--${aqi.className}`);
    setText("#aqi-value", String(aqi.value));
    setText("#aqi-label", aqi.label);
    setText(
      "#aqi-note",
      aqi.pm25 === null ? "US AQI · Open-Meteo" : `PM2.5 · ${numberFormatter.format(aqi.pm25)} µg/m³`
    );

    const fill = $("#aqi-fill");
    if (fill) {
      const width = Math.min(Math.max((aqi.value / 200) * 100, 4), 100);
      fill.style.width = `${width}%`;
    }
  }

  function renderTip(view) {
    const icon = $("#tip-icon");
    if (icon) icon.src = iconPath(view.tip.icon);
    setText("#tip-text", view.tip.text);
  }

  function renderEmptyState(query) {
    setText("#current-city", query || "—");
    setText("#current-region", "Data tidak tersedia");
    setText("#current-condition", "Gagal memuat data");
    setText("#current-temp", "—");
    setText("#current-feels", "—");
    setText("#current-high", "—");
    setText("#current-low", "—");
    setText("#current-humidity", "—");
    setText("#current-wind", "—");
    setText("#current-rain", "—");
    setText("#current-date", "—");
    setText("#hourly-placeholder", "Data prakiraan per jam tidak tersedia.");
    setText("#daily-placeholder", "Data prakiraan 7 hari tidak tersedia.");
    setText("#aqi-label", "Tidak tersedia");
    setText("#aqi-note", "Data kualitas udara tidak tersedia.");
    setText("#tip-text", "Tidak ada saran saat ini.");

    const tipIcon = $("#tip-icon");
    if (tipIcon) tipIcon.src = iconPath("fog");
  }

  /* =========================================================
     Hourly chart
     ========================================================= */

  function renderChart(temperatures) {
    const svg = $("#hourly-chart");
    const track = $("#hourly-track");
    const items = $$(".hourly__item");

    if (!svg || !track || items.length < 2 || temperatures.length < 2) {
      if (svg) svg.innerHTML = "";
      return;
    }

    const trackRect = track.getBoundingClientRect();
    const width = Math.max(trackRect.width, 1);
    const height = 64;
    const paddingY = 9;
    const min = Math.min(...temperatures);
    const max = Math.max(...temperatures);
    const flat = Math.abs(max - min) < 0.01;
    const span = Math.max(max - min, 1);

    const points = items.map((item, index) => {
      const rect = item.getBoundingClientRect();
      const x = rect.left - trackRect.left + rect.width / 2;
      const y = flat
        ? height / 2
        : paddingY + (1 - (temperatures[index] - min) / span) * (height - paddingY * 2);

      return { x, y };
    });

    const line = smoothPath(points);
    const area = `${line} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.innerHTML = `
      <defs>
        <linearGradient id="chart-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#7dd3fc"></stop>
          <stop offset="0.55" stop-color="#a78bfa"></stop>
          <stop offset="1" stop-color="#f0abfc"></stop>
        </linearGradient>
        <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#a78bfa" stop-opacity="0.30"></stop>
          <stop offset="1" stop-color="#a78bfa" stop-opacity="0"></stop>
        </linearGradient>
      </defs>
      <path class="chart-area" d="${area}"></path>
      <path class="chart-line" d="${line}" pathLength="1"></path>
      ${points.map((point, index) => `<circle class="chart-dot${index === 0 ? " chart-dot--now" : ""}" cx="${point.x}" cy="${point.y}" r="${index === 0 ? 3.4 : 2.3}"></circle>`).join("")}
    `;
  }

  function smoothPath(points) {
    let path = `M ${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i += 1) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    return path;
  }

  function initResize() {
    window.addEventListener("resize", () => {
      if (!state.hourlyTemps.length) return;
      window.clearTimeout(state.resizeTimer);
      state.resizeTimer = window.setTimeout(() => renderChart(state.hourlyTemps), 140);
    }, { passive: true });
  }

  /* =========================================================
     UI helpers
     ========================================================= */

  function setLoading(loading) {
    document.body.classList.toggle("is-loading", loading);

    const button = $(".search__submit");
    if (button) {
      button.classList.toggle("is-loading", loading);
      button.disabled = loading;
    }

    ["current", "hourly", "daily", "aqi-card"].forEach((id) => setBusy(id, loading));
  }

  function setBusy(id, busy) {
    const element = document.getElementById(id);
    if (element) element.setAttribute("aria-busy", String(busy));
  }

  function setStatus(message, type) {
    const status = $("#search-status");
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", type === "error");
  }

  function setText(selector, text) {
    const element = $(selector);
    if (element) element.textContent = text;
  }

  function normalizeCityKey(name) {
    return String(name || "")
      .toLowerCase()
      .replace(/^(kota|kabupaten|kab\.?)\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function canonicalCityName(name) {
    const raw = String(name || "").trim();
    const key = normalizeCityKey(raw);
    if (!key) return raw;

    const chip = $$(".chip").find((item) => normalizeCityKey(item.dataset.city) === key);
    return chip ? chip.dataset.city : raw;
  }

  function setActiveChip(city) {
    const target = normalizeCityKey(city);
    $$(".chip").forEach((chip) => {
      chip.classList.toggle("is-active", normalizeCityKey(chip.dataset.city) === target);
    });
  }

  function getSavedCity() {
    try {
      const value = localStorage.getItem(STORAGE.city);
      return value && value.length < 80 ? value : null;
    } catch (error) {
      return null;
    }
  }

  function saveCity(city) {
    try {
      localStorage.setItem(STORAGE.city, city);
    } catch (error) {
      /* Tidak masalah jika penyimpanan diblokir. */
    }
  }

  /* =========================================================
     Formatting helpers
     ========================================================= */

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function numberOr(value, fallback = 0) {
    const number = toNumber(value);
    return number === null ? fallback : number;
  }

  function clampNumber(value, min, max) {
    const number = numberOr(value, min);
    return Math.min(Math.max(number, min), max);
  }

  function formatTemp(value, withUnit = false) {
    const number = toNumber(value);
    if (number === null) return "—";
    return `${Math.round(number)}°${withUnit ? "C" : ""}`;
  }

  function formatTempNumber(value) {
    const number = toNumber(value);
    return number === null ? "—" : String(Math.round(number));
  }

  function formatClock(iso) {
    if (!iso || typeof iso !== "string" || iso.length < 16) return "—";
    return iso.slice(11, 16);
  }

  function formatVisibility(meters) {
    const value = toNumber(meters);
    if (value === null) return "—";
    if (value >= 1000) return `${numberFormatter.format(value / 1000)} km`;
    return `${Math.round(value)} m`;
  }

  function uvInfo(value) {
    if (!Number.isFinite(value)) return { label: "—", className: "is-low" };
    if (value <= 2) return { label: "Rendah", className: "is-low" };
    if (value <= 5) return { label: "Sedang", className: "is-moderate" };
    if (value <= 7) return { label: "Tinggi", className: "is-high" };
    if (value <= 10) return { label: "Sangat Tinggi", className: "is-very-high" };
    return { label: "Ekstrem", className: "is-extreme" };
  }

  function placeRegion(place) {
    const name = String(place.name || "").toLowerCase();
    const parts = [place.admin1, place.country].filter(Boolean);
    const unique = parts.filter((part, index) => {
      return String(part).toLowerCase() !== name && parts.indexOf(part) === index;
    });

    return unique.join(", ");
  }

  function formatter(options) {
    const key = JSON.stringify(options);
    if (!dateFormatters.has(key)) {
      dateFormatters.set(key, new Intl.DateTimeFormat("id-ID", options));
    }
    return dateFormatters.get(key);
  }

  function parseDate(dateIso) {
    return new Date(`${dateIso}T12:00:00`);
  }

  function formatFullDate(dateIso) {
    return formatter({ weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(parseDate(dateIso));
  }

  function formatDay(dateIso) {
    return formatter({ weekday: "short" }).format(parseDate(dateIso));
  }

  function formatShortDate(dateIso) {
    return formatter({ day: "numeric", month: "short" }).format(parseDate(dateIso));
  }

  function formatLongDate(dateIso) {
    return formatter({ weekday: "long", day: "numeric", month: "long" }).format(parseDate(dateIso));
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
