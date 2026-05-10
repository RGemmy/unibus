export const mockUser = {
  user_id: 1, user_name: 'أحمد محمد', email: 'ahmed@uni.edu',
  phone: '0501234567', role: 'admin', national_id: '1234567890'
}

export const mockStats = {
  total_trips: 128, active_reservations: 347,
  total_students: 892, total_buses: 24,
  today_trips: 12, revenue_month: 45600,
  pending_payments: 18, active_subscriptions: 215,
}

export const mockTrips = [
  { trip_id: 1, place_name: 'جامعة الملك سعود', bus_plate: 'أ ب ت 123', schedule_time: '07:30', trip_date: '2026-04-15', status: 'active', capacity: 45, reserved: 38 },
  { trip_id: 2, place_name: 'جامعة الأمير سلطان', bus_plate: 'د هـ و 456', schedule_time: '08:00', trip_date: '2026-04-15', status: 'active', capacity: 50, reserved: 42 },
  { trip_id: 3, place_name: 'جامعة الإمام', bus_plate: 'ز ح ط 789', schedule_time: '09:15', trip_date: '2026-04-15', status: 'completed', capacity: 40, reserved: 40 },
  { trip_id: 4, place_name: 'جامعة الملك عبدالعزيز', bus_plate: 'ي ك ل 012', schedule_time: '10:30', trip_date: '2026-04-16', status: 'pending', capacity: 45, reserved: 12 },
  { trip_id: 5, place_name: 'جامعة الملك فهد', bus_plate: 'م ن س 345', schedule_time: '11:00', trip_date: '2026-04-16', status: 'active', capacity: 50, reserved: 29 },
]

export const mockBuses = [
  { bus_id: 1, plate_number: 'أ ب ت 123', capacity: 45, color: 'أبيض', status: 'active' },
  { bus_id: 2, plate_number: 'د هـ و 456', capacity: 50, color: 'أصفر', status: 'active' },
  { bus_id: 3, plate_number: 'ز ح ط 789', capacity: 40, color: 'أبيض', status: 'maintenance' },
  { bus_id: 4, plate_number: 'ي ك ل 012', capacity: 45, color: 'أزرق', status: 'active' },
  { bus_id: 5, plate_number: 'م ن س 345', capacity: 50, color: 'أبيض', status: 'inactive' },
]

export const mockStudents = [
  { student_id: 1, user_name: 'سارة أحمد', faculty: 'الهندسة', program: 'هندسة البرمجيات', university: 'جامعة الملك سعود', status: 'active', subscription: true },
  { student_id: 2, user_name: 'محمد خالد', faculty: 'العلوم', program: 'علم الحاسب', university: 'جامعة الإمام', status: 'active', subscription: false },
  { student_id: 3, user_name: 'نورة سلمان', faculty: 'التجارة', program: 'محاسبة', university: 'جامعة الأمير سلطان', status: 'inactive', subscription: true },
  { student_id: 4, user_name: 'عبدالله فهد', faculty: 'الطب', program: 'طب بشري', university: 'جامعة الملك سعود', status: 'active', subscription: true },
  { student_id: 5, user_name: 'ريم عمر', faculty: 'الآداب', program: 'لغة إنجليزية', university: 'جامعة الملك عبدالعزيز', status: 'active', subscription: false },
]

export const mockReservations = [
  { id: 1, student: 'سارة أحمد', trip: 'جامعة الملك سعود - 07:30', date: '2026-04-15', status: 'confirmed', amount: 25 },
  { id: 2, student: 'محمد خالد', trip: 'جامعة الإمام - 09:15', date: '2026-04-15', status: 'pending', amount: 30 },
  { id: 3, student: 'نورة سلمان', trip: 'جامعة الأمير سلطان - 08:00', date: '2026-04-14', status: 'cancelled', amount: 28 },
  { id: 4, student: 'عبدالله فهد', trip: 'جامعة الملك سعود - 07:30', date: '2026-04-15', status: 'confirmed', amount: 25 },
]

export const mockRoutes = [
  { route_id: 1, start_point: 'الرياض - حي النزهة', end_point: 'جامعة الملك سعود', schedules: 4 },
  { route_id: 2, start_point: 'الرياض - حي الملقا', end_point: 'جامعة الأمير سلطان', schedules: 3 },
  { route_id: 3, start_point: 'الرياض - حي العليا', end_point: 'جامعة الإمام', schedules: 5 },
  { route_id: 4, start_point: 'جدة - حي الروضة', end_point: 'جامعة الملك عبدالعزيز', schedules: 4 },
]
