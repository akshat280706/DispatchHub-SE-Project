import type { Quote } from '../../types/api'
import { formatDate, formatINR } from '../../lib/format'
import { ZONE_LABEL } from '../../lib/parcel'

export default function CostBreakdown({ quote }: { quote: Quote }) {
  return (
    <div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">Zone</dt>
          <dd className="font-medium">{ZONE_LABEL[quote.zone]}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">Base charge (first {quote.base_weight_kg} kg)</dt>
          <dd>{formatINR(quote.base_charge)}</dd>
        </div>
        {quote.extra_weight_kg > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Extra weight ({quote.extra_weight_kg} kg)</dt>
            <dd>{formatINR(quote.extra_charge)}</dd>
          </div>
        )}
        {quote.handling_surcharge > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Handling surcharge</dt>
            <dd>{formatINR(quote.handling_surcharge)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4 border-t border-slate-200 pt-2">
          <dt className="text-slate-600">Shipping charge</dt>
          <dd>{formatINR(quote.shipping_charge)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">GST ({quote.gst_percent}%)</dt>
          <dd>{formatINR(quote.tax_amount)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 text-base font-semibold">
          <dt>Total</dt>
          <dd>{formatINR(quote.total_amount)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-slate-500">
        Estimated delivery: about {quote.estimated_days} days (around {formatDate(quote.estimated_delivery_date)}). This is an
        estimate, not a guarantee.
      </p>
    </div>
  )
}