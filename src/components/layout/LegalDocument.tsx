import PageHeader from './PageHeader'

export interface LegalSection {
  heading: string
  body: string[]
}

interface LegalDocumentProps {
  title: string
  updated: string
  intro: string
  sections: LegalSection[]
}

export default function LegalDocument({ title, updated, intro, sections }: LegalDocumentProps) {
  return (
    <>
      <PageHeader title={title} subtitle={`Last updated: ${updated}`} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{intro}</p>
        <div className="mt-8 space-y-8">
          {sections.map((s, i) => (
            <section key={s.heading}>
              <h2 className="text-lg font-semibold">
                {i + 1}. {s.heading}
              </h2>
              {s.body.map((p) => (
                <p key={p} className="mt-2 text-sm leading-6 text-slate-700">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </>
  )
}