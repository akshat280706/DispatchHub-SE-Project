import { createBrowserRouter } from 'react-router-dom'
import { ROUTES } from './routes'
import { ProtectedRoute, PublicOnlyRoute, RoleHomeRedirect, RoleRoute } from './guards'
import { ROLE_HOME } from '../lib/navigation'
import DashboardLayout from '../components/layout/DashboardLayout'
import PublicLayout from '../components/layout/PublicLayout'
import Home from '../pages/public/Home'
import About from '../pages/public/About'
import Services from '../pages/public/Services'
import TrackParcel from '../pages/public/TrackParcel'
import Contact from '../pages/public/Contact'
import Privacy from '../pages/public/Privacy'
import Terms from '../pages/public/Terms'
import SetupCheck from '../pages/public/SetupCheck'
import NotFound from '../pages/public/NotFound'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import DashboardHome from '../pages/app/DashboardHome'
import CustomerDashboard from '../pages/customer/CustomerDashboard'
import BookParcel from '../pages/customer/BookParcel'
import BookingDetail from '../pages/customer/BookingDetail'
import MyBookings from '../pages/customer/MyBookings'
import Profile from '../pages/customer/Profile'
import PayBooking from '../pages/customer/PayBooking'
import CustomerComplaints from '../pages/customer/CustomerComplaints'
import DeliveryDashboard from '../pages/delivery/DeliveryDashboard'
import Assignments from '../pages/delivery/Assignments'
import AssignmentDetail from '../pages/delivery/AssignmentDetail'
import DeliveryHistory from '../pages/delivery/DeliveryHistory'
import ManagerDashboard from '../pages/manager/ManagerDashboard'
import ManagerParcels from '../pages/manager/ManagerParcels'
import ManagerParcelDetail from '../pages/manager/ManagerParcelDetail'
import WorkQueue from '../pages/manager/WorkQueue'
import ManagerPersonnel from '../pages/manager/ManagerPersonnel'
import ManagerComplaints from '../pages/manager/ManagerComplaints'
import ManagerReports from '../pages/manager/ManagerReports'

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: ROUTES.home, element: <Home /> },
      { path: ROUTES.about, element: <About /> },
      { path: ROUTES.services, element: <Services /> },
      { path: ROUTES.track, element: <TrackParcel /> },
      { path: `${ROUTES.track}/:trackingNumber`, element: <TrackParcel /> },
      { path: ROUTES.contact, element: <Contact /> },
      { path: ROUTES.privacy, element: <Privacy /> },
      { path: ROUTES.terms, element: <Terms /> },
    ],
  },
  { path: ROUTES.setupCheck, element: <SetupCheck /> },
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: ROUTES.login, element: <Login /> },
      { path: ROUTES.register, element: <Register /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/app', element: <RoleHomeRedirect /> },
      {
        element: <DashboardLayout />,
        children: [
          {
            path: ROLE_HOME.CUSTOMER,
            element: <RoleRoute roles={['CUSTOMER']} />,
            children: [
              { index: true, element: <CustomerDashboard /> },
              { path: 'book', element: <BookParcel /> },
              { path: 'bookings', element: <MyBookings /> },
              { path: 'bookings/:id', element: <BookingDetail /> },
              { path: 'bookings/:id/pay', element: <PayBooking /> },
              { path: 'complaints', element: <CustomerComplaints /> },
              { path: 'profile', element: <Profile /> },
            ],
          },
          {
            path: ROLE_HOME.DELIVERY_PERSONNEL,
            element: <RoleRoute roles={['DELIVERY_PERSONNEL']} />,
            children: [
              { index: true, element: <DeliveryDashboard /> },
              { path: 'assignments', element: <Assignments /> },
              { path: 'assignments/:id', element: <AssignmentDetail /> },
              { path: 'history', element: <DeliveryHistory /> },
            ],
          },
          {
            path: ROLE_HOME.BRANCH_MANAGER,
            element: <RoleRoute roles={['BRANCH_MANAGER']} />,
            children: [
              { index: true, element: <ManagerDashboard /> },
              { path: 'parcels', element: <ManagerParcels /> },
              { path: 'parcels/:id', element: <ManagerParcelDetail /> },
              { path: 'assign', element: <WorkQueue /> },
              { path: 'personnel', element: <ManagerPersonnel /> },
              { path: 'complaints', element: <ManagerComplaints /> },
              { path: 'reports', element: <ManagerReports /> },
            ],
          },
          {
            path: ROLE_HOME.ADMIN,
            element: <RoleRoute roles={['ADMIN']} />,
            children: [{ index: true, element: <DashboardHome /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
])