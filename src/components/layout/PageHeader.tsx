// export default function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
//   return (
//     <div className="border-b border-slate-200 bg-white">
//       <div className="mx-auto max-w-6xl px-4 py-10">
//         <h1 className="text-3xl font-semibold">{title}</h1>
//         {subtitle && <p className="mt-2 max-w-2xl text-slate-600">{subtitle}</p>}
//       </div>
//     </div>
//   )
// }


export default function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <span className="mb-4 block h-1 w-10 rounded-full bg-lime" aria-hidden="true" />
        <h1 className="text-3xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-slate-600">{subtitle}</p>}
      </div>
    </div>
  )
}
