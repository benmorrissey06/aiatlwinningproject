import { useEffect, useMemo, useState } from "react"
import { ArrowRight, ArrowLeft, Flame, ShieldCheck, Sparkles, Star, Tag, Plus } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { detectCategory } from "@/lib/nlp"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { parseFromText } from "@/lib/parseFromText"

interface RequestForm {
  need: string
  category: string
  when: string
  where: string
}

type Step = 1 | 2

export default function CreateFlashRequest() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<RequestForm>({
    need: "",
    category: "Other",
    when: "",
    where: "",
  })
  const [error, setError] = useState<string>("")
  const [fieldErrors, setFieldErrors] = useState<{ when?: string; where?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pre-fill form from URL parameters
  useEffect(() => {
    const item = searchParams.get('item')
    const category = searchParams.get('category')
    
    if (item) {
      setForm((prev) => ({ ...prev, need: item }))
    }
    
    if (category) {
      setForm((prev) => ({ ...prev, category }))
    }
  }, [searchParams])

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
    "Need 2 MacBook chargers at Student Center around 5pm. Prefer USB-C.",
    "Looking for a calculus textbook by tomorrow",
    "Need ibuprofen—headache, urgent",
    "Winter jacket, size M, at Library today",
    "MacBook Pro charger, need ASAP",
  ]

  const next = () => {
    if (step === 1 && !form.need.trim()) {
      setError("Tell us what you need before continuing.")
      return
    }

    // Parse details from text when moving from Step 1 to Step 2
    if (step === 1 && form.need.trim()) {
      const parsed = parseFromText(form.need)
      setForm((prev) => ({
        ...prev,
        when: parsed.when || prev.when,
        where: parsed.where || prev.where,
      }))
    }

    setError("")
    setFieldErrors({})
    setStep((prev) => (prev === 2 ? 2 : ((prev + 1) as Step)))
  }

  const back = () => {
    setStep((prev) => (prev === 1 ? 1 : ((prev - 1) as Step)))
    setError("")
    setFieldErrors({})
  }

  const resetToFirst = () => {
    setStep(1)
    setError("")
    setFieldErrors({})
  }

  const validateReview = (values: { when: string; where: string }) => {
    const errors: { when?: string; where?: string } = {}
    
    if (!values.when || !values.when.trim()) {
      errors.when = 'Add a time (e.g., Today 5PM)'
    }
    
    if (!values.where || values.where.trim().length <= 1) {
      errors.where = 'Add a location (e.g., Student Center)'
    }
    
    return errors
  }

  const submit = async () => {
    if (!form.need.trim()) {
      setError("Tell us what you need before continuing.")
      return
    }

    // Validate when and where fields
    const errors = validateReview({ when: form.when, where: form.where })
    setFieldErrors(errors)
    
    if (errors.when || errors.where) {
      setError("Please fill in both 'When' and 'Where' fields before submitting.")
      return
    }

    const compiledText = [
      form.need.trim(),
      form.when ? `Timing: ${form.when}` : null,
      form.where ? `Location: ${form.where}` : null,
    ]
      .filter(Boolean)
      .join("\n")

    setIsSubmitting(true)
    try {
      const result = await api.createFlashRequest({
        text: compiledText,
        metadata: {
          category: form.category,
          when: form.when,
          location: form.where,
          urgency: 1,
          requireCheckIn: false,
          source: "CreateFlashRequest",
        },
      })
      
      if (result && result.id) {
        toast.success("Flash Request submitted")
        navigate(`/smart-ping?requestId=${result.id}`)
      } else {
        throw new Error("Invalid response from server: missing request ID")
      }
    } catch (submissionError: any) {
      console.error("Flash Request submission error:", submissionError)
      
      // Extract error message with better handling for network errors
      let errorMessage = "Failed to submit Flash Request"
      if (submissionError instanceof Error) {
        errorMessage = submissionError.message
        // Check for specific error types
        if (errorMessage.includes('Cannot connect to backend')) {
          errorMessage = "Backend server is not running. Please start the backend server on port 8000."
        } else if (errorMessage.includes('CORS error')) {
          errorMessage = "CORS error: Backend server may not be configured correctly."
        } else if (errorMessage.includes('Network request failed')) {
          errorMessage = "Network error: Please check your connection and ensure the backend server is running."
        }
      } else if (submissionError?.detail) {
        if (typeof submissionError.detail === 'string') {
          errorMessage = submissionError.detail
        } else if (Array.isArray(submissionError.detail)) {
          errorMessage = submissionError.detail.map((e: any) => e.msg || e.message || String(e)).join(', ')
        } else {
          errorMessage = String(submissionError.detail)
        }
      } else if (submissionError?.message) {
        errorMessage = submissionError.message
      } else if (typeof submissionError === 'string') {
        errorMessage = submissionError
      }
      
      // Show error with helpful message
      toast.error("Failed to submit Flash Request", {
        description: errorMessage,
        duration: 5000, // Show for 5 seconds
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-border bg-background/70 backdrop-blur">
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
            <span className="font-medium">Step {step} of 2</span>
            <div className="flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className="h-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 transition-all"
                style={{ width: `${(step / 2) * 100}%` }}
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
                placeholder="Need 2 MacBook chargers at Student Center around 5pm. Prefer USB-C."
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-[15px] leading-6 shadow-inner focus:outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/25 dark:border-neutral-800 dark:bg-black dark:text-white"
                aria-describedby="need-hint"
              />
              <div className="pointer-events-none absolute bottom-2 right-3 select-none text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
                {words} words
              </div>
            </div>
            <p id="need-hint" className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              Include when and where if relevant. We'll help extract these details.
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
            <h2 className="mb-4 text-lg font-semibold">Review & Submit</h2>
            <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
              Review your request and fill in the required fields below before submitting.
            </p>
            
            {/* Description */}
            <div className="mb-6 space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Description</label>
              <div className="rounded-xl border border-neutral-200 bg-white/60 p-4 text-sm dark:border-neutral-800 dark:bg-black/40">
                {form.need || '—'}
              </div>
            </div>

            {/* Category */}
            <div className="mb-6 space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Category</label>
              <div className="rounded-xl border border-neutral-200 bg-white/60 p-4 text-sm dark:border-neutral-800 dark:bg-black/40">
                <span className="inline-flex items-center gap-1">
                  <Tag className="h-4 w-4 text-fuchsia-500" />
                  {form.category || '—'}
                </span>
              </div>
            </div>

            {/* Editable fields: When, Where */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="review-when" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  When <span className="text-rose-500">*</span>
                </label>
                <input
                  id="review-when"
                  value={form.when}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, when: event.target.value }))
                    // Clear error when user starts typing
                    if (fieldErrors.when) {
                      setFieldErrors((prev) => ({ ...prev, when: undefined }))
                    }
                    setError("")
                  }}
                  placeholder="Today 5PM"
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-inner focus:outline-none focus:ring-4 focus:ring-fuchsia-500/25 dark:bg-black dark:text-white ${
                    fieldErrors.when
                      ? 'border-rose-500 focus:border-rose-500 dark:border-rose-500'
                      : 'border-neutral-200 focus:border-fuchsia-500 dark:border-neutral-800'
                  }`}
                />
                {fieldErrors.when && (
                  <p className="text-sm text-rose-500 dark:text-rose-400" role="alert">
                    {fieldErrors.when}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="review-where" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Where <span className="text-rose-500">*</span>
                </label>
                <input
                  id="review-where"
                  value={form.where}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, where: event.target.value }))
                    // Clear error when user starts typing
                    if (fieldErrors.where) {
                      setFieldErrors((prev) => ({ ...prev, where: undefined }))
                    }
                    setError("")
                  }}
                  placeholder="Student Center"
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-inner focus:outline-none focus:ring-4 focus:ring-fuchsia-500/25 dark:bg-black dark:text-white ${
                    fieldErrors.where
                      ? 'border-rose-500 focus:border-rose-500 dark:border-rose-500'
                      : 'border-neutral-200 focus:border-fuchsia-500 dark:border-neutral-800'
                  }`}
                />
                {fieldErrors.where && (
                  <p className="text-sm text-rose-500 dark:text-rose-400" role="alert">
                    {fieldErrors.where}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-rose-500 dark:text-rose-400" role="alert">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={isSubmitting || !form.when.trim() || form.where.trim().length <= 1}
              className="mt-6 inline-flex items-center rounded-2xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-6 py-2.5 font-semibold text-white shadow-[0_10px_24px_rgba(244,63,94,0.35)] transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit request'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </section>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="mx-auto max-w-4xl px-4 pb-5">
          <div className="rounded-3xl border border-black/10 bg-white/90 backdrop-blur shadow-[0_-8px_24px_rgba(0,0,0,0.08)] transition-colors dark:border-white/10 dark:bg-neutral-950/90">
            <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:p-5">
              <div className="flex-1">
                <div className="text-xs text-neutral-600 dark:text-neutral-400">Step {step} of 2</div>
                <div className="text-sm font-semibold tracking-tight">
                  {step === 1 && 'Describe your need'}
                  {step === 2 && 'Review & submit'}
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
                {step === 1 && (
                  <button
                    type="button"
                    onClick={next}
                    disabled={isSubmitting}
                    className="group inline-flex items-center rounded-2xl bg-[conic-gradient(from_180deg_at_50%_50%,theme(colors.fuchsia.500),theme(colors.rose.500),theme(colors.pink.500),theme(colors.fuchsia.500))] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(244,63,94,0.35)] transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-fuchsia-500/30"
                  >
                    Next
                    <ArrowRight className="ml-1 inline size-4 translate-x-0 transition group-hover:translate-x-[2px]" />
                  </button>
                )}
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

