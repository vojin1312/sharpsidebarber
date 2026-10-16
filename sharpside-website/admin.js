// ================= TEMA (isti sistem kao na ostatku sajta) =================
const THEME_KEY = "sharpside_theme";
function applyTheme(theme) { document.documentElement.setAttribute("data-theme", theme); }
applyTheme(localStorage.getItem(THEME_KEY) || "dark");
document.getElementById("themeToggle")?.addEventListener("click", () => {
  const next = (document.documentElement.getAttribute("data-theme") || "dark") === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
});

requestAnimationFrame(() => document.body.classList.add("page-ready"));

// ================= NAPOMENA O BEZBEDNOSTI =================
// Ova lozinka je vidljiva svakome ko pogleda kod stranice (View Page Source).
// Ovo je samo "meka" prepreka da slučajni posetioci sajta ne uđu na admin
// stranicu — NE štiti od nekoga ko namerno traži kod. Za pravu zaštitu
// potreban je server sa pravom autentifikacijom (poseban, veći korak).
const ADMIN_PASSWORD = "sharpside2026";

const BARBERS_ADMIN = [
  { id: "aleksandra", name: "Aleksandra Đorđević" },
  { id: "nikola", name: "Nikola Novaković" },
  { id: "dimitrije", name: "Dimitrije Novaković" },
];

const loginSection = document.getElementById("adminLoginSection");
const calendarSection = document.getElementById("adminCalendarSection");
const adminPassword = document.getElementById("adminPassword");
const adminLoginBtn = document.getElementById("adminLoginBtn");

const SESSION_KEY = "sharpside_admin_ok";

function showCalendar() {
  loginSection.style.display = "none";
  calendarSection.style.display = "";
  loadWeek();
}

if (sessionStorage.getItem(SESSION_KEY) === "1") {
  showCalendar();
}

adminLoginBtn.addEventListener("click", () => {
  if (adminPassword.value === ADMIN_PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, "1");
    showCalendar();
  } else {
    alert("Pogrešna lozinka.");
  }
});
adminPassword.addEventListener("keydown", (e) => { if (e.key === "Enter") adminLoginBtn.click(); });

// ================= NEDELJNI KALENDAR =================
let weekOffset = 0; // 0 = ova nedelja, -1 = prethodna, +1 = sledeća
let activeBarberFilter = "all";

const DOW_FULL = ["Nedelja", "Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota"];
const DOW_SHORT = ["Ned", "Pon", "Uto", "Sre", "Čet", "Pet", "Sub"];

// VAŽNO: koristi LOKALNI datum (ne toISOString/UTC), da izbegnemo pomeranje
// datuma za jedan dan u zavisnosti od doba dana i vremenske zone uređaja.
function toISO(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMondayOfWeek(offset) {
  const now = new Date();
  const day = now.getDay(); // 0 = nedelja
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function isDbConfigured() {
  return typeof SUPABASE_URL !== "undefined"
    && typeof SUPABASE_ANON_KEY !== "undefined"
    && !SUPABASE_URL.includes("TVOJ-PROJEKAT")
    && !SUPABASE_ANON_KEY.includes("TVOJ_ANON");
}

// lokalne rezervacije (localStorage) — koriste se kao rezerva/dopuna ako baza nije podešena
function getLocalBookings() {
  try { return JSON.parse(localStorage.getItem("sharpside_bookings_v1")) || []; }
  catch (e) { return []; }
}

const weekRangeLabel = document.getElementById("weekRangeLabel");
const weekGrid = document.getElementById("adminWeekGrid");

function formatShort(d) {
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function loadWeek() {
  const monday = getMondayOfWeek(weekOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  weekRangeLabel.textContent = `${formatShort(monday)} — ${formatShort(sunday)}`;

  weekGrid.innerHTML = `<p class="muted">Učitavanje rasporeda…</p>`;

  const startISO = toISO(monday);
  const endISO = toISO(sunday);

  let bookings = [];

  if (isDbConfigured()) {
    try {
      const rows = await fetchBookingsForRange(startISO, endISO, activeBarberFilter);
      bookings = rows.map(r => ({
        id: r.id,
        fromDb: true,
        date: r.date,
        time: r.time,
        barberId: r.barber_id,
        barberName: r.barber_name,
        serviceName: r.service_name,
        servicePrice: r.service_price,
        customerName: r.customer_name,
        customerPhone: r.customer_phone,
      }));
    } catch (e) {
      weekGrid.innerHTML = `<p class="muted">Greška pri učitavanju sa servera. Proveri internet konekciju.</p>`;
      return;
    }
  }

  // dodaj i lokalne rezervacije (npr. ako baza nije podešena, ili kao dopuna)
  const local = getLocalBookings()
    .filter(b => b.date >= startISO && b.date <= endISO)
    .filter(b => activeBarberFilter === "all" || b.barberId === activeBarberFilter)
    .map(b => ({
      id: b.id,
      fromDb: false,
      date: b.date,
      time: b.time,
      barberId: b.barberId,
      barberName: b.barberName,
      serviceName: b.serviceName,
      servicePrice: b.servicePrice,
      customerName: b.name,
      customerPhone: b.phone,
    }));

  const seen = new Set();
  const all = [...bookings, ...local].filter(b => {
    const key = `${b.date}_${b.time}_${b.barberId}_${b.customerPhone}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  renderWeekGrid(monday, all);
}

function renderWeekGrid(monday, bookings) {
  weekGrid.innerHTML = "";

  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const iso = toISO(day);
    const dayBookings = bookings
      .filter(b => b.date === iso)
      .sort((a, b) => a.time.localeCompare(b.time));

    const dayCol = document.createElement("div");
    dayCol.className = "admin-day-col";

    const isToday = iso === toISO(new Date());

    dayCol.innerHTML = `
      <div class="admin-day-header ${isToday ? "is-today" : ""}">
        <span class="admin-day-name">${DOW_SHORT[day.getDay()]}</span>
        <span class="admin-day-date">${formatShort(day)}</span>
        <span class="admin-day-count">${dayBookings.length} termina</span>
      </div>
      <div class="admin-day-body"></div>
    `;

    const body = dayCol.querySelector(".admin-day-body");

    if (!dayBookings.length) {
      body.innerHTML = `<p class="admin-day-empty">Nema termina — ceo dan slobodan.</p>`;
    } else {
      dayBookings.forEach(b => {
        const card = document.createElement("div");
        card.className = "admin-booking-card";
        card.innerHTML = `
          <div class="admin-booking-time">${b.time}</div>
          <div class="admin-booking-info">
            <strong>${b.customerName}</strong>
            <span>${b.serviceName}</span>
            <span class="admin-booking-barber">${b.barberName}</span>
            <a href="tel:${b.customerPhone}" class="admin-booking-phone">${b.customerPhone}</a>
          </div>
          <button type="button" class="admin-cancel-btn" title="Otkaži termin">✕</button>
        `;
        card.querySelector(".admin-cancel-btn").addEventListener("click", async () => {
          if (!confirm(`Otkazati termin za ${b.customerName} u ${b.time}?`)) return;
          try {
            if (b.fromDb) await cancelBookingById(b.id);
            else {
              const all = getLocalBookings().filter(x => x.id !== b.id);
              localStorage.setItem("sharpside_bookings_v1", JSON.stringify(all));
            }
            loadWeek();
          } catch (e) {
            alert("Greška pri otkazivanju termina.");
          }
        });
        body.appendChild(card);
      });
    }

    weekGrid.appendChild(dayCol);
  }
}

document.getElementById("prevWeekBtn").addEventListener("click", () => { weekOffset -= 1; loadWeek(); });
document.getElementById("nextWeekBtn").addEventListener("click", () => { weekOffset += 1; loadWeek(); });

document.querySelectorAll(".filter-pill").forEach(pill => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    activeBarberFilter = pill.dataset.barber;
    loadWeek();
  });
});
