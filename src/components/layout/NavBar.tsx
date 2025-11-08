import { Link, useLocation } from 'react-router-dom'
import { Zap, Menu, Bell, MapPin, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/components/theme/ThemeToggle'
import { useCampus } from './CampusContext'
import { motion } from 'framer-motion'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/request/create', label: 'Request' },
  { to: '/smart-ping', label: 'Smart-Ping' },
  { to: '/listings', label: 'Listings' },
  { to: '/messages', label: 'Messages' },
  { to: '/safety', label: 'Safety' },
]

const campuses = [
  'MIT',
  'Harvard',
  'Stanford',
  'Berkeley',
  'UCLA',
  'Georgia Tech',
]

export function NavBar() {
  const location = useLocation()
  const { campus, setCampus } = useCampus()

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navLinks.map((link) => {
        const isActive = location.pathname === link.to
        if (mobile) {
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex items-center justify-between rounded-xl px-3 py-2 text-base font-semibold transition-colors duration-200',
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-400/20 text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              {link.label}
            </Link>
          )
        }

        return (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              'group relative flex items-center px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition-colors duration-200',
              isActive ? 'text-foreground' : 'text-slate-500 hover:text-foreground'
            )}
          >
            {link.label}
            {isActive && (
              <motion.span
                layoutId="nav-underline"
                className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400"
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            )}
          </Link>
        )
      })}
    </>
  )

  return (
    <header className="sticky top-0 z-[60] w-full border-b border-black/5 backdrop-blur dark:border-white/10">
      <div className="container mx-auto px-4">
        <div className="relative flex h-20 items-center justify-between rounded-3xl border border-white/20 bg-white/70 px-4 shadow-lg shadow-slate-900/10 backdrop-blur-2xl transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/70 md:px-6">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-white/40 via-transparent to-blue-100/20 dark:from-slate-900/40 dark:to-indigo-900/20" />

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 text-white shadow-xl shadow-indigo-500/30">
              <Zap className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500/80">
                Flash
              </span>
              <span className="text-lg font-bold text-foreground md:text-xl">Request</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-2 md:flex">
            <NavLinks />
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-xl bg-white/40 text-slate-600 shadow-inner shadow-white/40 ring-1 ring-white/50 backdrop-blur btn-focus hover:bg-white/60 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            </Button>

            <div className="hidden items-center gap-2 md:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 rounded-xl bg-white/40 px-3 py-2 text-sm font-semibold text-slate-600 shadow-inner shadow-white/40 ring-1 ring-white/60 backdrop-blur btn-focus hover:bg-white/60 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10"
                  >
                    <MapPin className="h-4 w-4" />
                    <span className="hidden lg:inline">{campus}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-2xl border border-white/20 bg-white/90 p-2 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
                  {campuses.map((campusOption) => (
                    <DropdownMenuItem
                      key={campusOption}
                      onClick={() => setCampus(campusOption)}
                      className={cn(
                        'rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200',
                        campus === campusOption
                          ? 'bg-gradient-to-r from-indigo-500/15 to-cyan-400/15 text-foreground'
                          : 'text-muted-foreground hover:bg-white/40 dark:hover:bg-white/5'
                      )}
                    >
                      {campusOption}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-11 w-11 rounded-full bg-white/40 shadow-inner shadow-white/50 ring-1 ring-white/50 backdrop-blur btn-focus hover:bg-white/60 dark:bg-white/10 dark:ring-white/10">
                    <Avatar>
                      <AvatarImage src="" alt="Profile" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-white/20 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl bg-white/60 shadow-inner shadow-white/50 ring-1 ring-white/60 backdrop-blur btn-focus hover:bg-white/70 dark:bg-white/10 dark:ring-white/10">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="glass border-l border-white/20 bg-white/70 backdrop-blur-2xl dark:bg-slate-900/80">
                  <div className="mt-12 flex flex-col gap-6 text-foreground">
                    <nav className="flex flex-col gap-1">
                      <NavLinks mobile />
                    </nav>

                    <div className="border-t border-white/20 pt-4">
                      <p className="px-3 text-sm font-semibold text-muted-foreground">Campus</p>
                      <div className="mt-2 flex flex-col gap-1">
                        {campuses.map((campusOption) => (
                          <button
                            key={campusOption}
                            onClick={() => setCampus(campusOption)}
                            className={cn(
                              'rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors duration-200',
                              campus === campusOption
                                ? 'bg-gradient-to-r from-indigo-500/15 to-cyan-400/15 text-foreground'
                                : 'text-muted-foreground hover:bg-white/40 dark:hover:bg-white/10'
                            )}
                          >
                            {campusOption}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl bg-white/40 p-3 shadow-inner shadow-white/40 ring-1 ring-white/50 dark:bg-white/5 dark:ring-white/10">
                      <Avatar>
                        <AvatarImage src="" alt="Profile" />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">You</p>
                        <p className="text-xs text-muted-foreground">Manage profile & security</p>
                      </div>
                      <Button asChild variant="ghost" className="ml-auto rounded-xl px-3 py-1 text-xs font-semibold hover:bg-white/50 dark:hover:bg-white/10">
                        <Link to="/profile">Open</Link>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

