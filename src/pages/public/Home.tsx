import { Link } from 'react-router-dom'
import { APP_NAME, APP_TAGLINE, COPYRIGHT_TEXT } from '../../lib/constants'
import { ROUTES } from '../../app/routes'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-navy-900 text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
          <span className="text-lg font-semibold tracking-tight">
            Dispatch<span className="text-brand-500">Hub</span>
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16">
        <h1 className="text-3xl font-semibold sm:text-4xl">{APP_NAME}</h1>
        <p className="mt-2 text-lg text-slate-600">{APP_TAGLINE}</p>
        <p className="mt-6 max-w-xl text-sm text-slate-500">
          Foundation build. The full public website arrives in Batch 4. Use the check page
          below to confirm the app can reach your Supabase project.
        </p>
        <Link
          to={ROUTES.setupCheck}
          className="mt-6 inline-flex items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Open setup check
        </Link>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        {COPYRIGHT_TEXT}
      </footer>
    </div>
  )
}