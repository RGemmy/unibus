/**
 * api.js — All API calls go through the mock layer (no real backend needed).
 * When you connect a real backend, swap mock.X() calls with axios calls here.
 */
import { mock } from './mockDb'

export default { put: ()=>{}, post: ()=>{}, get: ()=>{} } // kept for ProfilePage compatibility

// ─── Auth ─────────────────────────────────────────────────
export const login    = () => Promise.resolve({ data: {} })
export const logout   = () => Promise.resolve()
export const getProfile = () => Promise.resolve({ data: {} })

// ─── Dashboard ────────────────────────────────────────────
export const getDashboardStats = () => mock.getDashboardStats()

// ─── Buses ────────────────────────────────────────────────
export const getBuses    = ()         => mock.getBuses()
export const createBus   = (data)     => mock.createBus(data)
export const updateBus   = (id, data) => mock.updateBus(id, data)
export const deleteBus   = (id)       => mock.deleteBus(id)

// ─── Places ───────────────────────────────────────────────
export const getPlaces    = ()         => mock.getPlaces()
export const createPlace  = (data)     => mock.createPlace(data)
export const updatePlace  = (id, data) => mock.updatePlace(id, data)
export const deletePlace  = (id)       => mock.deletePlace(id)

// ─── Schedules ────────────────────────────────────────────
export const getSchedules    = ()      => mock.getSchedules()
export const createSchedule  = (data)  => mock.createSchedule(data)
export const deleteSchedule  = (id)    => mock.deleteSchedule(id)

// ─── Routes ───────────────────────────────────────────────
export const getRoutes    = ()         => mock.getRoutes()
export const createRoute  = (data)     => mock.createRoute(data)
export const updateRoute  = (id, data) => mock.updateRoute(id, data)
export const deleteRoute  = (id)       => mock.deleteRoute(id)

// ─── Trips ────────────────────────────────────────────────
export const getTrips    = ()         => mock.getTrips()
export const getTripById = (id)       => mock.getTrips().then(r => ({ data: r.data.find(t=>t.id===Number(id)) }))
export const createTrip  = (data)     => mock.createTrip(data)
export const updateTrip  = (id, data) => mock.updateTrip(id, data)
export const deleteTrip  = (id)       => mock.deleteTrip(id)

// ─── Students ─────────────────────────────────────────────
export const getStudents    = ()         => mock.getStudents()
export const createStudent  = (data)     => mock.createStudent(data)
export const deleteStudent  = (id)       => mock.deleteStudent(id)

// ─── Reservations ─────────────────────────────────────────
export const getReservations   = ()         => mock.getReservations()
export const getMyReservations = ()         => mock.getMyReservations()
export const createReservation = (data)     => mock.createReservation(data)
export const updateReservation = (id, data) => mock.updateReservation(id, data)

// ─── Payments ─────────────────────────────────────────────
export const getPayments = () => mock.getPayments()

// ─── Subscriptions ────────────────────────────────────────
export const getSubscriptions = () => mock.getSubscriptions()

// ─── Drivers ──────────────────────────────────────────────
export const getDrivers    = ()         => mock.getDrivers()
export const createDriver  = (data)     => mock.createDriver(data)
export const updateDriver  = (id, data) => mock.updateDriver(id, data)
export const deleteDriver  = (id)       => mock.deleteDriver(id)

// ─── Universities ─────────────────────────────────────────
export const getUniversities    = ()         => mock.getUniversities()
export const createUniversity   = (data)     => mock.createUniversity(data)
export const deleteUniversity   = (id)       => mock.deleteUniversity(id)

// ─── Users ────────────────────────────────────────────────
export const getUsers = () => mock.getUsers()

// ── Missing exports (added to match all page imports) ─────────────────────────
export const updateStudent      = (id, d) => mock.updateStudent(id, d)
export const updateUniversity   = (id, d) => mock.updateUniversity(id, d)
export const updateUser         = (id, d) => mock.updateUser(id, d)
export const deleteUser         = (id)    => mock.deleteUser(id)
export const createSubscription  = (d)          => mock.createSubscription(d)
export const cancelSubscription  = (id)         => mock.cancelSubscription(id)
export const approveSubscription = (id)         => mock.approveSubscription(id)
export const rejectSubscription  = (id, reason) => mock.rejectSubscription(id, reason)
export const cancelReservation  = (id)    => mock.cancelReservation(id)
export const confirmReservation = (id)    => mock.confirmReservation(id)
export const autoExpireReservations = () => mock.autoExpireReservations()
export const checkAndSendWarnings   = () => mock.checkAndSendWarnings()

// ── Cash Blacklist ─────────────────────────────────────────────────────────────
export { isCashBlocked, getCashStrikeCount, getAllCashStrikes, resetCashStrikes } from './mockDb.js'
