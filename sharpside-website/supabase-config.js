// ===================================================================
// SUPABASE KONFIGURACIJA
// ===================================================================
// Ovo je "baza podataka" za termine — besplatna, deljena za sve uređaje.
// Da bi ovo proradilo, MORAŠ:
// 1. Napraviti besplatan nalog na https://supabase.com
// 2. Napraviti novi projekat (New Project)
// 3. U SQL Editor-u pokrenuti kod iz fajla supabase-setup.sql
// 4. U Project Settings → API kopirati "Project URL" i "anon public key"
// 5. Zameniti ta dva reda ispod svojim pravim vrednostima
// ===================================================================

const SUPABASE_URL = "https://klwjxmtcmfemsfjdngow.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_v4JxE48L3oh9PPZAu9pVHA_Hj-aYLK8";

/**
 * Pomoćna funkcija za pozive ka Supabase REST API-ju (bez potrebe za
 * dodatnom bibliotekom — radi sa običnim fetch pozivima).
 */
async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase greška (${res.status}): ${text}`);
  }

  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ---- Termini: čitanje zauzetih termina za dati datum + majstora ----
async function fetchTakenTimes(dateStr, barberId) {
  const query = `bookings?date=eq.${dateStr}&barber_id=eq.${barberId}&status=eq.confirmed&select=time`;
  const rows = await supabaseFetch(query, { method: "GET" });
  return (rows || []).map(r => r.time);
}

// ---- Termini: upisivanje novog termina ----
async function insertBooking(b) {
  return await supabaseFetch("bookings", {
    method: "POST",
    headers: { "Prefer": "return=representation" },
    body: JSON.stringify([{
      service_id: b.serviceId,
      service_name: b.serviceName,
      service_price: b.servicePrice,
      barber_id: b.barberId,
      barber_name: b.barberName,
      date: b.date,
      time: b.time,
      customer_name: b.name,
      customer_phone: b.phone,
    }]),
  });
}

// ---- Termini: pretraga po broju telefona (za otkazivanje) ----
async function fetchBookingsByPhone(phone) {
  const cleanPhone = phone.replace(/\s+/g, "");
  const query = `bookings?customer_phone=eq.${encodeURIComponent(cleanPhone)}&status=eq.confirmed&order=date.asc,time.asc&select=*`;
  return (await supabaseFetch(query, { method: "GET" })) || [];
}

// ---- Termini: otkazivanje (menja status, ne briše red) ----
async function cancelBookingById(id) {
  return await supabaseFetch(`bookings?id=eq.${id}`, {
    method: "PATCH",
    headers: { "Prefer": "return=minimal" },
    body: JSON.stringify({ status: "cancelled" }),
  });
}

// ---- Admin: svi termini u opsegu datuma (nedelja), po želji filtrirano po majstoru ----
async function fetchBookingsForRange(startISO, endISO, barberId) {
  let query = `bookings?date=gte.${startISO}&date=lte.${endISO}&status=eq.confirmed&order=date.asc,time.asc&select=*`;
  if (barberId && barberId !== "all") query += `&barber_id=eq.${barberId}`;
  return (await supabaseFetch(query, { method: "GET" })) || [];
}
