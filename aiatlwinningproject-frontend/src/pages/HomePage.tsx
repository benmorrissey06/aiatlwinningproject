import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Plus } from 'lucide-react'

export function HomePage() {
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.shiftKey && (event.key === 'N' || event.key === 'n')) {
        navigate('/request/create')
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-24 -left-24 h-[42rem] w-[42rem] rounded-full opacity-[0.35] blur-3xl"
          style={{
            background:
              'radial-gradient(45% 45% at 50% 50%, rgba(99,102,241,0.35), transparent)',
          }}
        />
        <div
          className="absolute -bottom-16 -right-16 h-[42rem] w-[42rem] rounded-full opacity-[0.35] blur-3xl"
          style={{
            background:
              'radial-gradient(45% 45% at 50% 50%, rgba(244,63,94,0.28), transparent)',
          }}
        />
      </div>

      <section className="mx-auto max-w-5xl px-6 pt-16 pb-10 text-center md:pt-24 md:pb-14">

        <h1 className="mt-6 font-display text-5xl leading-[1.02] tracking-tight md:text-7xl">
          Get what you need on campus in{' '}
          <span className="mx-2 bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_6px_24px_rgba(244,63,94,0.20)]">
            minutes
          </span>
          .
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-[17px] leading-7 text-neutral-600 dark:text-neutral-300">
          AI-powered Smart-Ping rallies nearby students who can loan, deliver, or swap what you need—without
          leaving campus.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate('/request/create')}
            className="group inline-flex items-center rounded-full bg-[linear-gradient(180deg,theme(colors.indigo.400),theme(colors.indigo.600))] px-5 py-3 font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition hover:brightness-110 active:translate-y-[1px]"
          >
            Start a request
            <ArrowRight className="ml-2 inline size-4 translate-x-0 transition group-hover:translate-x-[2px]" />
          </button>

          <Link
            to="/listings"
            className="rounded-full border border-black/10 bg-white px-5 py-3 font-semibold text-neutral-800 transition hover:shadow-sm dark:border-white/10 dark:bg-black dark:text-white"
          >
            Browse listings
          </Link>

          <Link
            to="/login"
            className="rounded-full border border-black/10 bg-white px-5 py-3 font-semibold text-neutral-800 transition hover:shadow-sm dark:border-white/10 dark:bg-black dark:text-white"
          >
            Login / Sign Up
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
          <div className="flex -space-x-2">
            {['AL', 'JB', 'KC', 'MT'].map((initials) => (
              <div
                key={initials}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-[11px] font-semibold shadow-sm dark:border-white/10 dark:bg-neutral-900"
              >
                {initials}
              </div>
            ))}
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-[11px] font-semibold shadow-sm dark:border-white/10 dark:bg-neutral-900">
              +2
            </div>
          </div>
          <span className="font-semibold text-neutral-700 dark:text-white">2,814 students</span> helped this month
        </div>
      </section>

      <button
        onClick={() => navigate('/request/create')}
        aria-label="Create Flash Request"
        className="fixed bottom-6 right-6 z-50 rounded-full p-4 text-white shadow-[0_16px_40px_rgba(244,63,94,0.45)] transition hover:brightness-110 active:translate-y-[1px] focus:outline-none focus:ring-4 focus:ring-rose-500/30 md:p-5"
        style={{
          background:
            'conic-gradient(from 180deg at 50% 50%, rgba(244,63,94,1), rgba(239,68,68,1), rgba(236,72,153,1), rgba(244,63,94,1))',
        }}
      >
        <Plus className="size-6" />
      </button>
    </div>
  )
}

export default HomePage
