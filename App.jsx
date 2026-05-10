import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { GPSProvider } from './context/GPSContext'
import { LanguageProvider, useLanguage } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import Sidebar  from './components/Sidebar'
import Header   from './components/Header'

import Dashboard         from './pages/Dashboard'
import TripsPage         from './pages/TripsPage'
import BusesPage         from './pages/BusesPage'
import RoutesPage        from './pages/RoutesPage'
import StudentsPage      from './pages/StudentsPage'
import ReservationsPage  from './pages/ReservationsPage'
import PaymentsPage      from './pages/PaymentsPage'
import DriversPage       from './pages/DriversPage'
import SubscriptionsPage from './pages/SubscriptionsPage'
import UsersPage         from './pages/UsersPage'
import PlacesPage        from './pages/PlacesPage'
import UniversitiesPage  from './pages/UniversitiesPage'
import ProfilePage       from './pages/ProfilePage'
import SettingsPage      from './pages/SettingsPage'

// University moderator — view only
import UniModHome         from './pages/moderator/UniModHome'
import UniModTrips        from './pages/moderator/UniModTrips'
import UniModReservations from './pages/moderator/UniModReservations'
import UniModStudents     from './pages/moderator/UniModStudents'
import UniModBuses        from './pages/moderator/UniModBuses'
import UniModDrivers      from './pages/moderator/UniModDrivers'
import UniModRoutes       from './pages/moderator/UniModRoutes'

// Bus company moderator — can add/edit buses & trips
import BusModHome         from './pages/moderator/BusModHome'
import BusModBuses        from './pages/moderator/BusModBuses'
import BusModTrips        from './pages/moderator/BusModTrips'
import BusModDrivers      from './pages/moderator/BusModDrivers'
import BusModRoutes       from './pages/moderator/BusModRoutes'
import BusModPlaces       from './pages/moderator/BusModPlaces'
import BusModReservations from './pages/moderator/BusModReservations'
import BusModPayments     from './pages/moderator/BusModPayments'

import StudentHome         from './pages/student/StudentHome'
import StudentTrips        from './pages/student/StudentTrips'
import MyReservations      from './pages/student/MyReservations'
import StudentTrack        from './pages/student/StudentTrack'
import StudentSubscription from './pages/student/StudentSubscription'

import DriverHome       from './pages/driver/DriverHome'
import DriverTrips      from './pages/driver/DriverTrips'
import DriverActiveTrip from './pages/driver/DriverActiveTrip'
import DriverMonthTrips from './pages/driver/DriverMonthTrips'

import BusLayout      from './pages/moderator/BusLayout'
import BusModPlans    from './pages/moderator/BusModPlans'
import WaitlistPage    from './pages/moderator/WaitlistPage'
import CashBlacklistPage from './pages/moderator/CashBlacklistPage'
import LoginPage from './pages/LoginPage'
import SplashScreen from './components/SplashScreen'

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 768)
  React.useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}

function AppLayout() {
  const { lang } = useLanguage()
  const isMobile = useIsMobile()
  return (
    <div style={{ display:'flex', minHeight:'100vh', direction: lang==='ar'?'rtl':'ltr' }}>
      {!isMobile && <Sidebar/>}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
        <Header isMobile={isMobile}/>
        <main style={{ flex:1, overflowY:'auto', paddingBottom: isMobile ? 70 : 0 }}><Outlet/></main>
      </div>
      {isMobile && <Sidebar isMobile={true}/>}
    </div>
  )
}

function RoleRoute({ allow }) {
  const { user, role } = useAuth()
  if (!user) return <Navigate to="/login" replace/>
  if (allow && !allow.includes(role)) return <Navigate to={homeFor(role)} replace/>
  return <Outlet/>
}

export function homeFor(role) {
  if (role === 'student')       return '/student'
  if (role === 'driver')        return '/driver'
  if (role === 'university_mod')return '/uni-mod'
  if (role === 'bus_mod')       return '/bus-mod'
  return '/dashboard'
}

function PublicRoute({ children }) {
  const { user, role } = useAuth()
  if (user) return <Navigate to={homeFor(role)} replace/>
  return children
}

function RootRedirect() {
  const { user, role } = useAuth()
  if (!user) return <Navigate to="/login" replace/>
  return <Navigate to={homeFor(role)} replace/>
}

export default function App() {
  const [showSplash, setShowSplash] = React.useState(true)

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
    <BrowserRouter>
      <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <GPSProvider>
              <Routes>
                <Route path="/login" element={<PublicRoute><LoginPage/></PublicRoute>}/>

                <Route element={<RoleRoute/>}>
                  <Route element={<AppLayout/>}>

                    {/* All roles */}
                    <Route path="/profile"  element={<ProfilePage/>}/>
                    <Route path="/settings" element={<SettingsPage/>}/>

                    {/* Admin */}
                    <Route element={<RoleRoute allow={['admin']}/>}>
                      <Route path="/dashboard"     element={<Dashboard/>}/>
                      <Route path="/trips"         element={<TripsPage/>}/>
                      <Route path="/buses"         element={<BusesPage/>}/>
                      <Route path="/routes"        element={<RoutesPage/>}/>
                      <Route path="/places"        element={<PlacesPage/>}/>
                      <Route path="/students"      element={<StudentsPage/>}/>
                      <Route path="/reservations"  element={<ReservationsPage/>}/>
                      <Route path="/payments"      element={<PaymentsPage/>}/>
                      <Route path="/subscriptions" element={<SubscriptionsPage/>}/>
                      <Route path="/drivers"       element={<DriversPage/>}/>
                      <Route path="/users"         element={<UsersPage/>}/>
                      <Route path="/universities"  element={<UniversitiesPage/>}/>
                    </Route>

                    {/* University Moderator — view only */}
                    <Route element={<RoleRoute allow={['university_mod']}/>}>
                      <Route path="/uni-mod"                element={<UniModHome/>}/>
                      <Route path="/uni-mod/trips"          element={<UniModTrips/>}/>
                      <Route path="/uni-mod/reservations"   element={<UniModReservations/>}/>
                      <Route path="/uni-mod/students"       element={<UniModStudents/>}/>
                      <Route path="/uni-mod/buses"          element={<UniModBuses/>}/>
                      <Route path="/uni-mod/drivers"        element={<UniModDrivers/>}/>
                      <Route path="/uni-mod/routes"         element={<UniModRoutes/>}/>
                      <Route path="/uni-mod/users"          element={<UsersPage/>}/>
                    </Route>

                    {/* Bus Company Moderator — can add/edit */}
                    <Route element={<RoleRoute allow={['bus_mod']}/>}>
                      <Route path="/bus-mod"          element={<BusModHome/>}/>
                      <Route path="/bus-mod/buses"    element={<BusModBuses/>}/>
                      <Route path="/bus-mod/trips"    element={<BusModTrips/>}/>
                      <Route path="/bus-mod/drivers"  element={<BusModDrivers/>}/>
                      <Route path="/bus-mod/routes"        element={<BusModRoutes/>}/>
                      <Route path="/bus-mod/places"        element={<BusModPlaces/>}/>
                      <Route path="/bus-mod/reservations"  element={<BusModReservations/>}/>
                      <Route path="/bus-mod/payments"      element={<BusModPayments/>}/>
                      <Route path="/bus-mod/layout"   element={<BusLayout/>}/>
                      <Route path="/bus-mod/plans"    element={<BusModPlans/>}/>
                      <Route path="/bus-mod/waitlist"  element={<WaitlistPage/>}/>
                      <Route path="/bus-mod/blacklist" element={<CashBlacklistPage/>}/>
                    </Route>

                    {/* Student */}
                    <Route element={<RoleRoute allow={['student']}/>}>
                      <Route path="/student"                    element={<StudentHome/>}/>
                      <Route path="/student/trips"              element={<StudentTrips/>}/>
                      <Route path="/student/my-reservations"    element={<MyReservations/>}/>
                      <Route path="/student/track"              element={<StudentTrack/>}/>
                      <Route path="/student/subscription"       element={<StudentSubscription/>}/>
                    </Route>

                    {/* Driver */}
                    <Route element={<RoleRoute allow={['driver']}/>}>
                      <Route path="/driver"             element={<DriverHome/>}/>
                      <Route path="/driver/trips"       element={<DriverTrips/>}/>
                      <Route path="/driver/active"      element={<DriverActiveTrip/>}/>
                      <Route path="/driver/month-trips" element={<DriverMonthTrips/>}/>
                    </Route>

                  </Route>
                </Route>

                <Route path="/"  element={<RootRedirect/>}/>
                <Route path="*"  element={<RootRedirect/>}/>
              </Routes>
            </GPSProvider>
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
    </>
  )
}
