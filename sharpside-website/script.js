// ================= PAGE ENTER ANIMACIJA (uvek prva, bez obzira na ostatak koda) =================
requestAnimationFrame(() => {
  document.body.classList.add("page-ready");
});

// ================= LIGHT / DARK MODE =================
const THEME_KEY = "sharpside_theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

// primeni odmah sačuvanu temu (ili tamnu po defaultu)
applyTheme(localStorage.getItem(THEME_KEY) || "dark");

function initThemeToggle() {
  const themeToggle = document.getElementById("themeToggle");
  if (!themeToggle) return;
  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });
}
initThemeToggle();

// ================= REZERVACIJE — deljene funkcije (koriste ih i zakazivanje i otkazivanje) =================
const BOOKINGS_KEY = "sharpside_bookings_v1";

function getBookings() {
  try { return JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || []; }
  catch (e) { return []; }
}

function saveBookingToStorage(booking) {
  const all = getBookings();
  all.push({ id: Date.now() + "-" + Math.random().toString(36).slice(2, 8), ...booking });
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(all));
}

function isTakenGlobal(dateStr, time, barberId) {
  return getBookings().some(b => b.date === dateStr && b.time === time && b.barberId === barberId);
}

function removeBookingById(id) {
  const all = getBookings().filter(b => b.id !== id);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(all));
}

// termin se sme otkazati samo ako do njega ima BAR 2 sata
function isCancellableStill(dateStr, timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const apptDate = new Date(dateStr + "T00:00:00");
  apptDate.setHours(h, m, 0, 0);
  return apptDate.getTime() - Date.now() >= 2 * 60 * 60 * 1000;
}

// da li je Supabase (prava baza) podešen — zamenjeni pravi URL/key umesto placeholder-a
function isDbConfiguredGlobal() {
  return typeof SUPABASE_URL !== "undefined"
    && typeof SUPABASE_ANON_KEY !== "undefined"
    && !SUPABASE_URL.includes("TVOJ-PROJEKAT")
    && !SUPABASE_ANON_KEY.includes("TVOJ_ANON");
}

// ================= DATA =================
const SERVICES = [
  { id: "moderno",      name: "Moderno šišanje",                 price: 1200 },
  { id: "klasicno",     name: "Klasično šišanje",                 price: 950 },
  { id: "sisanjebrada", name: "Šišanje i brada",                  price: 1800 },
  { id: "sredbrade",    name: "Sređivanje brade",                 price: 400 },
  { id: "sisbradapranje", name: "Šišanje i brada sa pranjem kose", price: 2000 },
  { id: "pranjemasaza", name: "Pranje kose sa masažom glave",     price: 400 },
  { id: "brijanje",     name: "Brijanje vrućim peškirom",         price: 1400 },
  { id: "tretmanlica",  name: "Tretman lica",                     price: 1000 },
  { id: "tretmansvece", name: "Tretman svećama",                  price: 800 },
  { id: "spaljivanje",  name: "Spaljivanje dlačica vatrom",       price: 250 },
  { id: "sharp",        name: "Sharp tretman",                    price: 3000 },
];

const BARBERS = [
  { id: "aleksandra", name: "Aleksandra Đorđević", genitive: "Aleksandre", role: "Frizer • Nega brade i lica", img: "aleksandra.png" },
  { id: "nikola",     name: "Nikola Novaković",    genitive: "Nikole",     role: "Glavni majstor • Osnivač",  img: "novak.png" },
  { id: "dimitrije",  name: "Dimitrije Novaković", genitive: "Dimitrija",  role: "Barber • Klasično i moderno šišanje", img: "dimitrije.png" },
];

const SHOP_PHONE = "381612265956"; // za WhatsApp link (bez vodeće nule)

// ================= RENDER: SERVICES PREVIEW (homepage, prve 4) =================
const servicesGridPreview = document.getElementById("servicesGridPreview");
if (servicesGridPreview) {
  SERVICES.slice(0, 4).forEach(s => {
    const card = document.createElement("div");
    card.className = "service-card";
    card.innerHTML = `
      <div class="service-top">
        <span class="service-name">${s.name}</span>
        <span class="service-price">${s.price} din</span>
      </div>
      <span class="service-flag">Sharp Side</span>
    `;
    servicesGridPreview.appendChild(card);
  });
}

// ================= RENDER: ALL SERVICES (usluge.html) =================
const allServicesGrid = document.getElementById("allServicesGrid");
if (allServicesGrid) {
  SERVICES.forEach(s => {
    const card = document.createElement("div");
    card.className = "service-card";
    card.innerHTML = `
      <div class="service-top">
        <span class="service-name">${s.name}</span>
        <span class="service-price">${s.price} din</span>
      </div>
      <a class="service-book-link" href="index.html?service=${s.id}#zakazivanje">Zakaži ovu uslugu →</a>
    `;
    allServicesGrid.appendChild(card);
  });
}

// ================= RENDER: TEAM (tim.html) =================
const teamGridFull = document.getElementById("teamGridFull");
if (teamGridFull) {
  BARBERS.forEach(b => {
    const card = document.createElement("div");
    card.className = "team-card";
    card.innerHTML = `
      <div class="team-photo-wrap"><img src="${b.img}" alt="${b.name}"></div>
      <div class="team-body">
        <p class="team-role">${b.role.split(" • ")[0]}</p>
        <h3 class="team-name">${b.name}</h3>
        <p class="team-desc">${b.role.split(" • ")[1] || ""}</p>
        <a class="btn btn-primary btn-small book-with-btn" href="index.html?barber=${b.id}#zakazivanje">Zakaži kod ${b.genitive}</a>
      </div>
    `;
    teamGridFull.appendChild(card);
  });
}

// ================= BOOKING WIDGET (samo na index.html) =================
const bookServiceGrid = document.getElementById("bookServiceGrid");

if (bookServiceGrid) {

  let state = { service: null, barber: null, date: null, time: null };
  let currentStep = 1;
  const totalSteps = 4;

  SERVICES.forEach(s => {
    const el = document.createElement("div");
    el.className = "option-card";
    el.dataset.id = s.id;
    el.innerHTML = `<span class="name">${s.name}</span><span class="price">${s.price} din</span>`;
    el.addEventListener("click", () => selectService(s.id));
    bookServiceGrid.appendChild(el);
  });

  function selectService(id) {
    const s = SERVICES.find(x => x.id === id);
    if (!s) return;
    state.service = s;
    document.querySelectorAll("#bookServiceGrid .option-card").forEach(c => c.classList.toggle("selected", c.dataset.id === id));
    updateSummary();
  }

  const bookBarberGrid = document.getElementById("bookBarberGrid");
  BARBERS.forEach(b => {
    const el = document.createElement("div");
    el.className = "option-card";
    el.dataset.id = b.id;
    el.innerHTML = `<img class="avatar" src="${b.img}" alt="${b.name}"><span class="name">${b.name}</span>`;
    el.addEventListener("click", () => selectBarber(b.id));
    bookBarberGrid.appendChild(el);
  });

  function selectBarber(id) {
    const b = BARBERS.find(x => x.id === id);
    if (!b) return;
    state.barber = b;
    document.querySelectorAll("#bookBarberGrid .option-card").forEach(c => c.classList.toggle("selected", c.dataset.id === id));
    if (state.date) renderSlots();
    updateSummary();
  }

  const dateStrip = document.getElementById("dateStrip");
  const hoursHint = document.getElementById("hoursHint");
  const slotsGrid = document.getElementById("slotsGrid");

  const DOW_NAMES = ["Ned", "Pon", "Uto", "Sre", "Čet", "Pet", "Sub"];
  const DAYS_AHEAD = 45;

  // VAŽNO: koristi LOKALNI datum (ne toISOString/UTC), da izbegnemo pomeranje
  // datuma za jedan dan u zavisnosti od doba dana i vremenske zone uređaja.
  function toISO(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function buildDateStrip() {
    const today = new Date();
    dateStrip.innerHTML = "";
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const iso = toISO(d);
      const dm = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "date-btn";
      btn.dataset.iso = iso;
      btn.innerHTML = `<span class="dow">${DOW_NAMES[d.getDay()]}</span><span class="dm">${dm}</span>`;
      btn.addEventListener("click", () => {
        document.querySelectorAll(".date-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        state.date = iso;
        state.time = null;
        renderSlots();
        updateSummary();
      });
      dateStrip.appendChild(btn);
    }
  }
  buildDateStrip();

  function getHoursForDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    const day = d.getDay();
    if (day === 0 || day === 6) return { open: 10, close: 18 };
    return { open: 10, close: 20 };
  }

  function isTaken(dateStr, time, barberId) {
    return isTakenGlobal(dateStr, time, barberId);
  }

  async function renderSlots() {
    const dateStr = state.date;
    if (!dateStr) { slotsGrid.innerHTML = `<p class="muted">Izaberi datum da vidiš slobodne termine.</p>`; return; }
    if (!state.barber) { slotsGrid.innerHTML = `<p class="muted">Prvo izaberi majstora u prethodnom koraku.</p>`; return; }

    const { open, close } = getHoursForDate(dateStr);
    hoursHint.textContent = `Radno vreme za izabrani datum: ${open}:00 — ${close}:00`;

    slotsGrid.innerHTML = `<p class="muted">Učitavanje termina…</p>`;

    let dbTakenTimes = [];
    if (isDbConfiguredGlobal()) {
      try {
        dbTakenTimes = await fetchTakenTimes(dateStr, state.barber.id);
      } catch (e) {
        slotsGrid.innerHTML = `<p class="muted">Greška pri učitavanju termina sa servera. Proveri internet konekciju i pokušaj ponovo.</p>`;
        return;
      }
    }

    const now = new Date();
    const isToday = dateStr === toISO(now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const slots = [];
    for (let h = open; h < close; h++) {
      for (let m of [0, 30]) {
        if (h === close - 1 && m === 30) continue;
        const label = `${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`;
        const slotMinutes = h * 60 + m;
        const passed = isToday && slotMinutes <= nowMinutes;
        const takenInDb = dbTakenTimes.includes(label);
        const takenLocal = isTaken(dateStr, label, state.barber.id);
        slots.push({ label, taken: takenInDb || takenLocal || passed, passed });
      }
    }

    slotsGrid.innerHTML = "";
    slots.forEach(slot => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot-btn" + (slot.taken ? " taken" : "");
      btn.textContent = slot.label;
      if (!slot.taken) {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("selected"));
          btn.classList.add("selected");
          state.time = slot.label;
          updateSummary();
        });
      } else {
        btn.disabled = true;
        btn.title = slot.passed ? "Prošlo" : "Zauzeto";
      }
      slotsGrid.appendChild(btn);
    });
  }

  const summaryBox = document.getElementById("summaryBox");
  const confirmBtn = document.getElementById("confirmBtn");
  const custName = document.getElementById("custName");
  const custPhone = document.getElementById("custPhone");

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    const dm = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    return `${DOW_NAMES[d.getDay()]} ${dm}`;
  }

  function updateSummary() {
    const ready = state.service && state.barber && state.date && state.time;
    if (!ready) {
      summaryBox.innerHTML = `<p class="muted">Popuni prethodne korake da vidiš pregled termina.</p>`;
      confirmBtn.disabled = true;
      return;
    }
    summaryBox.innerHTML = `
      <div class="summary-row"><span>Usluga</span><strong>${state.service.name} — ${state.service.price} din</strong></div>
      <div class="summary-row"><span>Majstor</span><strong>${state.barber.name}</strong></div>
      <div class="summary-row"><span>Termin</span><strong>${formatDate(state.date)} u ${state.time}</strong></div>
    `;
    checkConfirmReady();
  }

  function checkConfirmReady() {
    const ready = state.service && state.barber && state.date && state.time && custName.value.trim() && custPhone.value.trim();
    confirmBtn.disabled = !ready;
  }
  custName.addEventListener("input", checkConfirmReady);
  custPhone.addEventListener("input", checkConfirmReady);

  const stepPanels = document.querySelectorAll(".step-panel");
  const stepPills = document.querySelectorAll(".step-pill");
  const prevBtn = document.getElementById("prevStep");
  const nextBtn = document.getElementById("nextStep");
  const bookingCard = document.querySelector(".booking-card");
  const successPanel = document.getElementById("successPanel");

  function goToStep(n) {
    currentStep = n;
    stepPanels.forEach(p => p.classList.toggle("active", Number(p.dataset.panel) === n));
    stepPills.forEach(p => {
      const num = Number(p.dataset.step);
      p.classList.toggle("active", num === n);
      p.classList.toggle("done", num < n);
    });
    prevBtn.disabled = n === 1;
    nextBtn.textContent = n === totalSteps ? "Pregled" : "Dalje";
    nextBtn.style.display = n === totalSteps ? "none" : "inline-flex";
  }

  function validateStep(n) {
    if (n === 1 && !state.service) { alert("Izaberi uslugu pre nego što nastaviš."); return false; }
    if (n === 2 && !state.barber) { alert("Izaberi majstora pre nego što nastaviš."); return false; }
    if (n === 3 && (!state.date || !state.time)) { alert("Izaberi datum i slobodan termin."); return false; }
    return true;
  }

  nextBtn.addEventListener("click", () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < totalSteps) goToStep(currentStep + 1);
  });
  prevBtn.addEventListener("click", () => { if (currentStep > 1) goToStep(currentStep - 1); });
  stepPills.forEach(pill => {
    pill.addEventListener("click", () => {
      const target = Number(pill.dataset.step);
      if (target < currentStep) goToStep(target);
    });
  });

  const successText = document.getElementById("successText");
  confirmBtn.addEventListener("click", () => {
    if (!validateStep(3)) return;
    const name = custName.value.trim();
    const phone = custPhone.value.trim();
    if (!name || !phone) return;

    const msg =
      `Zdravo Sharp Side! Želim da zakažem termin:\n` +
      `• Usluga: ${state.service.name} (${state.service.price} din)\n` +
      `• Majstor: ${state.barber.name}\n` +
      `• Termin: ${formatDate(state.date)} u ${state.time}\n` +
      `• Ime: ${name}\n` +
      `• Telefon: ${phone}`;

    const waUrl = `https://wa.me/${SHOP_PHONE}?text=${encodeURIComponent(msg)}`;

    bookingCard.querySelectorAll(".steps-bar, .step-panel, .booking-nav").forEach(el => el.style.display = "none");
    successPanel.classList.add("active");
    successText.innerHTML = `Termin za <strong>${state.service.name}</strong> kod <strong>${state.barber.name}</strong>, ${formatDate(state.date)} u <strong>${state.time}</strong> je spreman. Klikni dugme ispod da poruku pošalješ direktno Sharp Side timu na WhatsApp — termin se rezerviše tek kad poruku stvarno pošalješ.`;

    let sendBtn = document.getElementById("sendWaBtn");
    if (!sendBtn) {
      sendBtn = document.createElement("button");
      sendBtn.type = "button";
      sendBtn.id = "sendWaBtn";
      sendBtn.className = "btn btn-primary";
      sendBtn.style.marginRight = "12px";
      successPanel.insertBefore(sendBtn, document.getElementById("resetBooking"));
    }
    sendBtn.textContent = "Pošalji na WhatsApp";
    sendBtn.disabled = false;
    sendBtn.classList.remove("btn-sent");

    sendBtn.onclick = async () => {
      sendBtn.disabled = true;
      sendBtn.textContent = "Šalje se…";

      // otvori prozor ODMAH (unutar klika) da ga pregledač ne blokira kao popup
      const waWindow = window.open("", "_blank");

      try {
        if (isDbConfiguredGlobal()) {
          await insertBooking({
            serviceId: state.service.id,
            serviceName: state.service.name,
            servicePrice: state.service.price,
            barberId: state.barber.id,
            barberName: state.barber.name,
            date: state.date,
            time: state.time,
            name,
            phone,
          });
        }

        // uvek sačuvaj i lokalno — radi kao rezerva i za brzo otkazivanje na istom uređaju
        saveBookingToStorage({ date: state.date, time: state.time, barberId: state.barber.id, barberName: state.barber.name, serviceName: state.service.name, servicePrice: state.service.price, name, phone });

        if (waWindow) waWindow.location.href = waUrl;
        sendBtn.textContent = "Poslato ✓";
        sendBtn.classList.add("btn-sent");
      } catch (e) {
        if (waWindow) waWindow.close();
        alert("Greška pri čuvanju termina. Proveri internet konekciju i pokušaj ponovo.");
        sendBtn.disabled = false;
        sendBtn.textContent = "Pošalji na WhatsApp";
      }
    };
  });

  document.getElementById("resetBooking").addEventListener("click", () => {
    state = { service: null, barber: null, date: null, time: null };
    custName.value = "";
    custPhone.value = "";
    document.querySelectorAll(".option-card.selected, .date-btn.selected").forEach(c => c.classList.remove("selected"));
    slotsGrid.innerHTML = `<p class="muted">Izaberi datum da vidiš slobodne termine.</p>`;
    hoursHint.textContent = "";
    summaryBox.innerHTML = `<p class="muted">Popuni prethodne korake da vidiš pregled termina.</p>`;
    bookingCard.querySelectorAll(".steps-bar, .step-panel, .booking-nav").forEach(el => el.style.display = "");
    successPanel.classList.remove("active");
    goToStep(1);
  });

  const params = new URLSearchParams(window.location.search);
  const preService = params.get("service");
  const preBarber = params.get("barber");
  if (preService) selectService(preService);
  if (preBarber) selectBarber(preBarber);

  if (preService && preBarber) goToStep(3);
  else if (preBarber) goToStep(1);
  else if (preService) goToStep(2);
  else goToStep(1);
}

// ================= NAV / BURGER =================
const burger = document.getElementById("burger");
const mainNav = document.getElementById("mainNav");
if (burger && mainNav) {
  burger.addEventListener("click", () => mainNav.classList.toggle("open"));
  mainNav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => mainNav.classList.remove("open")));
}

// ================= FOOTER YEAR =================
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ================= OTKAZIVANJE TERMINA (samo na otkazi.html) =================
const cancelSearchBtn = document.getElementById("cancelSearchBtn");
if (cancelSearchBtn) {
  const cancelPhone = document.getElementById("cancelPhone");
  const cancelResults = document.getElementById("cancelResults");
  const CANCEL_DOW = ["Ned", "Pon", "Uto", "Sre", "Čet", "Pet", "Sub"];

  function formatDateShort(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    const dm = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    return `${CANCEL_DOW[d.getDay()]} ${dm}`;
  }

  async function renderCancelResults() {
    const phone = cancelPhone.value.trim();
    if (!phone) {
      cancelResults.innerHTML = `<p class="muted">Unesi broj telefona da pronađeš svoje termine.</p>`;
      return;
    }

    cancelResults.innerHTML = `<p class="muted">Tražim termine…</p>`;

    let dbMatches = [];
    if (isDbConfiguredGlobal()) {
      try {
        const rows = await fetchBookingsByPhone(phone);
        dbMatches = rows.map(r => ({
          id: "db-" + r.id,
          dbId: r.id,
          date: r.date,
          time: r.time,
          barberName: r.barber_name,
          serviceName: r.service_name,
          phone: r.customer_phone,
          fromDb: true,
        }));
      } catch (e) {
        // ako baza ne odgovori, samo nastavi sa lokalnim rezultatima
      }
    }

    const localMatches = getBookings()
      .filter(b => b.phone === phone)
      .map(b => ({ ...b, fromDb: false }));

    // spoji, izbegavajući duplikate (ako je isti termin i u bazi i lokalno)
    const seen = new Set();
    const now = Date.now();
    const all = [...dbMatches, ...localMatches].filter(b => {
      const key = `${b.date}_${b.time}_${b.barberName}`;
      if (seen.has(key)) return false;
      seen.add(key);
      const [h, m] = b.time.split(":").map(Number);
      const d = new Date(b.date + "T00:00:00");
      d.setHours(h, m, 0, 0);
      return d.getTime() > now; // samo budući termini
    }).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    if (!all.length) {
      cancelResults.innerHTML = `<p class="muted">Nema pronađenih budućih termina za ovaj broj telefona.</p>`;
      return;
    }

    cancelResults.innerHTML = "";
    all.forEach(b => {
      const cancellable = isCancellableStill(b.date, b.time);
      const row = document.createElement("div");
      row.className = "cancel-row";
      row.innerHTML = `
        <div class="cancel-info">
          <strong>${b.serviceName || "Usluga"}</strong>
          <span>${b.barberName || ""} — ${formatDateShort(b.date)} u ${b.time}</span>
        </div>
        <button type="button" class="btn ${cancellable ? "btn-primary" : "btn-ghost"} btn-small cancel-btn" ${cancellable ? "" : "disabled"}>
          ${cancellable ? "Otkaži termin" : "Prekasno (manje od 2h)"}
        </button>
      `;
      if (cancellable) {
        row.querySelector(".cancel-btn").addEventListener("click", async () => {
          if (!confirm("Da li sigurno želiš da otkažeš ovaj termin?")) return;
          const btn = row.querySelector(".cancel-btn");
          btn.disabled = true;
          btn.textContent = "Otkazivanje…";
          try {
            if (b.fromDb) await cancelBookingById(b.dbId);
            if (!b.fromDb || b.id) removeBookingById(b.id);
            renderCancelResults();
          } catch (e) {
            alert("Greška pri otkazivanju. Proveri internet konekciju i pokušaj ponovo.");
            btn.disabled = false;
            btn.textContent = "Otkaži termin";
          }
        });
      }
      cancelResults.appendChild(row);
    });
  }

  cancelSearchBtn.addEventListener("click", renderCancelResults);
  cancelPhone.addEventListener("keydown", (e) => { if (e.key === "Enter") renderCancelResults(); });
}

// ================= SCROLL REVEAL (postepeno pojavljivanje pri skrolovanju) =================
// footer je namerno izostavljen — uvek ostaje normalno vidljiv, bez animacije
const revealCandidates = document.querySelectorAll(
  '.eyebrow, .section-title, .section-sub, .view-all-wrap, ' +
  '.cta-glow h2, .cta-glow p, .cta-glow .btn-glow, ' +
  '.service-card, .team-card, .info-card, .contact-row, .hours-card, .map-card, ' +
  '.page-hero h1, .page-hero p, .page-hero .eyebrow'
);

const revealEls = Array.from(revealCandidates).filter(
  el => !el.closest('#zakazivanje') && !el.closest('footer') && !el.closest('.hero')
);

const parentIndexMap = new Map();
revealEls.forEach(el => {
  el.classList.add('reveal-el');
  const parent = el.parentElement;
  const idx = parentIndexMap.get(parent) || 0;
  el.style.transitionDelay = `${(idx % 6) * 70}ms`;
  parentIndexMap.set(parent, idx + 1);
});

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));
} else {
  // fallback ako pretraživač ne podržava IntersectionObserver — samo prikaži sve
  revealEls.forEach(el => el.classList.add('revealed'));
}

// ================= PAGE TRANSITION — klik na interne linkove =================
document.querySelectorAll("a[href]").forEach(link => {
  const href = link.getAttribute("href");
  if (!href) return;
  if (href.startsWith("#")) return; // isti-stranica anchor, ne animiramo prelazak
  if (href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:")) return;
  if (link.target === "_blank") return;

  link.addEventListener("click", (e) => {
    e.preventDefault();
    document.body.classList.remove("page-ready");
    document.body.classList.add("page-leaving");
    setTimeout(() => { window.location.href = href; }, 280);
  });
});

// ================= ZAKAZIVANJE — otkrij tek na klik "Zakaži termin" =================
const zakazivanjeSection = document.getElementById("zakazivanje");
if (zakazivanjeSection) {
  const dividerBefore = document.getElementById("dividerBeforeBooking");
  const dividerAfter = document.getElementById("dividerAfterBooking");

  function revealBooking(smooth) {
    zakazivanjeSection.classList.remove("booking-hidden");
    if (dividerBefore) dividerBefore.classList.remove("booking-hidden");
    if (dividerAfter) dividerAfter.classList.remove("booking-hidden");

    // force reflow da animacija sigurno krene ispočetka
    zakazivanjeSection.classList.remove("booking-revealing");
    void zakazivanjeSection.offsetWidth;
    zakazivanjeSection.classList.add("booking-revealing");

    zakazivanjeSection.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  }

  // svaki link/dugme na ovoj stranici koji vodi na #zakazivanje otkriva sekciju
  document.querySelectorAll('a[href="#zakazivanje"], a[href$="#zakazivanje"]').forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      revealBooking(true);
    });
  });

  // ako se stiže sa druge stranice (index.html#zakazivanje) ili sa ?service=/?barber= parametrima
  const cameForBooking =
    window.location.hash === "#zakazivanje" ||
    new URLSearchParams(window.location.search).has("service") ||
    new URLSearchParams(window.location.search).has("barber");

  if (cameForBooking) {
    revealBooking(false);
  }
}
