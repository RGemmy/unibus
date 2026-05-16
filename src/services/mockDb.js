/**
 * mockDb.js — Fixed version
 * Fixes: reservation linked to user, seat booking, bilingual seed data
 */

// ── Bilingual seed places & universities ─────────────────────────────────────
const PLACES_AR = ['جامعة شرق بورسعيد الأهلية','جامعة شرق بورسعيد الأهلية','جامعة شرق بورسعيد الأهلية','جامعة شرق بورسعيد الأهلية','جامعة شرق بورسعيد الأهلية']
const PLACES_EN = ['East Port Said Private University','East Port Said Private University','East Port Said Private University','East Port Said Private University','East Port Said Private University']

// ── Helper: generate future dates dynamically so seed data never expires ─────
function futureDate(daysFromNow) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}
function todayDate() {
  return new Date().toISOString().split('T')[0]
}
function nextWorkdayDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  while (d.getDay() === 5 || d.getDay() === 6) d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

const SEED = {
  buses: [
    { id:1, plate_number:'أ ب ت 1234', plate_en:'ABC 1234', capacity:45, color:'أبيض', color_en:'White', status:'active',      trips_count:12, has_ac:true  },
    { id:2, plate_number:'د هـ و 5678', plate_en:'DEF 5678', capacity:50, color:'أصفر', color_en:'Yellow', status:'active',      trips_count:8,  has_ac:false },
    { id:3, plate_number:'ز ح ط 9012', plate_en:'GHI 9012', capacity:40, color:'أزرق', color_en:'Blue',   status:'maintenance', trips_count:5  },
    { id:4, plate_number:'ي ك ل 3456', plate_en:'JKL 3456', capacity:45, color:'أبيض', color_en:'White',  status:'active',      trips_count:20, has_ac:true  },
    { id:5, plate_number:'م ن س 7890', plate_en:'MNO 7890', capacity:50, color:'فضي',  color_en:'Silver', status:'inactive',    trips_count:3  },
  ],
  places: [
    { id:1, place_name:'جامعة شرق بورسعيد الأهلية', place_name_en:'East Port Said Private University', location:'بورسعيد — طريق الشهيد أحمد حمدي', location_en:'Port Said — Shaheed Ahmed Hamdi Road' },
  ],
  schedules: [
    { id:1, schedule_time:'06:30', days:'السبت - الأربعاء', days_en:'Sat - Wed' },
    { id:2, schedule_time:'07:00', days:'السبت - الأربعاء', days_en:'Sat - Wed' },
    { id:3, schedule_time:'07:30', days:'السبت - الأربعاء', days_en:'Sat - Wed' },
    { id:4, schedule_time:'08:00', days:'يومياً',            days_en:'Daily'     },
    { id:5, schedule_time:'08:30', days:'يومياً',            days_en:'Daily'     },
    { id:6, schedule_time:'14:00', days:'السبت - الأربعاء', days_en:'Sat - Wed' },
    { id:7, schedule_time:'16:00', days:'يومياً',            days_en:'Daily'     },
  ],
  // trips now include a seats array: seats[i] = null (free) or userId (booked)
  get trips() { return [
    { id:1, place:1, bus:1, schedule:1, driver_id:1, trip_date:nextWorkdayDate(), status:'active', trip_type:'go', place_name:'جامعة شرق بورسعيد الأهلية', place_name_en:'East Port Said Private University',      bus_plate:'أ ب ت 1234', schedule_time:'06:30', bus_capacity:45, available_seats:12, price:55, seats: Array(45).fill(null).map((_,i)=>i<33?'taken':null) },
    { id:2, place:2, bus:2, schedule:2, driver_id:2, trip_date:nextWorkdayDate(), status:'active', trip_type:'go', place_name:'جامعة شرق بورسعيد الأهلية',    place_name_en:'East Port Said Private University',  bus_plate:'د هـ و 5678', schedule_time:'07:00', bus_capacity:50, available_seats:5, price:55,  seats: Array(50).fill(null).map((_,i)=>i<45?'taken':null) },
    { id:3, place:3, bus:4, schedule:3, driver_id:3, trip_date:nextWorkdayDate(), status:'active', trip_type:'go', place_name:'جامعة شرق بورسعيد الأهلية',     place_name_en:'East Port Said Private University', bus_plate:'ي ك ل 3456', schedule_time:'07:30', bus_capacity:45, available_seats:30, price:55, seats: Array(45).fill(null).map((_,i)=>i<15?'taken':null) },
    { id:4, place:1, bus:1, schedule:4, driver_id:1, trip_date:nextWorkdayDate(), status:'active', trip_type:'go', place_name:'جامعة شرق بورسعيد الأهلية', place_name_en:'East Port Said Private University',      bus_plate:'أ ب ت 1234', schedule_time:'08:00', bus_capacity:45, available_seats:20, price:55, seats: Array(45).fill(null).map((_,i)=>i<25?'taken':null) },
    { id:5, place:4, bus:2, schedule:5, trip_date:nextWorkdayDate(), status:'full', place_name:'جامعة شرق بورسعيد الأهلية', place_name_en:'East Port Said Private University', bus_plate:'د هـ و 5678', schedule_time:'08:30', bus_capacity:50, available_seats:0, price:55,  seats: Array(50).fill('taken') },
    { id:6, place:5, bus:4, schedule:6, trip_date:nextWorkdayDate(), status:'active', trip_type:'go',     place_name:'جامعة شرق بورسعيد الأهلية',           place_name_en:'East Port Said Private University',          bus_plate:'ي ك ل 3456', schedule_time:'14:00', bus_capacity:45, available_seats:40, price:55, seats: Array(45).fill(null).map((_,i)=>i<5?'taken':null)  },
    { id:7, place:1, bus:1, schedule:1, trip_date:nextWorkdayDate(), status:'active', trip_type:'return', place_name:'جامعة شرق بورسعيد الأهلية', place_name_en:'East Port Said Private University', bus_plate:'أ ب ت 1234', schedule_time:'15:30', bus_capacity:45, available_seats:35, price:55, seats: Array(45).fill(null).map((_,i)=>i<10?'taken':null) },
    { id:8, place:2, bus:2, schedule:2, trip_date:nextWorkdayDate(), status:'active', trip_type:'return', place_name:'جامعة شرق بورسعيد الأهلية',         place_name_en:'East Port Said Private University', bus_plate:'د هـ و 5678', schedule_time:'16:00', bus_capacity:50, available_seats:42, price:55, seats: Array(50).fill(null).map((_,i)=>i<8?'taken':null)  },
  ]},
  routes: [
    { id:1, start_point:'بورسعيد - حي الزهور',  start_point_en:'Port Said - Al-Zuhour',  end_point:'جامعة شرق بورسعيد الأهلية',      end_point_en:'East Port Said Private University',      schedules:4 },
    { id:2, start_point:'بورسعيد - حي الشرق',  start_point_en:'Port Said - Al-Sharq',  end_point:'جامعة شرق بورسعيد الأهلية',    end_point_en:'East Port Said Private University',  schedules:3 },
    { id:3, start_point:'بورسعيد - حي المنتزه',  start_point_en:'Port Said - Al-Montazah', end_point:'جامعة شرق بورسعيد الأهلية',     end_point_en:'East Port Said Private University', schedules:5 },
    { id:4, start_point:'بورسعيد - وسط المدينة',     start_point_en:'Port Said - City Center', end_point:'جامعة شرق بورسعيد الأهلية', end_point_en:'East Port Said Private University', schedules:4 },
  ],
  students: [
    { student_id:1, id:1, user_name:'سارة أحمد',    faculty:'الهندسة',  faculty_en:'Engineering', program:'هندسة البرمجيات', program_en:'Software Engineering', university:'جامعة شرق بورسعيد الأهلية',      university_en:'East Port Said Private University',      status:'active',   subscription:true  },
    { student_id:2, id:2, user_name:'محمد خالد',    faculty:'العلوم',   faculty_en:'Science',      program:'علم الحاسب',       program_en:'Computer Science',      university:'جامعة شرق بورسعيد الأهلية',     university_en:'East Port Said Private University', status:'active',   subscription:false },
    { student_id:3, id:3, user_name:'نورة سلمان',   faculty:'التجارة',  faculty_en:'Commerce',     program:'محاسبة',           program_en:'Accounting',           university:'جامعة شرق بورسعيد الأهلية',    university_en:'East Port Said Private University', status:'inactive', subscription:true  },
    { student_id:4, id:4, user_name:'عبدالله فهد',  faculty:'الطب',     faculty_en:'Medicine',     program:'طب بشري',          program_en:'Medicine',             university:'جامعة شرق بورسعيد الأهلية',      university_en:'East Port Said Private University',     status:'active',   subscription:true  },
    { student_id:5, id:5, user_name:'ريم عمر',      faculty:'الآداب',   faculty_en:'Arts',         program:'لغة إنجليزية',     program_en:'English Language',     university:'جامعة شرق بورسعيد الأهلية', university_en:'East Port Said Private University',status:'active',   subscription:false },
  ],
  // reservations now store userId for filtering
  get reservations() { return [
    { id:1, userId:'demo_student', student:'سارة أحمد',   student_name:'سارة أحمد',   trip:1, trip_place:'جامعة شرق بورسعيد الأهلية',      trip_place_en:'East Port Said Private University',     schedule_time:'06:30', trip_date:nextWorkdayDate(), status:'confirmed', amount:25, seat_number:34 },
    { id:2, userId:'demo_student', student:'محمد خالد',   student_name:'محمد خالد',   trip:3, trip_place:'جامعة شرق بورسعيد الأهلية',     trip_place_en:'East Port Said Private University', schedule_time:'07:30', trip_date:nextWorkdayDate(), status:'pending',   amount:30, seat_number:16 },
    { id:3, userId:'other',        student:'نورة سلمان',  student_name:'نورة سلمان',  trip:2, trip_place:'جامعة شرق بورسعيد الأهلية',    trip_place_en:'East Port Said Private University', schedule_time:'07:00', trip_date:nextWorkdayDate(), status:'cancelled', amount:28, seat_number:null },
    { id:4, userId:'other',        student:'عبدالله فهد', student_name:'عبدالله فهد', trip:1, trip_place:'جامعة شرق بورسعيد الأهلية',      trip_place_en:'East Port Said Private University',     schedule_time:'06:30', trip_date:nextWorkdayDate(), status:'confirmed', amount:25, seat_number:2  },
    { id:5, userId:'other',        student:'ريم عمر',     student_name:'ريم عمر',     trip:5, trip_place:'جامعة شرق بورسعيد الأهلية', trip_place_en:'East Port Said Private University',schedule_time:'08:30', trip_date:nextWorkdayDate(), status:'confirmed', amount:35, seat_number:5  },
  ]},
  payments: [
    { id:1, student:'سارة أحمد',   amount:25,  date:'2026-04-19', method:'بطاقة ائتمان', method_en:'Credit Card', status:'paid'    },
    { id:2, student:'محمد خالد',   amount:30,  date:'2026-04-19', method:'تحويل بنكي',   method_en:'Bank Transfer',status:'pending' },
    { id:3, student:'عبدالله فهد', amount:25,  date:'2026-04-19', method:'بطاقة ائتمان', method_en:'Credit Card', status:'paid'    },
    { id:4, student:'ريم عمر',     amount:35,  date:'2026-04-20', method:'كاش',           method_en:'Cash',        status:'paid'    },
    { id:5, student:'نورة سلمان',  amount:120, date:'2026-04-15', method:'تحويل بنكي',   method_en:'Bank Transfer',status:'pending' },
  ],
  subscriptions: [
    { id:1, student:'سارة أحمد',   plan:'شهري', plan_en:'Monthly',  start_date:'2026-04-01', end_date:'2026-04-30', status:'active'  },
    { id:2, student:'عبدالله فهد', plan:'فصلي', plan_en:'Quarterly',start_date:'2026-02-01', end_date:'2026-05-31', status:'active'  },
    { id:3, student:'نورة سلمان',  plan:'شهري', plan_en:'Monthly',  start_date:'2026-03-01', end_date:'2026-03-31', status:'expired' },
  ],
  drivers: [
    { id:1, user_id:1, user_name:'خالد العمري',  email:'khalid@unibus.sa', phone:'0501234567', license_number:'DL-001234', experience_years:8,  status:'active' },
    { id:2, user_id:2, user_name:'فهد السعيد',   email:'fahad@unibus.sa',  phone:'0502345678', license_number:'DL-005678', experience_years:5,  status:'active' },
    { id:3, user_id:3, user_name:'أحمد الغامدي', email:'ahmed@unibus.sa',  phone:'0503456789', license_number:'DL-009012', experience_years:12, status:'active' },
  ],
  universities: [
    { id:1, name:'جامعة شرق بورسعيد الأهلية',      name_en:'East Port Said Private University',       city:'بورسعيد', city_en:'Port Said', students_count:35000 },
    { id:2, name:'جامعة شرق بورسعيد الأهلية',    name_en:'East Port Said Private University',   city:'بورسعيد', city_en:'Port Said', students_count:8000  },
    { id:3, name:'جامعة شرق بورسعيد الأهلية',     name_en:'East Port Said Private University',   city:'بورسعيد', city_en:'Port Said', students_count:28000 },
    { id:4, name:'جامعة شرق بورسعيد الأهلية', name_en:'East Port Said Private University',  city:'بورسعيد',    city_en:'Port Said', students_count:40000 },
    { id:5, name:'جامعة شرق بورسعيد الأهلية',       name_en:'East Port Said Private University',       city:'بورسعيد', city_en:'Port Said', students_count:15000 },
  ],
  users: [],
}

// ── DB version — bump this to force-reset localStorage on next load ──────────
const DB_VERSION = '22'
;(function initDB() {
  if (localStorage.getItem('mock_db_version') !== DB_VERSION) {
    Object.keys(localStorage)
      .filter(k => k.startsWith('mock_'))
      .forEach(k => localStorage.removeItem(k))
    localStorage.setItem('mock_db_version', DB_VERSION)
  }
})()

// ── Auto-rollover: after 6pm move today's trips to next workday ─────────────
// Rules:
//  1. Only trips whose date = today get rolled over
//  2. If trip_date is Fri or Sat → moderator set it manually → never touch it
//  3. Runs on page load + every minute to catch the exact 6pm moment
function rolloverTrips() {
  const now  = new Date()
  const pad  = n => String(n).padStart(2, '0')
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const CUTOFF = 18 * 60 // 6:00 PM

  if (currentMinutes < CUTOFF) return // not yet 6pm

  const raw = localStorage.getItem('mock_trips')
  const trips = raw ? JSON.parse(raw) : null
  if (!trips) return // seed not initialised yet

  // Eligible: active + date = today (regardless of what day it is)
  const eligible = trips.filter(t =>
    t.status === 'active' && t.trip_date === todayStr
  )
  if (eligible.length === 0) return

  // Next workday (skip Fri & Sat)
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  while (d.getDay() === 5 || d.getDay() === 6) d.setDate(d.getDate() + 1)
  const nextDay = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

  const eligibleIds = new Set(eligible.map(t => t.id))
  const updated = trips.map(t => eligibleIds.has(t.id) ? { ...t, trip_date: nextDay } : t)
  localStorage.setItem('mock_trips', JSON.stringify(updated))
}
;(function() {
  rolloverTrips()
  setInterval(rolloverTrips, 60 * 1000) // re-check every minute
})()

// ── Storage helpers ───────────────────────────────────────────────────────────
function localDateStr(d) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}
function nextWorkdayFrom(fromDate) {
  const d = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() + 1)
  while (d.getDay() === 5 || d.getDay() === 6) d.setDate(d.getDate() + 1)
  return localDateStr(d)
}
function getStore(key) {
  try {
    const raw = localStorage.getItem('mock_' + key)
    if (raw) return JSON.parse(raw)
    localStorage.setItem('mock_' + key, JSON.stringify(SEED[key] || []))
    if (key === 'trips') rolloverTrips() // run rollover immediately after seed is written
    return SEED[key] || []
  } catch { return SEED[key] || [] }
}
function setStore(key, data) { localStorage.setItem('mock_' + key, JSON.stringify(data)) }
function nextId(arr) { return arr.length ? Math.max(...arr.map(x => x.id || 0)) + 1 : 1 }

// ── Cash No-Show Blacklist ────────────────────────────────────────────────────
// Tracks per-student cash no-show strikes. After 3 strikes → cash blocked.
const CASH_STRIKES_KEY = 'cash_no_show_strikes'
const CASH_BLOCK_LIMIT = 3

function getCashStrikes() {
  try { return JSON.parse(localStorage.getItem(CASH_STRIKES_KEY) || '{}') } catch { return {} }
}
function saveCashStrikes(data) { localStorage.setItem(CASH_STRIKES_KEY, JSON.stringify(data)) }

export function getCashStrikeCount(userId) {
  const strikes = getCashStrikes()
  return strikes[String(userId)]?.count || 0
}
export function isCashBlocked(userId) {
  return getCashStrikeCount(userId) >= CASH_BLOCK_LIMIT
}
export function addCashStrike(userId, studentName, tripPlace, tripDate) {
  const strikes = getCashStrikes()
  const uid = String(userId)
  if (!strikes[uid]) strikes[uid] = { count: 0, student_name: studentName, history: [] }
  strikes[uid].count += 1
  strikes[uid].student_name = studentName || strikes[uid].student_name
  strikes[uid].history.push({ tripPlace, tripDate, at: new Date().toISOString() })
  saveCashStrikes(strikes)
  return strikes[uid].count
}
export function getAllCashStrikes() {
  const strikes = getCashStrikes()
  return Object.entries(strikes).map(([userId, data]) => ({
    userId, ...data,
    blocked: data.count >= CASH_BLOCK_LIMIT,
  }))
}
export function resetCashStrikes(userId) {
  const strikes = getCashStrikes()
  delete strikes[String(userId)]
  saveCashStrikes(strikes)
}

function makeCollection(key, enrichFn = x => x) {
  return {
    list:   ()         => getStore(key).map(enrichFn),
    get:    (id)       => getStore(key).find(x => x.id === Number(id)),
    create: (data)     => {
      const store = getStore(key)
      const item  = enrichFn({ ...data, id: nextId(store) })
      store.push(item)
      setStore(key, store)
      return item
    },
    update: (id, data) => {
      const store = getStore(key)
      const idx   = store.findIndex(x => x.id === Number(id))
      if (idx === -1) throw new Error('Not found')
      store[idx] = enrichFn({ ...store[idx], ...data })
      setStore(key, store)
      return store[idx]
    },
    delete: (id) => {
      const store = getStore(key)
      setStore(key, store.filter(x => x.id !== Number(id)))
      return { deleted: true }
    },
  }
}

function enrichTrip(trip) {
  const buses  = getStore('buses')
  const places = getStore('places')
  const scheds = getStore('schedules')
  const bus    = buses.find(b => b.id === Number(trip.bus))
  const place  = places.find(p => p.id === Number(trip.place))
  const sched  = scheds.find(s => s.id === Number(trip.schedule))
  const capacity = bus?.capacity || 0
  const drivers = getStore('drivers')
  const driver  = drivers.find(d => d.id === Number(trip.driver_id))

  // Round trips get TWO separate seat arrays: seats_go & seats_return
  let seats, seats_go, seats_return, available_seats, available_seats_go, available_seats_return
  if (trip.trip_type === 'round') {
    seats_go     = trip.seats_go     || Array(capacity).fill(null)
    seats_return = trip.seats_return || Array(capacity).fill(null)
    // legacy: if only seats[] exists, copy to seats_go
    if (!trip.seats_go && trip.seats) seats_go = [...trip.seats]
    seats = seats_go // default for non-virtual access
    available_seats_go     = seats_go.filter(s => !s).length
    available_seats_return = seats_return.filter(s => !s).length
    available_seats = available_seats_go // moderator sees go seats count
  } else {
    seats = trip.seats || Array(capacity).fill(null)
    available_seats = seats.filter(s => !s).length
  }

  return {
    ...trip,
    driver_id:             trip.driver_id || null,
    driver_name:           driver?.user_name || trip.driver_name || '',
    driver_userId:         findUserIdByName(driver?.user_name) || driver?.user_id || trip.driver_userId || null,
    bus_plate:             bus?.plate_number    || trip.bus_plate    || '',
    bus_plate_en:          bus?.plate_en        || trip.bus_plate_en || '',
    bus_capacity:          capacity,
    bus_color_en:          bus?.color_en        || trip.bus_color_en || '',
    bus_color:             bus?.color           || trip.bus_color    || '',
    bus_image_url:         bus?.image_url       || trip.bus_image_url|| '',
    bus_has_ac:            bus?.has_ac          ?? trip.bus_has_ac   ?? false,
    place_name:            place?.place_name    || trip.place_name   || '',
    place_name_en:         place?.place_name_en || trip.place_name_en|| '',
    schedule_time:         trip.schedule_time  || sched?.schedule_time || '',
    seats,
    seats_go:              seats_go || seats,
    seats_return:          seats_return || seats,
    available_seats,
    available_seats_go:    available_seats_go    ?? available_seats,
    available_seats_return:available_seats_return ?? available_seats,
  }
}

const busColl     = makeCollection('buses')
const placeColl   = makeCollection('places')
const schedColl   = makeCollection('schedules')
const routeColl   = makeCollection('routes')
const driverColl  = makeCollection('drivers')
const uniColl     = makeCollection('universities')
const studentColl = makeCollection('students')
const resColl     = makeCollection('reservations')
const paymentColl = makeCollection('payments')
const subColl     = makeCollection('subscriptions')
const tripColl    = makeCollection('trips', enrichTrip)

const delay = (ms = 120) => new Promise(r => setTimeout(r, ms))
const ok    = (data)     => ({ data })

// Helper — get current logged-in userId
function getCurrentUserId() {
  try {
    const u = JSON.parse(localStorage.getItem('user'))
    return u?.id ? String(u.id) : 'demo_student'
  } catch { return 'demo_student' }
}


// ── Send notification to a specific user's localStorage ─────────────────────
function sendNotificationToUser(userId, messageAr, type = 'info', messageEn = null) {
  if (!userId) return
  const k = 'notifications_' + userId
  try {
    const existing = JSON.parse(localStorage.getItem(k) || '[]')
    const n = {
      id: Date.now() + Math.random(),
      message_ar: messageAr,
      message_en: messageEn || messageAr,
      message:    messageAr,
      type, is_read: false, created_at: new Date().toISOString()
    }
    localStorage.setItem(k, JSON.stringify([n, ...existing.slice(0, 29)]))
  } catch {}
}

// Find all user IDs with a given role in demoDB
function findUserIdsByRole(role) {
  try {
    const db = JSON.parse(localStorage.getItem('demoDB') || '{}')
    return Object.values(db)
      .filter(r => r.user?.role === role || r.user?.role_name === role)
      .map(r => r.user.id)
  } catch { return [] }
}

// ── Look up demoDB user by role+name to find their userId ────────────────────
function findUserIdByName(name) {
  try {
    const db = JSON.parse(localStorage.getItem('demoDB') || '{}')
    for (const record of Object.values(db)) {
      if (record.user?.user_name === name) return record.user.id
    }
  } catch {}
  return null
}

export const mock = {
  getBuses:    async ()      => { await delay(); return ok(busColl.list()) },
  createBus:   async (d)     => { await delay(); return ok(busColl.create(d)) },
  updateBus:   async (id, d) => { await delay(); return ok(busColl.update(id, d)) },
  deleteBus:   async (id)    => { await delay(); return ok(busColl.delete(id)) },

  getPlaces:   async ()      => { await delay(); return ok(placeColl.list()) },
  createPlace: async (d)     => { await delay(); return ok(placeColl.create(d)) },
  updatePlace: async (id, d) => { await delay(); return ok(placeColl.update(id, d)) },
  deletePlace: async (id)    => { await delay(); return ok(placeColl.delete(id)) },

  getSchedules:   async ()   => { await delay(); return ok(schedColl.list()) },
  createSchedule: async (d)  => { await delay(); return ok(schedColl.create(d)) },
  deleteSchedule: async (id) => { await delay(); return ok(schedColl.delete(id)) },

  getTrips: async () => {
    await delay()
    // ensure seed is loaded into localStorage first
    getStore('trips')
    // Rollover: after 6pm, move today's active trips to next workday.
    // IMPORTANT: trips with a future date (set by moderator) are NEVER touched.
    ;(function rolloverInGetTrips() {
      const now = new Date()
      const pad = n => String(n).padStart(2, '0')
      const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      const CUTOFF = 18 * 60 // 6pm

      if (currentMinutes < CUTOFF) return // before 6pm — nothing to roll

      const trips = getStore('trips')
      const todayActive = trips.filter(t => t.status === 'active' && t.trip_date === todayStr)
      if (todayActive.length === 0) return

      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      while (d.getDay() === 5 || d.getDay() === 6) d.setDate(d.getDate() + 1)
      const nextDay = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

      let changed = false
      const updated = trips.map(t => {
        if (t.status !== 'active' || t.trip_date !== todayStr) return t
        changed = true
        return { ...t, trip_date: nextDay }
      })
      if (changed) setStore('trips', updated)
    })()
    return ok(tripColl.list())
  },
  createTrip:  async (d)     => {
    await delay()
    const trip = tripColl.create(d)
    // Notifications are handled by BusModTrips.jsx to avoid duplicates
    return ok(trip)
  },
  updateTrip:  async (id, d) => { await delay(); return ok(tripColl.update(id, d)) },
  deleteTrip:  async (id)    => { await delay(); return ok(tripColl.delete(id)) },

  getRoutes:   async ()      => { await delay(); return ok(routeColl.list()) },
  createRoute: async (d)     => { await delay(); return ok(routeColl.create(d)) },
  updateRoute: async (id, d) => { await delay(); return ok(routeColl.update(id, d)) },
  deleteRoute: async (id)    => { await delay(); return ok(routeColl.delete(id)) },

  getDrivers:   async ()     => { await delay(); return ok(driverColl.list()) },
  createDriver: async (d)    => { await delay(); return ok(driverColl.create(d)) },
  updateDriver: async (id,d) => { await delay(); return ok(driverColl.update(id, d)) },
  deleteDriver: async (id)   => { await delay(); return ok(driverColl.delete(id)) },

  getStudents:   async ()    => { await delay(); return ok(studentColl.list()) },
  createStudent: async (d)   => { await delay(); return ok(studentColl.create(d)) },
  deleteStudent: async (id)  => { await delay(); return ok(studentColl.delete(id)) },

  // ── Reservations — filtered by current user ─────────────────────────────────
  getReservations: async () => { await delay(); return ok(resColl.list()) },

  getMyReservations: async () => {
    await delay()
    const userId = getCurrentUserId()
    // Match by userId OR by student_name matching current user's name
    const user   = JSON.parse(localStorage.getItem('user') || '{}')
    const today  = new Date().toISOString().split('T')[0]
    const all    = resColl.list()

    // Auto-delete reservations only after the full trip DAY has ended (midnight)
    // Cancelled reservations are NEVER auto-deleted — they stay visible to the student
    const nowMs = Date.now()
    const expired = all.filter(r => {
      if (String(r.userId) !== String(userId)) return false
      if (!r.trip_date) return false
      if (r.status === 'cancelled') return false // keep cancelled — never auto-delete
      try {
        // Delete only after the trip date's day is fully over (next day 00:00)
        const endOfTripDay = new Date(r.trip_date + 'T23:59:59').getTime()
        return nowMs > endOfTripDay
      } catch { return false }
    })
    expired.forEach(r => resColl.delete(Number(r.id)))

    const mine = resColl.list().filter(r =>
      String(r.userId) === String(userId)
    )
    return ok(mine)
  },

  // ── Create reservation — book a specific seat ────────────────────────────────
  createReservation: async (d) => {
    await delay()
    // Weekend check removed — moderator controls trip dates
    const userId = getCurrentUserId()
    const all    = resColl.list()

    // Prevent double-booking same trip
    // For round trips: allow one go booking + one return booking on the same trip id
    const tripRecord = getStore('trips').find(t => t.id === Number(d.trip))
    const isRoundTrip = tripRecord?.trip_type === 'round'
    const existing = all.find(r => {
      if (r.status === 'cancelled') return false
      if (Number(r.trip) !== Number(d.trip)) return false
      const sameUser = String(r.userId) === String(userId) || r.student_name === d.student_name
      if (!sameUser) return false
      if (isRoundTrip) {
        // Only block if same trip_type (go vs return)
        return (r.trip_type || 'go') === (d.trip_type || 'go')
      }
      return true
    })
    if (existing) throw new Error('Already booked')

    // Mark seat in trip — for round trips use seats_go or seats_return
    const seatNum = d.seat_number
    if (seatNum !== undefined && seatNum !== null) {
      const trips = getStore('trips')
      const ti    = trips.findIndex(t => t.id === Number(d.trip))
      if (ti !== -1) {
        const isRound = trips[ti].trip_type === 'round'
        const bookingType = d.trip_type || 'go'
        if (isRound) {
          const seatKey = bookingType === 'return' ? 'seats_return' : 'seats_go'
          const avKey   = bookingType === 'return' ? 'available_seats_return' : 'available_seats_go'
          const seats   = [...(trips[ti][seatKey] || Array(trips[ti].bus_capacity || 45).fill(null))]
          if (seats[seatNum - 1] && seats[seatNum - 1] !== 'taken') throw new Error('Seat already taken')
          seats[seatNum - 1] = userId
          trips[ti][seatKey] = seats
          trips[ti][avKey]   = seats.filter(s => !s).length
          // keep legacy seats in sync with go seats for moderator view
          if (bookingType === 'go') trips[ti].seats = seats
        } else {
          const seats = [...(trips[ti].seats || [])]
          if (seats[seatNum - 1] && seats[seatNum - 1] !== 'taken') throw new Error('Seat already taken')
          seats[seatNum - 1] = userId
          trips[ti].seats = seats
          trips[ti].available_seats = seats.filter(s => !s).length
        }
        setStore('trips', trips)
      }
    }

    // ── Deadline: use what the form sent, or calculate from trip time ─────────
    let deadline
    if (d.confirm_deadline) {
      // trust the deadline calculated in StudentTrips.jsx
      deadline = d.confirm_deadline
    } else {
      try {
        const tripDate = d.trip_date || new Date().toISOString().split('T')[0]
        const [hh, mm] = (d.schedule_time || '00:00').split(':').map(Number)
        const depMs = new Date(`${tripDate}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00`).getTime()
        const deadlineMs = depMs - 30 * 60 * 1000
        deadline = new Date(deadlineMs).toISOString()
      } catch {
        deadline = new Date(Date.now() + 30 * 60 * 1000).toISOString()
      }
    }
    // If the deadline is already in the past (e.g. booked within 30 min of departure),
    // treat as instant: skip confirm flow, go straight to payment selection
    const deadlineAlreadyPast = new Date(deadline).getTime() <= Date.now()
    const isInstant = d.instant_confirm === true || d.status === 'confirmed' || deadlineAlreadyPast
    const resStatus = isInstant ? 'pending_payment' : 'pending_confirm'
    const resDeadline = isInstant ? null : deadline
    const newRes = resColl.create({ ...d, userId, status: resStatus, confirm_deadline: resDeadline, instant_confirm: isInstant, created_at: new Date().toISOString() })

    // ── Notify bus_mod + driver if trip just became full ─────────────────────
    const refreshedTrips = getStore('trips')
    const updatedTrip = refreshedTrips.find(t => t.id === Number(d.trip))
    if (updatedTrip && updatedTrip.available_seats === 0) {
      const msgAr = `🚌 اكتملت الرحلة إلى ${updatedTrip.place_name || ''} الساعة ${updatedTrip.schedule_time || ''} — جميع المقاعد محجوزة`
      const msgEn = `🚌 Trip to ${updatedTrip.place_name_en || updatedTrip.place_name || ''} at ${updatedTrip.schedule_time || ''} is now FULL — all seats booked`

      // Notify driver
      if (updatedTrip.driver_userId) {
        sendNotificationToUser(updatedTrip.driver_userId, msgAr, 'warning', msgEn)
      } else if (updatedTrip.driver_id) {
        const driverRec = getStore('drivers').find(dr => dr.id === Number(updatedTrip.driver_id))
        if (driverRec) {
          const dUid = findUserIdByName(driverRec.user_name)
          if (dUid) sendNotificationToUser(dUid, msgAr, 'warning', msgEn)
        }
      }

      // Notify all bus_mod users
      const busModIds = findUserIdsByRole('bus_mod')
      busModIds.forEach(uid => sendNotificationToUser(uid, msgAr, 'warning', msgEn))
    }

    // ── Notify bus_mod users about new pending_confirm reservation ───────────
    const pendingMsgAr = `⏳ حجز جديد بانتظار التأكيد — ${d.trip_place || ''} ${d.schedule_time || ''} — الطالب: ${d.student_name || ''} — المقعد: ${d.seat_number || '—'}`
    const pendingMsgEn = `⏳ New reservation pending confirmation — ${d.trip_place_en || d.trip_place || ''} ${d.schedule_time || ''} — Student: ${d.student_name || ''} — Seat: ${d.seat_number || '—'}`
    const allBusModIds = findUserIdsByRole('bus_mod')
    allBusModIds.forEach(uid => sendNotificationToUser(uid, pendingMsgAr, 'warning', pendingMsgEn))

    return ok(newRes)
  },

  updateReservation: async (id, d) => { await delay(); return ok(resColl.update(id, d)) },

  getPayments:      async () => { await delay(); return ok(paymentColl.list()) },
  getSubscriptions: async () => {
    await delay()
    const userId = getCurrentUserId()
    const user   = JSON.parse(localStorage.getItem('user') || '{}')
    const all    = subColl.list()
    // If student role, return only their subscriptions
    if (user.role === 'student') {
      const mine = all.filter(s => String(s.userId) === String(userId) || s.student === user.user_name)
      return ok(mine)
    }
    return ok(all)
  },

  getUniversities:  async () => { await delay(); return ok(uniColl.list()) },
  createUniversity: async (d)    => { await delay(); return ok(uniColl.create(d)) },
  deleteUniversity: async (id)   => { await delay(); return ok(uniColl.delete(id)) },

  getDashboardStats: async () => {
    await delay()
    return ok({
      total_trips:          getStore('trips').length,
      active_reservations:  getStore('reservations').filter(r=>r.status==='confirmed').length,
      total_students:       getStore('students').length,
      total_buses:          getStore('buses').length,
      today_trips:          getStore('trips').filter(t=>t.status==='active').length,
      revenue_month:        getStore('payments').filter(p=>p.status==='paid').reduce((s,p)=>s+(p.amount||0),0),
      pending_payments:     getStore('payments').filter(p=>p.status==='pending').length,
      active_subscriptions: getStore('subscriptions').filter(s=>s.status==='active').length,
    })
  },

  getUsers: async () => {
    await delay()
    try {
      const db = JSON.parse(localStorage.getItem('demoDB') || '{}')
      return ok(Object.values(db).map(r => r.user))
    } catch { return ok([]) }
  },
}

mock.updateStudent    = async (id,d) => { await delay(); return ok(studentColl.update(id,d)) }
mock.updateUniversity = async (id,d) => { await delay(); return ok(uniColl.update(id,d)) }

mock.updateUser = async (id, d) => {
  await delay()
  try {
    const db = JSON.parse(localStorage.getItem('demoDB') || '{}')
    for (const k of Object.keys(db)) {
      if (db[k].user.id === Number(id)) { db[k].user = { ...db[k].user, ...d }; break }
    }
    localStorage.setItem('demoDB', JSON.stringify(db))
    return ok(d)
  } catch { return ok(d) }
}
mock.deleteUser = async (id) => {
  await delay()
  try {
    const db = JSON.parse(localStorage.getItem('demoDB') || '{}')
    for (const k of Object.keys(db)) {
      if (db[k].user.id === Number(id)) { delete db[k]; break }
    }
    localStorage.setItem('demoDB', JSON.stringify(db))
    return ok({ deleted:true })
  } catch { return ok({ deleted:true }) }
}

const subCollection = makeCollection('subscriptions')
mock.createSubscription = async (d)  => {
  await delay()
  const userId = getCurrentUserId()
  const user   = JSON.parse(localStorage.getItem('user') || '{}')
  const sub = subCollection.create({ ...d, userId, student: d.student || user.user_name, status: d.status || 'pending_review' })
  // Notify all bus_mod users about new subscription request
  const busModIds = findUserIdsByRole('bus_mod')
  const studentName = d.student || user.user_name || ''
  const planName    = d.plan_ar || d.plan || ''
  const method      = d.payment_method === 'instapay' ? 'InstaPay' : d.payment_method === 'cash' ? 'كاش' : d.payment_method || ''
  const msgAr = `📋 طلب اشتراك جديد — ${studentName} — باقة ${planName} — الدفع: ${method}`
  const msgEn = `📋 New subscription request — ${studentName} — ${d.plan || planName} plan — Payment: ${method}`
  busModIds.forEach(uid => sendNotificationToUser(uid, msgAr, 'info', msgEn))
  return ok(sub)
}

// Bus mod approves/rejects subscription
mock.approveSubscription = async (id) => {
  await delay()
  const sub = subCollection.list().find(s => s.id === Number(id))
  const updated = subCollection.update(id, { status: 'active' })
  if (sub) {
    const msgAr = `✅ تهانينا! تم قبول اشتراكك في باقة ${sub.plan_ar || sub.plan || ''} — استمتع بخدمات النقل!`
    const msgEn = `✅ Congratulations! Your ${sub.plan || ''} subscription has been approved — enjoy the service!`
    if (sub.userId) sendNotificationToUser(sub.userId, msgAr, 'success', msgEn)
  }
  return ok(updated)
}

mock.rejectSubscription = async (id, reason) => {
  await delay()
  const sub = subCollection.list().find(s => s.id === Number(id))
  const updated = subCollection.update(id, { status: 'rejected', reject_reason: reason || '' })
  if (sub) {
    const msgAr = `❌ عذراً، تم رفض طلب اشتراكك في باقة ${sub.plan_ar || sub.plan || ''}. ${reason ? 'السبب: ' + reason : ''}`
    const msgEn = `❌ Sorry, your ${sub.plan || ''} subscription request was rejected. ${reason ? 'Reason: ' + reason : ''}`
    if (sub.userId) sendNotificationToUser(sub.userId, msgAr, 'error', msgEn)
  }
  return ok(updated)
}
mock.cancelSubscription = async (id) => { await delay(); return ok(subCollection.update(id, { status:'cancelled' })) }

mock.cancelReservation = async (id) => {
  await delay()
  const res = resColl.list().find(r => r.id === Number(id))
  if (res) {
    // Free the seat in the trip
    const trips = getStore('trips')
    const ti = trips.findIndex(t => t.id === Number(res.trip))
    if (ti !== -1 && res.seat_number) {
      const isRound = trips[ti].trip_type === 'round'
      if (isRound) {
        const seatKey = (res.trip_type || 'go') === 'return' ? 'seats_return' : 'seats_go'
        const avKey   = (res.trip_type || 'go') === 'return' ? 'available_seats_return' : 'available_seats_go'
        const seats   = [...(trips[ti][seatKey] || [])]
        seats[res.seat_number - 1] = null
        trips[ti][seatKey] = seats
        trips[ti][avKey]   = seats.filter(s => !s).length
        if ((res.trip_type || 'go') === 'go') trips[ti].seats = seats
      } else {
        const seats = [...(trips[ti].seats || [])]
        seats[res.seat_number - 1] = null
        trips[ti].seats = seats
        trips[ti].available_seats = seats.filter(s => !s).length
      }
      setStore('trips', trips)
    }
    // Delete the reservation completely so it disappears from UI
    resColl.delete(Number(id))
    return ok({ cancelled: true })
  }
  return ok({ cancelled: true })
}
mock.confirmReservation = async (id) => {
  await delay()
  const res = resColl.list().find(r => r.id === Number(id))
  // Generate a unique QR token that encodes all trip+student info
  const qrToken = `UNIBUS-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`
  const updated = resColl.update(id, { status: 'confirmed', confirm_deadline: null, qr_token: qrToken })
  // Notify bus_mod of confirmed reservation
  if (res) {
    const msgAr = `✅ أكد الطالب ${res.student_name || ''} حجزه — ${res.trip_place || ''} ${res.schedule_time || ''} — مقعد ${res.seat_number || '—'}`
    const msgEn = `✅ Student ${res.student_name || ''} confirmed booking — ${res.trip_place_en || res.trip_place || ''} at ${res.schedule_time || ''} — Seat ${res.seat_number || '—'}`
    const busModIds = findUserIdsByRole('bus_mod')
    busModIds.forEach(uid => sendNotificationToUser(uid, msgAr, 'success', msgEn))
  }
  return ok(updated)
}

// ── Auto-expire pending_confirm reservations whose deadline has passed ────────
mock.autoExpireReservations = () => {
  const now = Date.now()
  const todayStr = new Date().toISOString().split('T')[0]
  const all = resColl.list()

  // 1. لغي الحجوزات اللي فات confirm_deadline بتاعها
  const deadlineExpired = all.filter(r =>
    r.status === 'pending_confirm' &&
    r.confirm_deadline &&
    now > new Date(r.confirm_deadline).getTime()
  )
  deadlineExpired.forEach(r => {
    try {
      const trips = getStore('trips')
      const ti = trips.findIndex(t => t.id === Number(r.trip))
      if (ti !== -1) {
        const seats = [...(trips[ti].seats || [])]
        if (r.seat_number) seats[r.seat_number - 1] = null
        trips[ti].seats = seats
        trips[ti].available_seats = seats.filter(s => !s).length
        setStore('trips', trips)
      }
    } catch {}
    try { resColl.update(Number(r.id), { status: 'cancelled', confirm_deadline: null }) } catch {}
    const msgAr = '❌ انتهت مهلة تأكيد حجزك — تم إلغاء الحجز تلقائياً'
    const msgEn = '❌ Confirmation deadline passed — booking auto-cancelled'
    try { if (r.userId) sendNotificationToUser(r.userId, msgAr, 'error', msgEn) } catch {}
  })

  // 2. لغي أي حجز تاريخ رحلته عدى — يوم بيوم
  // الحجز بيكون منتهي لو trip_date < النهارده
  // (لو trip_date = النهارده لسه شغال حتى نهاية اليوم)
  const pastDateExpired = all.filter(r =>
    r.trip_date &&
    r.trip_date < todayStr &&
    r.status !== 'cancelled' &&
    r.status !== 'completed'
  )
  pastDateExpired.forEach(r => {
    try {
      // حرر المقعد على الرحلة
      const trips = getStore('trips')
      const ti = trips.findIndex(t => t.id === Number(r.trip))
      if (ti !== -1) {
        const seats = [...(trips[ti].seats || [])]
        if (r.seat_number) seats[r.seat_number - 1] = null
        trips[ti].seats = seats
        trips[ti].available_seats = seats.filter(s => !s).length
        setStore('trips', trips)
      }
    } catch {}
    // حط status = 'completed' مش cancelled — الرحلة خلصت مش اتلغت
    try { resColl.update(Number(r.id), { status: 'completed' }) } catch {}
  })
}

// ── Send warning 30 min before the confirm_deadline (= 1 hour before trip) ────
// Timeline: Trip 07:00 → Deadline 06:30 → Warning sent at 06:00
// The warning tells the student: "you have 30 min left to confirm before deadline"
mock.checkAndSendWarnings = () => {
  const now = Date.now()
  const WARNED_KEY = 'mock_warned_reservations'
  let warned = []
  try { warned = JSON.parse(localStorage.getItem(WARNED_KEY) || '[]') } catch {}

  const all = resColl.list()
  all.forEach(r => {
    if (r.status !== 'pending_confirm') return
    if (!r.confirm_deadline) return
    if (warned.includes(r.id)) return

    // Don't warn if reservation was created less than 2 minutes ago (just booked)
    if (r.created_at) {
      const age = now - new Date(r.created_at).getTime()
      if (age < 2 * 60 * 1000) return
    }

    const deadlineMs = new Date(r.confirm_deadline).getTime()
    const msUntilDeadline = deadlineMs - now
    const WARN_WINDOW = 30 * 60 * 1000 // warn when 30 min left before deadline

    // Fire warning once: when deadline is 30 min away (still in the future)
    if (msUntilDeadline > 0 && msUntilDeadline <= WARN_WINDOW) {
      const minsToDeadline = Math.ceil(msUntilDeadline / 60000)
      const msgAr = `⚠️ تنبيه! لديك ${minsToDeadline} دقيقة فقط لتأكيد حجزك لرحلة ${r.trip_place || ''} الساعة ${r.schedule_time || ''} — إذا لم تؤكد قبل انتهاء المهلة سيُلغى حجزك تلقائياً!`
      const msgEn = `⚠️ Reminder! You have ${minsToDeadline} min left to confirm your booking for the trip to ${r.trip_place_en || r.trip_place || ''} at ${r.schedule_time || ''} — if you don't confirm before the deadline your booking will be automatically cancelled!`
      if (r.userId) sendNotificationToUser(r.userId, msgAr, 'warning', msgEn)
      warned.push(r.id)
    }
  })
  try { localStorage.setItem(WARNED_KEY, JSON.stringify(warned)) } catch {}
}

// ══════════════════════════════════════════════════════════════════════════════
// WAITLIST / NO-SHOW / CREDIT BALANCE — mock support
// ══════════════════════════════════════════════════════════════════════════════

const WL_KEY = 'mock_waitlist'
const CB_KEY = 'mock_credit_balances'

function getWaitlist()   { try { return JSON.parse(localStorage.getItem(WL_KEY) || '[]') } catch { return [] } }
function saveWaitlist(d) { localStorage.setItem(WL_KEY, JSON.stringify(d)) }
function getCredits()    { try { return JSON.parse(localStorage.getItem(CB_KEY) || '[]') } catch { return [] } }
function saveCredits(d)  { localStorage.setItem(CB_KEY, JSON.stringify(d)) }

// ── auto_noshow equivalent: runs client-side after trip time + 15 min ─────────
export function runAutoNoShow() {
  const now     = new Date()
  const todayStr = localDateStr(now)
  const currMin  = now.getHours() * 60 + now.getMinutes()
  const CUTOFF   = 15  // minutes after trip time

  const trips = getStore('trips')
  const reservations = getStore('reservations') || JSON.parse(localStorage.getItem('mock_reservations') || '[]')
  const waitlist = getWaitlist()

  let added = 0
  trips.forEach(trip => {
    if (trip.trip_date !== todayStr) return
    if (trip.status !== 'active' && trip.status !== 'completed') return
    const [th, tm] = (trip.schedule_time || '').split(':').map(Number)
    if (isNaN(th)) return
    const tripMin = th * 60 + tm
    if (currMin < tripMin + CUTOFF) return  // not yet 15 min past trip time

    // Find confirmed+not-scanned reservations that departed — instapay only
    const noShows = reservations.filter(r =>
      Number(r.trip) === trip.id &&
      r.status === 'confirmed' &&
      !r.scanned &&
      r.payment_method === 'instapay'
    )

    noShows.forEach(res => {
      const alreadyIn = waitlist.some(w => w.reservation_id === res.id)
      if (alreadyIn) return

      // Track cash no-shows for blacklist (only cash method gets strikes)
      if (res.payment_method === 'cash' && res.userId) {
        addCashStrike(res.userId, res.student_name, trip.place_name, trip.trip_date)
        const strikeCount = getCashStrikeCount(res.userId)
        // Notify student of strike
        const msgAr = strikeCount >= CASH_BLOCK_LIMIT
          ? `🚫 تم حظرك من الدفع بالكاش — لقد سجّلت ${strikeCount} مرات حجز بكاش وعدم ركوب. يمكنك الدفع عبر InstaPay فقط من الآن.`
          : `⚠️ تحذير (${strikeCount}/${CASH_BLOCK_LIMIT}): لقد حجزت بكاش ولم تركب — لو تكررت ${CASH_BLOCK_LIMIT - strikeCount} مرة أخرى سيتم حظر خيار الكاش عندك.`
        const msgEn = strikeCount >= CASH_BLOCK_LIMIT
          ? `🚫 Cash payment blocked — you have ${strikeCount} cash no-shows. You can only pay via InstaPay from now on.`
          : `⚠️ Warning (${strikeCount}/${CASH_BLOCK_LIMIT}): You booked with cash and didn't board — ${CASH_BLOCK_LIMIT - strikeCount} more and cash will be blocked.`
        sendNotificationToUser(res.userId, msgAr, strikeCount >= CASH_BLOCK_LIMIT ? 'error' : 'warning', msgEn)
        // Notify bus_mod
        const busModIds = findUserIdsByRole('bus_mod')
        const modMsgAr = strikeCount >= CASH_BLOCK_LIMIT
          ? `🚫 تم حظر الطالب ${res.student_name || ''} من الكاش — ${strikeCount} مخالفات`
          : `⚠️ تحذير كاش: ${res.student_name || ''} — مخالفة ${strikeCount}/${CASH_BLOCK_LIMIT} — ${trip.place_name || ''} ${trip.trip_date}`
        const modMsgEn = strikeCount >= CASH_BLOCK_LIMIT
          ? `🚫 Student ${res.student_name || ''} blocked from cash — ${strikeCount} violations`
          : `⚠️ Cash warning: ${res.student_name || ''} — violation ${strikeCount}/${CASH_BLOCK_LIMIT} — ${trip.place_name || ''} ${trip.trip_date}`
        busModIds.forEach(uid => sendNotificationToUser(uid, modMsgAr, strikeCount >= CASH_BLOCK_LIMIT ? 'error' : 'warning', modMsgEn))
      }

      // Mark reservation as no_show
      res.status = 'no_show'

      // Add to waitlist
      waitlist.push({
        id:              Date.now() + Math.random(),
        student:         res.userId,
        student_name:    res.student_name || '',
        trip:            trip.id,
        trip_place:      trip.place_name || '',
        trip_date:       trip.trip_date,
        schedule_time:   trip.schedule_time,
        reservation_id:  res.id,
        amount_paid:     res.amount || 55,
        resolution:      'pending',
        alternatives_sent: false,
        created_at:      new Date().toISOString(),
        credit_valid_until: null,
      })
      added++
    })
  })

  if (added > 0) {
    // Save updated reservations
    localStorage.setItem('mock_reservations', JSON.stringify(reservations))
    saveWaitlist(waitlist)
  }
  return added
}

// ── Get waitlist entries (optionally filtered by studentId) ───────────────────
mock.getWaitlistEntries = async (studentId = null) => {
  await delay()
  runAutoNoShow()
  let wl = getWaitlist()
  if (studentId) wl = wl.filter(e => String(e.student) === String(studentId))
  return ok(wl)
}

// ── Student chooses refund ────────────────────────────────────────────────────
mock.chooseRefund = async (entryId) => {
  await delay()
  const wl = getWaitlist()
  const idx = wl.findIndex(e => String(e.id) === String(entryId))
  if (idx === -1) throw new Error('Entry not found')
  if (wl[idx].resolution !== 'pending') throw new Error('Already resolved')
  wl[idx].resolution  = 'refund'
  wl[idx].resolved_at = new Date().toISOString()
  saveWaitlist(wl)

  // Notify
  if (wl[idx].student) {
    sendNotificationToUser(wl[idx].student,
      `💸 طلب استرداد — سيتم رد ${wl[idx].amount_paid} ج.م خلال 24 ساعة`,
      'info',
      `💸 Refund requested — ${wl[idx].amount_paid} EGP will be returned within 24 hours`
    )
  }
  return ok(wl[idx])
}

// ── Student chooses credit (valid 1 week) ────────────────────────────────────
mock.chooseCredit = async (entryId) => {
  await delay()
  const wl = getWaitlist()
  const idx = wl.findIndex(e => String(e.id) === String(entryId))
  if (idx === -1) throw new Error('Entry not found')
  if (wl[idx].resolution !== 'pending') throw new Error('Already resolved')

  // Credit valid for 7 days from trip date
  const tripDate = new Date(wl[idx].trip_date || Date.now())
  tripDate.setDate(tripDate.getDate() + 7)
  const validUntil = localDateStr(tripDate)

  wl[idx].resolution         = 'credit'
  wl[idx].resolved_at        = new Date().toISOString()
  wl[idx].credit_valid_until = validUntil
  saveWaitlist(wl)

  // Add/update credit balance
  const credits = getCredits()
  const ci = credits.findIndex(c => String(c.student) === String(wl[idx].student))
  if (ci !== -1) {
    credits[ci].balance      = Number(credits[ci].balance) + Number(wl[idx].amount_paid)
    credits[ci].valid_until  = validUntil
    credits[ci].updated_at   = new Date().toISOString()
  } else {
    credits.push({
      id:          Date.now(),
      student:     wl[idx].student,
      balance:     Number(wl[idx].amount_paid),
      valid_until: validUntil,
      created_at:  new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    })
  }
  saveCredits(credits)

  // Notify
  if (wl[idx].student) {
    sendNotificationToUser(wl[idx].student,
      `🎫 تم إضافة رصيد ${wl[idx].amount_paid} ج.م — صالح حتى ${validUntil}`,
      'success',
      `🎫 Credit of ${wl[idx].amount_paid} EGP added — valid until ${validUntil}`
    )
  }
  return ok(wl[idx])
}

// ── Get student's credit balance ──────────────────────────────────────────────
mock.getCreditBalance = async (studentId) => {
  await delay()
  const credits = getCredits()
  const cb = credits.find(c => String(c.student) === String(studentId))
  if (!cb) return ok({ balance: 0, valid_until: null, is_valid: false })
  const today = localDateStr(new Date())
  const is_valid = Number(cb.balance) > 0 && (!cb.valid_until || cb.valid_until >= today)
  return ok({ ...cb, is_valid })
}

// ── Send alternatives (moderator action) ─────────────────────────────────────
mock.sendAlternatives = async (entryId) => {
  await delay()
  const wl = getWaitlist()
  const idx = wl.findIndex(e => String(e.id) === String(entryId))
  if (idx === -1) throw new Error('Entry not found')
  if (wl[idx].alternatives_sent) throw new Error('Already sent')

  // Find other active trips on same date
  const trips = getStore('trips')
  const alts = trips.filter(t =>
    t.trip_date === wl[idx].trip_date &&
    t.status === 'active' &&
    t.id !== wl[idx].trip &&
    (t.available_seats > 0)
  )

  wl[idx].alternatives_sent = true
  saveWaitlist(wl)

  const altList = alts.map(t => ({ id: t.id, place: t.place_name, time: t.schedule_time, available_seats: t.available_seats }))

  if (wl[idx].student) {
    const bodyAr = altList.length
      ? `الرحلات البديلة اليوم:\n${altList.map(a=>`• ${a.place} — الساعة ${a.time} (${a.available_seats} مقعد)`).join('\n')}`
      : 'لا توجد رحلات بديلة متاحة اليوم.'
    const bodyEn = altList.length
      ? `Alternative trips today:\n${altList.map(a=>`• ${a.place} at ${a.time} (${a.available_seats} seats)`).join('\n')}`
      : 'No alternative trips available today.'
    sendNotificationToUser(wl[idx].student, `📨 رحلات بديلة — ${bodyAr}`, 'info', `📨 Alternatives — ${bodyEn}`)
  }

  return ok({ ...wl[idx], alternatives: altList })
}

export default mock
