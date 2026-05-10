import React, { createContext, useContext, useState, useEffect } from 'react'

export const translations = {
  ar: {
    // ── App / Auth ────────────────────────────────────────────
    login_subtitle:'نظام النقل الجامعي المتكامل',
    login_heading:'تسجيل الدخول', login_desc:'أدخل بياناتك للمتابعة',
    email_label:'البريد الإلكتروني', password_label:'كلمة المرور',
    login_btn:'دخول', demo_btn:'🚌 تجربة النظام (Demo)',
    login_error:'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    welcome_msg:'أهلاً', copyright:'© 2026 UniBus — نظام النقل الجامعي',
    pw_mismatch:'كلمتا المرور غير متطابقتين',
    // ── Nav ───────────────────────────────────────────────────
    dashboard:'لوحة التحكم', trips:'الرحلات', routes:'المسارات',
    buses:'الباصات', places:'الأماكن', students:'الطلاب',
    reservations:'الحجوزات', subscriptions:'الاشتراكات',
    drivers:'السائقون', payments:'المدفوعات', users:'المستخدمون',
    universities:'الجامعات', home:'الرئيسية', my_trips:'رحلاتي',
    my_reservations:'حجوزاتي', track_bus:'تتبع الباص 🟢',
    my_subscription:'اشتراكي', available_trips:'الرحلات المتاحة',
    active_trip:'الرحلة الحالية 🟢', profile:'الملف الشخصي',
    logout:'تسجيل الخروج', transport_mgmt:'إدارة النقل',
    user_mgmt:'المستخدمون', finance:'المالية', system:'النظام',
    available_to_you:'المتاح لك', my_account:'حسابي', settings:'الإعدادات',
    mod_dashboard:'لوحة المشرف',
    // ── Header ────────────────────────────────────────────────
    search_placeholder:'بحث...', notifications:'الإشعارات',
    mark_all_read:'قراءة الكل', no_notifications:'لا توجد إشعارات',
    // ── Profile ───────────────────────────────────────────────
    personal_info:'المعلومات الشخصية', email:'البريد الإلكتروني',
    phone:'رقم الجوال', national_id:'رقم الهوية', role_label:'الدور',
    edit:'تعديل', cancel:'إلغاء', save_changes:'حفظ التغييرات',
    saving:'جاري الحفظ...', change_password:'تغيير كلمة المرور',
    current_password:'كلمة المرور الحالية', new_password:'كلمة المرور الجديدة',
    confirm_new_password:'تأكيد كلمة المرور', full_name:'الاسم الكامل',
    account_summary:'ملخص الحساب', account_number:'رقم الحساب',
    account_type:'نوع الحساب', account_status:'حالة الحساب',
    active:'✅ نشط', active_badge:'حساب نشط',
    save_success:'تم حفظ البيانات بنجاح', save_fail:'فشل الحفظ',
    pw_changed:'تم تغيير كلمة المرور',
    pw_change_fail:'فشل تغيير كلمة المرور',
    // ── Settings ──────────────────────────────────────────────
    language:'اللغة', language_ar:'العربية', language_en:'English',
    language_note:'سيتم تطبيق اللغة فوراً على البرنامج كله',
    // ── Roles ─────────────────────────────────────────────────
    role_admin:'مدير النظام', role_moderator:'مشرف',
    role_university_mod:'مشرف الجامعة', role_bus_mod:'مشرف شركة الباصات',
    role_student:'طالب', role_driver:'سائق',
    // ── Common actions ────────────────────────────────────────
    add:'إضافة', delete:'حذف', edit_btn:'تعديل', confirm:'تأكيد',
    search:'بحث', filter:'تصفية', all:'الكل', close:'إغلاق',
    no_data:'لا توجد بيانات', loading_txt:'جاري التحميل...',
    failed_load:'فشل تحميل البيانات', actions:'الإجراءات',
    // ── Status labels ─────────────────────────────────────────
    status_active:'نشط', status_inactive:'غير نشط',
    status_pending:'قيد الانتظار', status_completed:'مكتملة',
    status_cancelled:'ملغية', status_confirmed:'مؤكدة',
    status_maintenance:'صيانة',
    // ── Buses ─────────────────────────────────────────────────
    bus_fleet:'أسطول الباصات', add_bus:'إضافة باص', edit_bus:'تعديل باص',
    plate_number:'رقم اللوحة', capacity:'السعة', color:'اللون',
    bus_added:'تمت إضافة الباص', bus_updated:'تم تعديل الباص',
    bus_deleted:'تم حذف الباص', confirm_delete_bus:'حذف الباص؟',
    trips_count:'رحلة', seats:'مقعد',
    color_white:'أبيض', color_yellow:'أصفر', color_blue:'أزرق',
    color_red:'أحمر', color_silver:'فضي',
    // ── Trips ─────────────────────────────────────────────────
    manage_trips:'إدارة الرحلات', add_trip:'رحلة جديدة', edit_trip:'تعديل رحلة',
    trip_date:'تاريخ الرحلة', destination:'الوجهة', bus_label:'الباص',
    schedule:'الجدول الزمني', trip_time:'وقت الرحلة', seats_label:'المقاعد',
    trip_added:'تمت إضافة الرحلة', trip_updated:'تم تعديل الرحلة',
    trip_deleted:'تم حذف الرحلة', confirm_delete_trip:'حذف هذه الرحلة؟',
    no_trips:'لا توجد رحلات',
    // ── Routes ────────────────────────────────────────────────
    manage_routes:'إدارة المسارات', add_route:'مسار جديد', edit_route:'تعديل مسار',
    start_point:'نقطة الانطلاق', end_point:'نقطة الوصول', schedules_count:'جداول',
    route_added:'تمت إضافة المسار', route_updated:'تم تعديل المسار',
    route_deleted:'تم حذف المسار', no_routes:'لا توجد مسارات',
    // ── Students ──────────────────────────────────────────────
    manage_students:'إدارة الطلاب', add_student:'إضافة طالب',
    faculty:'الكلية', program:'البرنامج', university:'الجامعة',
    has_subscription:'مشترك', no_subscription:'غير مشترك',
    student_added:'تمت إضافة الطالب', student_updated:'تم تعديل الطالب',
    student_deleted:'تم حذف الطالب', no_students:'لا يوجد طلاب',
    // ── Reservations ──────────────────────────────────────────
    manage_reservations:'إدارة الحجوزات', add_reservation:'حجز جديد',
    student_name:'اسم الطالب', trip_label:'الرحلة', amount:'المبلغ',
    reservation_confirmed:'تم تأكيد الحجز', reservation_cancelled:'تم إلغاء الحجز',
    no_reservations:'لا توجد حجوزات',
    // ── Payments ──────────────────────────────────────────────
    manage_payments:'إدارة المدفوعات', payment_date:'تاريخ الدفع',
    payment_method:'طريقة الدفع', payment_status:'حالة الدفع',
    no_payments:'لا توجد مدفوعات',
    // ── Drivers ───────────────────────────────────────────────
    manage_drivers:'إدارة السائقين', add_driver:'إضافة سائق',
    license_number:'رقم الرخصة', experience:'الخبرة (سنوات)',
    driver_added:'تمت إضافة السائق', driver_deleted:'تم حذف السائق',
    no_drivers:'لا يوجد سائقون',
    // ── Places ────────────────────────────────────────────────
    manage_places:'إدارة الأماكن', add_place:'إضافة مكان',
    place_name:'اسم المكان', location:'الموقع',
    place_added:'تمت إضافة المكان', place_deleted:'تم حذف المكان',
    no_places:'لا توجد أماكن',
    // ── Universities ──────────────────────────────────────────
    manage_universities:'إدارة الجامعات', add_university:'إضافة جامعة',
    university_name:'اسم الجامعة', university_city:'المدينة',
    no_universities:'لا توجد جامعات',
    // ── Users ─────────────────────────────────────────────────
    manage_users:'إدارة المستخدمين', add_user:'إضافة مستخدم',
    user_name:'الاسم', user_role:'الدور', user_status:'الحالة',
    no_users:'لا يوجد مستخدمون',
    // ── Subscriptions ─────────────────────────────────────────
    manage_subscriptions:'إدارة الاشتراكات', subscription_type:'نوع الاشتراك',
    subscription_start:'تاريخ البدء', subscription_end:'تاريخ الانتهاء',
    no_subscriptions:'لا توجد اشتراكات',
    // ── Dashboard ─────────────────────────────────────────────
    total_trips:'إجمالي الرحلات', active_reservations:'حجوزات نشطة',
    total_students:'إجمالي الطلاب', total_buses:'إجمالي الباصات',
    today_trips:'رحلات اليوم', monthly_revenue:'إيرادات الشهر',
    pending_payments:'مدفوعات معلقة', active_subscriptions:'اشتراكات نشطة',
    recent_trips:'آخر الرحلات', recent_reservations:'آخر الحجوزات',
    // ── Moderator ─────────────────────────────────────────────
    uni_mod_desc:'متابعة الرحلات والطلاب التابعين للجامعة',
    bus_mod_desc:'إدارة الباصات والرحلات وإضافة البيانات',
    change_status:'تغيير الحالة',
    // ── Student pages ─────────────────────────────────────────
    book_seat:'احجز مقعداً', available_seats:'مقاعد متاحة',
    book_success:'تم الحجز بنجاح', already_booked:'محجوز بالفعل',
    track_title:'تتبع الباص', your_bus:'باصك',
    subscription_details:'تفاصيل الاشتراك', subscription_active:'اشتراك نشط',
    subscription_expired:'اشتراك منتهي', no_active_subscription:'لا يوجد اشتراك نشط',
    // ── Driver pages ──────────────────────────────────────────
    driver_home:'لوحة السائق', assigned_trips:'الرحلات المعيّنة',
    start_trip:'بدء الرحلة', end_trip:'إنهاء الرحلة',
    passengers:'الركاب', gps_active:'GPS نشط',
    // ── Misc ──────────────────────────────────────────────────
    year:'سنة', years:'سنوات', sar:'ر.س',
    greeting_morning:'صباح الخير', greeting_afternoon:'مساء الخير',
    greeting_evening:'مساء النور',
  },

  en: {
    // ── App / Auth ────────────────────────────────────────────
    login_subtitle:'Integrated University Transport System',
    login_heading:'Sign In', login_desc:'Enter your credentials to continue',
    email_label:'Email Address', password_label:'Password',
    login_btn:'Sign In', demo_btn:'🚌 Try Demo',
    login_error:'Incorrect email or password',
    welcome_msg:'Welcome', copyright:'© 2026 UniBus — University Transport System',
    pw_mismatch:'Passwords do not match',
    // ── Nav ───────────────────────────────────────────────────
    dashboard:'Dashboard', trips:'Trips', routes:'Routes',
    buses:'Buses', places:'Places', students:'Students',
    reservations:'Reservations', subscriptions:'Subscriptions',
    drivers:'Drivers', payments:'Payments', users:'Users',
    universities:'Universities', home:'Home', my_trips:'My Trips',
    my_reservations:'My Reservations', track_bus:'Track Bus 🟢',
    my_subscription:'My Subscription', available_trips:'Available Trips',
    active_trip:'Active Trip 🟢', profile:'Profile',
    logout:'Sign Out', transport_mgmt:'Transport Management',
    user_mgmt:'Users', finance:'Finance', system:'System',
    available_to_you:'Available to You', my_account:'My Account',
    settings:'Settings', mod_dashboard:'Moderator Dashboard',
    // ── Header ────────────────────────────────────────────────
    search_placeholder:'Search...', notifications:'Notifications',
    mark_all_read:'Mark All Read', no_notifications:'No notifications',
    // ── Profile ───────────────────────────────────────────────
    personal_info:'Personal Information', email:'Email Address',
    phone:'Phone Number', national_id:'National ID', role_label:'Role',
    edit:'Edit', cancel:'Cancel', save_changes:'Save Changes',
    saving:'Saving...', change_password:'Change Password',
    current_password:'Current Password', new_password:'New Password',
    confirm_new_password:'Confirm Password', full_name:'Full Name',
    account_summary:'Account Summary', account_number:'Account Number',
    account_type:'Account Type', account_status:'Account Status',
    active:'✅ Active', active_badge:'Active Account',
    save_success:'Data saved successfully', save_fail:'Failed to save',
    pw_changed:'Password changed successfully',
    pw_change_fail:'Failed to change password',
    // ── Settings ──────────────────────────────────────────────
    language:'Language', language_ar:'العربية', language_en:'English',
    language_note:'Language change applies instantly across the entire app',
    // ── Roles ─────────────────────────────────────────────────
    role_admin:'System Admin', role_moderator:'Moderator',
    role_university_mod:'University Moderator', role_bus_mod:'Bus Company Moderator',
    role_student:'Student', role_driver:'Driver',
    // ── Common actions ────────────────────────────────────────
    add:'Add', delete:'Delete', edit_btn:'Edit', confirm:'Confirm',
    search:'Search', filter:'Filter', all:'All', close:'Close',
    no_data:'No data available', loading_txt:'Loading...',
    failed_load:'Failed to load data', actions:'Actions',
    // ── Status labels ─────────────────────────────────────────
    status_active:'Active', status_inactive:'Inactive',
    status_pending:'Pending', status_completed:'Completed',
    status_cancelled:'Cancelled', status_confirmed:'Confirmed',
    status_maintenance:'Maintenance',
    // ── Buses ─────────────────────────────────────────────────
    bus_fleet:'Bus Fleet', add_bus:'Add Bus', edit_bus:'Edit Bus',
    plate_number:'Plate Number', capacity:'Capacity', color:'Color',
    bus_added:'Bus added successfully', bus_updated:'Bus updated successfully',
    bus_deleted:'Bus deleted', confirm_delete_bus:'Delete this bus?',
    trips_count:'trips', seats:'seats',
    color_white:'White', color_yellow:'Yellow', color_blue:'Blue',
    color_red:'Red', color_silver:'Silver',
    // ── Trips ─────────────────────────────────────────────────
    manage_trips:'Manage Trips', add_trip:'New Trip', edit_trip:'Edit Trip',
    trip_date:'Trip Date', destination:'Destination', bus_label:'Bus',
    schedule:'Schedule', trip_time:'Trip Time', seats_label:'Seats',
    trip_added:'Trip added successfully', trip_updated:'Trip updated',
    trip_deleted:'Trip deleted', confirm_delete_trip:'Delete this trip?',
    no_trips:'No trips found',
    // ── Routes ────────────────────────────────────────────────
    manage_routes:'Manage Routes', add_route:'New Route', edit_route:'Edit Route',
    start_point:'Starting Point', end_point:'Destination', schedules_count:'schedules',
    route_added:'Route added', route_updated:'Route updated',
    route_deleted:'Route deleted', no_routes:'No routes found',
    // ── Students ──────────────────────────────────────────────
    manage_students:'Manage Students', add_student:'Add Student',
    faculty:'Faculty', program:'Program', university:'University',
    has_subscription:'Subscribed', no_subscription:'Not subscribed',
    student_added:'Student added', student_updated:'Student updated',
    student_deleted:'Student deleted', no_students:'No students found',
    // ── Reservations ──────────────────────────────────────────
    manage_reservations:'Manage Reservations', add_reservation:'New Reservation',
    student_name:'Student Name', trip_label:'Trip', amount:'Amount',
    reservation_confirmed:'Reservation confirmed', reservation_cancelled:'Reservation cancelled',
    no_reservations:'No reservations found',
    // ── Payments ──────────────────────────────────────────────
    manage_payments:'Manage Payments', payment_date:'Payment Date',
    payment_method:'Payment Method', payment_status:'Payment Status',
    no_payments:'No payments found',
    // ── Drivers ───────────────────────────────────────────────
    manage_drivers:'Manage Drivers', add_driver:'Add Driver',
    license_number:'License Number', experience:'Experience (years)',
    driver_added:'Driver added', driver_deleted:'Driver deleted',
    no_drivers:'No drivers found',
    // ── Places ────────────────────────────────────────────────
    manage_places:'Manage Places', add_place:'Add Place',
    place_name:'Place Name', location:'Location',
    place_added:'Place added', place_deleted:'Place deleted',
    no_places:'No places found',
    // ── Universities ──────────────────────────────────────────
    manage_universities:'Manage Universities', add_university:'Add University',
    university_name:'University Name', university_city:'City',
    no_universities:'No universities found',
    // ── Users ─────────────────────────────────────────────────
    manage_users:'Manage Users', add_user:'Add User',
    user_name:'Name', user_role:'Role', user_status:'Status',
    no_users:'No users found',
    // ── Subscriptions ─────────────────────────────────────────
    manage_subscriptions:'Manage Subscriptions', subscription_type:'Subscription Type',
    subscription_start:'Start Date', subscription_end:'End Date',
    no_subscriptions:'No subscriptions found',
    // ── Dashboard ─────────────────────────────────────────────
    total_trips:'Total Trips', active_reservations:'Active Reservations',
    total_students:'Total Students', total_buses:'Total Buses',
    today_trips:"Today's Trips", monthly_revenue:'Monthly Revenue',
    pending_payments:'Pending Payments', active_subscriptions:'Active Subscriptions',
    recent_trips:'Recent Trips', recent_reservations:'Recent Reservations',
    // ── Moderator ─────────────────────────────────────────────
    uni_mod_desc:'Monitor trips and students affiliated with the university',
    bus_mod_desc:'Manage buses, trips and add operational data',
    change_status:'Change Status',
    // ── Student pages ─────────────────────────────────────────
    book_seat:'Book a Seat', available_seats:'Available Seats',
    book_success:'Booked successfully', already_booked:'Already booked',
    track_title:'Track Bus', your_bus:'Your Bus',
    subscription_details:'Subscription Details', subscription_active:'Active Subscription',
    subscription_expired:'Subscription Expired', no_active_subscription:'No active subscription',
    // ── Driver pages ──────────────────────────────────────────
    driver_home:'Driver Dashboard', assigned_trips:'Assigned Trips',
    start_trip:'Start Trip', end_trip:'End Trip',
    passengers:'Passengers', gps_active:'GPS Active',
    // ── Misc ──────────────────────────────────────────────────
    year:'year', years:'years', sar:'SAR',
    greeting_morning:'Good morning', greeting_afternoon:'Good afternoon',
    greeting_evening:'Good evening',
  },
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ar')

  const t = (key) => translations[lang]?.[key] ?? translations['ar']?.[key] ?? key

  const switchLang = (l) => {
    setLang(l)
    localStorage.setItem('lang', l)
    document.documentElement.dir  = l === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = l
  }

  useEffect(() => {
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [])

  return (
    <LanguageContext.Provider value={{ lang, t, switchLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider')
  return ctx
}
