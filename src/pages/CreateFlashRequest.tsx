import { useEffect, useMemo, useState } from "react"
import { ArrowRight, ArrowLeft, Flame, ShieldCheck, Sparkles, Star, Tag, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { detectCategory } from "@/lib/nlp"

interface RequestForm {
  need: string
  category: string
  quantity: string
  when: string
  where: string
}

type Step = 1 | 2 | 3

export default function CreateFlashRequest() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<RequestForm>({
    need: "",
    category: "Other",
    quantity: "",
    when: "",
    where: "",
  })
  const [error, setError] = useState<string>("")

  const words = useMemo(() => {
    const trimmed = form.need.trim()
    return trimmed ? trimmed.split(/\s+/).length : 0
  }, [form.need])

  useEffect(() => {
    if (form.need.trim()) {
      setForm((prev) => ({ ...prev, category: detectCategory(prev.need) }))
      setError("")
    } else {
      setForm((prev) => ({ ...prev, category: "Other" }))
    }
  }, [form.need])

  const examples = [
    "Need a calculus textbook by tomorrow",
    "Looking for ibuprofen—headache",
    "Winter jacket, size M",
    "MacBook Pro charger",
  ]

  const next = () => {
    if (step === 1 && !form.need.trim()) {
      setError("Tell us what you need before continuing.")
      return
    }

    setError("")
    setStep((prev) => (prev === 3 ? 3 : ((prev + 1) as Step)))
  }

  const back = () => setStep((prev) => (prev === 1 ? 1 : ((prev - 1) as Step)))

  const resetToFirst = () => {
    setStep(1)
    setError("")
  }

  const submit = () => {
    alert("Request submitted! 🎉")
    navigate('/smart-ping')
  }

  return (
    <div className="min-h-screen bg-white text-black transition-colors duration-200 dark:bg-black dark:text-white">
      <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-black/10 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-black/60">
        <div className="mx-auto flex h-full max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 shadow-md shadow-rose-500/40" />
            <span className="text-sm font-semibold tracking-tight">FLASH</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-1 text-xs dark:bg-white/10">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Verified Campus
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-1 text-xs dark:bg-white/10">
              <Sparkles className="h-4 w-4 text-fuchsia-500" />
              MIT
            </span>
          </div>
        </div>
      </header>

      <div className="h-16" />

      <main className="mx-auto max-w-4xl px-4 pb-40">
        <section className="mt-6">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium">Step {step} of 3</span>
            <div className="flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className="h-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 transition-all"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            Create {" "}
            <span className="bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 bg-clip-text text-transparent">
              Flash Request
            </span>
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-black/10 px-2.5 py-1 dark:border-white/10">
              <Star className="h-3.5 w-3.5 text-yellow-400" /> Fast responses
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-black/10 px-2.5 py-1 dark:border-white/10">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> ID verified
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-black/10 px-2.5 py-1 dark:border-white/10">
              <Flame className="h-3.5 w-3.5 text-rose-500" /> Hot on campus
            </span>
          </div>
        </section>

        {step === 1 && (
          <section className="mt-6 rounded-3xl border border-black/10 bg-white p-5 shadow-[0_6px_24px_rgba(0,0,0,0.06)] transition-colors dark:border-neutral-800 dark:bg-neutral-950 md:p-7">
            <label htmlFor="need" className="text-sm text-neutral-600 dark:text-neutral-300">
              Describe your need
            </label>
            <div className="relative mt-2">
              <textarea
                id="need"
                rows={5}
                value={form.need}
                onChange={(event) => setForm((prev) => ({ ...prev, need: event.target.value }))}
                placeholder="Tell us exactly what you’re looking for…"
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-[15px] leading-6 shadow-inner focus:outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/25 dark:border-neutral-800 dark:bg-black dark:text-white"
                aria-describedby="need-hint"
              />
              <div className="pointer-events-none absolute bottom-2 right-3 select-none text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
                {words} words
              </div>
            </div>
            <p id="need-hint" className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              Be specific. Include quantity, size, timing, and location if relevant.
            </p>

            <div className="mt-5 flex items-center gap-2">
              <span className="text-sm text-neutral-600 dark:text-neutral-300">Detected category:</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1.5 text-sm dark:border-neutral-800">
                <Tag className="h-4 w-4 text-fuchsia-500" />
                {form.category}
              </span>
            </div>

            <div className="mt-5">
              <div className="mb-2 text-sm text-neutral-600 dark:text-neutral-300">Try one:</div>
              <div className="flex flex-wrap gap-2">
                {examples.map((example) => (
                  <button
                    key={example}
                    onClick={() => setForm((prev) => ({ ...prev, need: example }))}
                    type="button"
                    className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm transition will-change-transform hover:-translate-y-[1px] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-800 dark:hover:bg-neutral-900 dark:focus-visible:ring-offset-black"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-rose-500 dark:text-rose-400" role="alert">
                {error}
              </p>
            )}

            <div className="mt-6 rounded-2xl border border-transparent bg-gradient-to-r from-fuchsia-500/10 to-rose-500/10 p-4 text-sm text-neutral-700 dark:text-neutral-200">
              <p>
                Pro tip: short + clear requests get accepted faster. Add <strong>when</strong> and {" "}
                <strong>where</strong>.
              </p>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="mt-6 rounded-3xl border border-black/10 bg-white p-5 shadow-[0_6px_24px_rgba(0,0,0,0.06)] transition-colors dark:border-neutral-800 dark:bg-neutral-950 md:p-7">
            <h2 className="mb-4 text-lg font-semibold">Add detail</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="qty" className="text-sm text-neutral-600 dark:text-neutral-300">
                  Quantity
                </label>
                <input
                  id="qty"
                  value={form.quantity}
                  onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
                  placeholder="e.g. 2"
                  className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-inner focus:outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/25 dark:border-neutral-800 dark:bg-black dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="when" className="text-sm text-neutral-600 dark:text-neutral-300">
                  When
                </label>
                <input
                  id="when"
                  value={form.when}
                  onChange={(event) => setForm((prev) => ({ ...prev, when: event.target.value }))}
                  placeholder="Today 5PM"
                  className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-inner focus:outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/25 dark:border-neutral-800 dark:bg-black dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="where" className="text-sm text-neutral-600 dark:text-neutral-300">
                  Where
                </label>
                <input
                  id="where"
                  value={form.where}
                  onChange={(event) => setForm((prev) => ({ ...prev, where: event.target.value }))}
                  placeholder="Student Center"
                  className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-inner focus:outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/25 dark:border-neutral-800 dark:bg-black dark:text-white"
                />
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="mt-6 rounded-3xl border border-black/10 bg-white p-5 shadow-[0_6px_24px_rgba(0,0,0,0.06)] transition-colors dark:border-neutral-800 dark:bg-neutral-950 md:p-7">
            <h2 className="mb-4 text-lg font-semibold">Review & Submit</h2>
            <div className="space-y-2 rounded-2xl border border-neutral-200 bg-white/60 p-4 text-sm dark:border-neutral-800 dark:bg-black/40">
              <div>
                <span className="text-neutral-500 dark:text-neutral-400">Need:</span> {form.need || '—'}
              </div>
              <div>
                <span className="text-neutral-500 dark:text-neutral-400">Category:</span> {form.category || '—'}
              </div>
              <div>
                <span className="text-neutral-500 dark:text-neutral-400">Quantity:</span> {form.quantity || '—'}
              </div>
              <div>
                <span className="text-neutral-500 dark:text-neutral-400">When:</span> {form.when || '—'}
              </div>
              <div>
                <span className="text-neutral-500 dark:text-neutral-400">Where:</span> {form.where || '—'}
              </div>
            </div>
            <button
              type="button"
              onClick={submit}
              className="mt-4 inline-flex items-center rounded-2xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-6 py-2.5 font-semibold text-white shadow-[0_10px_24px_rgba(244,63,94,0.35)] transition hover:brightness-110"
            >
              Submit request
            </button>
          </section>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="mx-auto max-w-4xl px-4 pb-5">
          <div className="rounded-3xl border border-black/10 bg-white/90 backdrop-blur shadow-[0_-8px_24px_rgba(0,0,0,0.08)] transition-colors dark:border-white/10 dark:bg-neutral-950/90">
            <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:p-5">
              <div className="flex-1">
                <div className="text-xs text-neutral-600 dark:text-neutral-400">Step {step} of 3</div>
                <div className="text-sm font-semibold tracking-tight">
                  {step === 1 && 'Describe your need'}
                  {step === 2 && 'Add detail'}
                  {step === 3 && 'Review & submit'}
                </div>
                {error && step === 1 ? (
                  <div className="mt-2 text-xs text-rose-500 dark:text-rose-400" role="alert">
                    {error}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 1}
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-800 dark:hover:bg-neutral-900 dark:focus-visible:ring-offset-black"
                >
                  <ArrowLeft className="mr-1 inline size-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={step === 3 ? submit : next}
                  className="group inline-flex items-center rounded-2xl bg-[conic-gradient(from_180deg_at_50%_50%,theme(colors.fuchsia.500),theme(colors.rose.500),theme(colors.pink.500),theme(colors.fuchsia.500))] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(244,63,94,0.35)] transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-fuchsia-500/30"
                >
                  {step === 3 ? 'Submit' : 'Next'}
                  <ArrowRight className="ml-1 inline size-4 translate-x-0 transition group-hover:translate-x-[2px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={resetToFirst}
        aria-label="Start new flash request"
        className="fixed bottom-6 right-6 z-40 rounded-full p-4 text-white shadow-[0_16px_32px_rgba(244,63,94,0.4)] transition hover:brightness-110 active:translate-y-[1px] focus:outline-none focus:ring-4 focus:ring-rose-500/50 md:p-5"
        style={{
          background:
            'conic-gradient(from 180deg at 50% 50%, rgba(244,63,94,1), rgba(239,68,68,1), rgba(236,72,153,1), rgba(244,63,94,1))',
        }}
      >
        <Plus className="size-6" />
      </button>

      <style>{`
        @keyframes progress {
          0% { transform: translateX(-66%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

