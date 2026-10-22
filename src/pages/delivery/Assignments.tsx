import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsyncData } from '../../hooks/useAsyncData'
import { deliveryService } from '../../services/deliveryService'
import Select from '../../components/ui/Select'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { ASSIGNMENT_TYPE_LABEL, deliveryRoutes } from '../../lib/delivery'
import { formatDateTime } from '../../lib/format'
import type { AssignmentType } from '../../types/database'

export default function Assignments() {
  const [type, setType] = useState<AssignmentType | ''>('')
  const { data, error, loading } = useAsyncData(`assignments:${type}`, () => deliveryService.listActive(type))

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold">My assignments</h1>
      <p className="mt-1 text-sm text-slate-600">Active pickups and deliveries. Finished work is in History.</p>

      <div className="mt-6 max-w-xs">
        <Select label="Type" value={type} onChange={(e) => setType(e.target.value as AssignmentType | '')}>
          <option value="">All</option>
          <option value="PICKUP">Pickups</option>
          <option value="DELIVERY">Deliveries</option>
        </Select>
      </div>

      <div className="mt-4">
        {loading && (
          <div className="flex justify-center py-12" role="status">
            <Spinner className="h-6 w-6" />
          </div>
        )}
        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {data && data.length === 0 && <EmptyState title="No active assignments" text="Nothing is waiting for you right now." />}
        {data && data.length > 0 && (
          <ul className="space-y-3">
            {data.map((a) => (
              <li key={a.id}>
                <Link to={deliveryRoutes.assignment(a.id)} className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-brand-600">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-mono font-medium text-brand-700">{a.parcel.tracking_number}</p>
                      <p className="mt-1 text-sm font-medium">{ASSIGNMENT_TYPE_LABEL[a.assignment_type]}</p>
                    </div>
                    <StatusBadge status={a.parcel.status} />
                  </div>
                  {a.assignment_type === 'PICKUP' ? (
                    <p className="mt-2 text-sm text-slate-600">
                      From {a.parcel.sender_name}: {a.parcel.pickup_address}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">
                      To {a.parcel.receiver_name}: {a.parcel.delivery_address}, {a.parcel.delivery_city} {a.parcel.delivery_pincode}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">Assigned {formatDateTime(a.assigned_at)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}