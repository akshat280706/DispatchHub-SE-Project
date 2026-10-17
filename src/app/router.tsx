import { createBrowserRouter } from 'react-router-dom'
import { ROUTES } from './routes'
import Home from '../pages/public/Home'
import SetupCheck from '../pages/public/SetupCheck'
import NotFound from '../pages/public/NotFound'

export const router = createBrowserRouter([
  { path: ROUTES.home, element: <Home /> },
  { path: ROUTES.setupCheck, element: <SetupCheck /> },
  { path: '*', element: <NotFound /> },
])