import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { ArrowRight, Sparkles, Tag } from 'lucide-react'
import { detectCategory } from '@/lib/nlp'
import { cn } from '@/lib/utils'

const flashRequestSchema = z.object({
  description: z.string().min(10, 'Please describe your need (at least 10 characters)'),
  urgency: z.number().min(0).max(2),
  location: z.string().min(1, 'Please select a meet-up location'),
  requireCheckIn: z.boolean(),
})

type FlashRequestFormData = z.infer<typeof flashRequestSchema>

const totalSteps = 3
const urgencyLabels = ['Now', 'Today', 'This Week']

const examples = [
  'I need a calculus textbook for my exam tomorrow',
  'Looking for ibuprofen—have a headache',
  'Need a winter jacket, size medium',
  'Seeking a laptop charger for MacBook Pro',
]

const locations = [
  'Student Center',
  'Library',
  'Main Quad',
  'Dining Hall',
  'Gym',
  'Parking Lot A',
  'Other',
]

export function FlashRequestWizardPage() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const [currentStep, setCurrentStep] = useState(1)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    handleSubmit,
    watch,
    setValue,
    trigger,
    register,
    formState: { errors },
  } = useForm<FlashRequestFormData>({
    resolver: zodResolver(flashRequestSchema),
    mode: 'onChange',
    defaultValues: {
      description: '',
      urgency: 1,
      location: '',
      requireCheckIn: false,
    },
  })

  const {
    ref: descriptionRef,
    onBlur: descriptionOnBlur,
  } = register('description')

  const description = watch('description')
  const urgency = watch('urgency')
  const location = watch('location')
  const requireCheckIn = watch('requireCheckIn')

  const wordCount = useMemo(() => {
    if (!description.trim()) return 0
    return description.trim().split(/\s+/).length
  }, [description])

  const detectedCategory = useMemo(() => detectCategory(description || ''), [description])

  useEffect(() => {
    if (feedback && description.trim()) {
      setFeedback(null)
    }
  }, [feedback, description])

  const progress = (currentStep / totalSteps) * 100

  const validateStep = async (step: number) => {
    switch (step) {
      case 1:
        return trigger('description')
      case 2:
        return trigger('urgency')
      case 3:
        return trigger(['location', 'requireCheckIn'])
      default:
        return true
    }
  }

  const handleNext = async () => {
    const isValid = await validateStep(currentStep)
    if (!isValid) {
      setFeedback('Please complete the required information before continuing.')
      return
    }
    setFeedback(null)
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
      setFeedback(null)
    }
  }

  const onSubmit = async (data: FlashRequestFormData) => {
    const isValid = await trigger()
    if (!isValid) {
      setFeedback('Please complete all required fields before submitting.')
      return
    }

    setIsSubmitting(true)
    try {
      const aiCategory = detectCategory(data.description)
      const compiledText = [
        data.description.trim(),
        `Urgency: ${urgencyLabels[data.urgency]}`,
        `Location: ${data.location}`,
        `Require Check-In: ${data.requireCheckIn ? 'Yes' : 'No'}`,
      ].join('\n')

      const result = await api.createFlashRequest({
        text: compiledText,
        metadata: {
          category: aiCategory,
          urgency: data.urgency,
          location: data.location,
          requireCheckIn: data.requireCheckIn,
          source: 'FlashRequestWizard',
        },
      })
      toast.success('Flash Request created successfully!')
      navigate(`/smart-ping?requestId=${result.id}`)
    } catch (error) {
      toast.error('Failed to create Flash Request. Please try again.')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <motion.div
          key="step-1"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -14 }}
          transition={{ duration: prefersReducedMotion ? 0.12 : 0.28, ease: 'easeOut' }}
          className="space-y-6"
        >
          <div className="space-y-3">
            <label htmlFor="need" className="text-sm text-zinc-500 dark:text-zinc-400">
              Describe your need
            </label>
            <textarea
              id="need"
              value={description}
              onChange={(event) => setValue('description', event.target.value, { shouldDirty: true, shouldValidate: true })}
              placeholder="E.g., I need a calculus textbook for my exam tomorrow..."
              rows={6}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-zinc-900/70 px-4 py-3 text-[15px] leading-6 placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/40 shadow-inner"
              aria-describedby="need-help"
              aria-invalid={Boolean(errors.description)}
              onBlur={descriptionOnBlur}
              ref={descriptionRef}
            />
            <div className="flex items-center justify-between">
              <p id="need-help" className="text-sm text-zinc-500 dark:text-zinc-400">
                Tell us what you need in your own words. Clear + specific wins.
              </p>
              <span className="text-sm tabular-nums text-zinc-500 dark:text-zinc-400">{wordCount} words</span>
            </div>
            {errors.description ? (
              <p className="text-sm text-red-500 dark:text-red-400" role="alert">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Detected category:</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-black/10 dark:border-white/10 px-3 py-1.5 text-sm">
              <Tag className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              {detectedCategory}
            </span>
          </div>

          <div>
            <div className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">Example requests:</div>
            <div className="flex flex-wrap gap-2">
              {examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() =>
                    setValue('description', example, { shouldDirty: true, shouldValidate: true })
                  }
                  className="rounded-full border border-black/10 dark:border-white/10 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900"
                  aria-label={`Use example: ${example}`}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )
    }

    if (currentStep === 2) {
      return (
        <motion.div
          key="step-2"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -14 }}
          transition={{ duration: prefersReducedMotion ? 0.12 : 0.28, ease: 'easeOut' }}
          className="space-y-8"
        >
          <div className="space-y-3">
            <h2 className="text-xl font-semibold tracking-[-0.01em] text-foreground">How urgent is this?</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              We’ll signal helpers based on timing. Choose what fits best.
            </p>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-black/10 bg-white/70 p-4 shadow-inner dark:border-white/10 dark:bg-zinc-900/70">
              <label className="flex items-center justify-between text-sm font-medium text-foreground">
                Urgency level
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{urgencyLabels[urgency]}</span>
              </label>
              <div className="mt-4">
                <Slider
                  min={0}
                  max={2}
                  step={1}
                  value={[urgency]}
                  onValueChange={(value) =>
                    setValue('urgency', Math.round(value[0]), { shouldDirty: true, shouldValidate: true })
                  }
                  className="mt-2"
                />
                <div className="mt-2 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Now</span>
                  <span>Today</span>
                  <span>This week</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-black/10 bg-white/70 p-4 text-sm text-zinc-500 shadow-inner dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-400">
              Tip: choose “Now” for urgent drop-offs or “This week” for flexible swaps.
            </div>
          </div>
        </motion.div>
      )
    }

    return (
      <motion.div
        key="step-3"
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -14 }}
        transition={{ duration: prefersReducedMotion ? 0.12 : 0.28, ease: 'easeOut' }}
        className="space-y-8"
      >
        <div className="space-y-3">
          <h2 className="text-xl font-semibold tracking-[-0.01em] text-foreground">Meet-up details</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Pick a safe, public meet-up point and let responders know if you’d like a quick check-in.
          </p>
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm text-zinc-500 dark:text-zinc-400" htmlFor="location">
              Preferred meet-up spot
            </label>
            <Select
              value={location}
              onValueChange={(value) => setValue('location', value, { shouldDirty: true, shouldValidate: true })}
            >
              <SelectTrigger
                id="location"
                className={cn(
                  'rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-zinc-900/70 px-4 py-3 text-left text-[15px] leading-6 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/40 shadow-inner',
                  errors.location && 'border-red-400 dark:border-red-400'
                )}
              >
                {location || 'Select location'}
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-black/10 bg-white/90 p-1 backdrop-blur dark:border-white/10 dark:bg-zinc-900/90">
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc} className="rounded-lg px-3 py-2 text-sm">
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.location ? (
              <p className="text-sm text-red-500 dark:text-red-400" role="alert">
                {errors.location.message}
              </p>
            ) : null}
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-black/10 bg-white/70 p-4 shadow-inner dark:border-white/10 dark:bg-zinc-900/70">
            <Checkbox
              checked={requireCheckIn}
              onCheckedChange={(checked) =>
                setValue('requireCheckIn', Boolean(checked), { shouldDirty: true, shouldValidate: true })
              }
              id="check-in"
            />
            <div>
              <label htmlFor="check-in" className="text-sm font-medium text-foreground">
                Require quick check-in
              </label>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Helpers confirm arrival before meeting. Recommended if you’re meeting somewhere new.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-black/10 bg-white/70 p-4 shadow-inner dark:border-white/10 dark:bg-zinc-900/70">
            <h3 className="text-sm font-semibold text-foreground">Summary</h3>
            <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              <p>
                <span className="font-medium text-foreground">Need:</span> {description || '—'}
              </p>
              <p>
                <span className="font-medium text-foreground">Category:</span> {detectedCategory}
              </p>
              <p>
                <span className="font-medium text-foreground">Urgency:</span> {urgencyLabels[urgency]}
              </p>
              <p>
                <span className="font-medium text-foreground">Location:</span> {location || '—'}
              </p>
              <p>
                <span className="font-medium text-foreground">Check-in:</span> {requireCheckIn ? 'Enabled' : 'Not required'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(80rem_40rem_at_20%_-10%,rgba(99,102,241,0.06),transparent),radial-gradient(60rem_30rem_at_80%_-20%,rgba(14,165,233,0.06),transparent)]">
      <div className="h-16" />
      <main className="mx-auto max-w-3xl px-4 pb-28 md:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              Step {currentStep} of {totalSteps}
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-4 w-4" />
              MIT Network
            </div>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <motion.div
              className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400"
              initial={{ width: prefersReducedMotion ? `${progress}%` : 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: prefersReducedMotion ? 0.1 : 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="md:flex md:items-stretch md:gap-6">
          <div className="relative hidden w-2 md:block">
            <div className="absolute inset-y-8 left-1/2 h-[calc(100%-4rem)] w-px -translate-x-1/2 bg-gradient-to-b from-indigo-400/60 via-indigo-400/20 to-transparent" />
          </div>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="relative flex-1 rounded-2xl border border-black/5 bg-white/60 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] ring-1 ring-black/5 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:border-white/10 dark:bg-zinc-900/60 dark:ring-white/10"
          >
            <div className="space-y-6 p-6 md:p-8">
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.01em] text-foreground md:text-4xl">
                  Create Flash Request
                </h1>
                <div className="mt-3 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />
              </div>

              <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
            </div>

            <div className="sticky bottom-0 rounded-b-2xl border-t border-black/5 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-zinc-900/70 md:p-6">
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-black/5 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
                  disabled={currentStep === 1}
                >
                  ← Back
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type={currentStep === totalSteps ? 'submit' : 'button'}
                    onClick={currentStep === totalSteps ? undefined : handleNext}
                    disabled={isSubmitting}
                    className="inline-flex items-center rounded-xl bg-[linear-gradient(180deg,theme(colors.indigo.500),theme(colors.indigo.600))] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-105 active:translate-y-[1px] focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:opacity-50"
                  >
                    {currentStep === totalSteps ? (
                      <>
                        {isSubmitting ? 'Submitting…' : 'Submit request'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div
                className="mt-3 text-sm text-red-500 dark:text-red-400"
                role="status"
                aria-live="polite"
              >
                {feedback}
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default FlashRequestWizardPage
 