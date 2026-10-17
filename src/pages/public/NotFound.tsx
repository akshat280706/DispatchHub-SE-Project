import { Link } from 'react-router-dom'
import { ROUTES } from '../../app/routes'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-brand-700">Error 404</p>
      <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">
        The page you are looking for does not exist or has moved.
      </p>
      <Link
        to={ROUTES.home}
        className="mt-6 rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
      >
        Back to home
      </Link>
    </div>
  )
}