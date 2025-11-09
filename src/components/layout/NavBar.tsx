import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Zap, Menu, Bell, MapPin, ChevronDown, LogOut, User } from 'lucide-react'
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
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

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
  const navigate = useNavigate()
  const { campus, setCampus } = useCampus()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken')
      const userId = localStorage.getItem('userId')
      setIsLoggedIn(!!token && !!userId)
      
      // Try to get user name from localStorage or fetch it
      if (userId && token) {
        // You could also fetch from API, but for now we'll use a simple approach
        // The name will be available after login/registration
        const storedName = localStorage.getItem('userName')
        if (storedName) {
          setUserName(storedName)
        }
      } else {
        setUserName(null)
      }
    }
    
    checkAuth()
    
    // Listen for storage changes (e.g., login/logout in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' || e.key === 'userId' || e.key === 'userName') {
        checkAuth()
      }
    }
    
    // Listen for custom auth change event (for same-window changes)
    const handleAuthChange = () => {
      checkAuth()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('authChange', handleAuthChange)
    
    // Also check on focus (when user returns to tab)
    const handleFocus = () => {
      checkAuth()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('authChange', handleAuthChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    // Clear session storage for messages/threads if desired
    // sessionStorage.clear() // Uncomment if you want to clear all session data
    
    setIsLoggedIn(false)
    setUserName(null)
    
    // Trigger auth change event to update UI
    window.dispatchEvent(new CustomEvent('authChange'))
    
    toast.success('Logged out successfully', {
      description: 'You have been logged out.',
    })
    
    // Redirect to home page
    navigate('/')
  }

  // Define which routes are public (accessible without login)
  const publicRoutes = ['/', '/safety']

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navLinks.map((link) => {
        const isActive = location.pathname === link.to
        const isProtected = !publicRoutes.includes(link.to)
        
        // If not logged in and trying to access protected route, redirect to login
        const handleClick = (e: React.MouseEvent) => {
          if (!isLoggedIn && isProtected) {
            e.preventDefault()
            toast.error('Authentication required', {
              description: 'Please log in to access this page.',
            })
            navigate('/login', { state: { from: link.to } })
          }
        }
        
        if (mobile) {
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={handleClick}
              className={cn(
                'flex items-center justify-between rounded-xl px-3 py-2 text-base font-semibold transition-colors duration-200',
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-400/20 text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
                !isLoggedIn && isProtected && 'opacity-70 hover:opacity-100'
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
            onClick={handleClick}
            className={cn(
              'group relative flex items-center px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition-colors duration-200',
              isActive ? 'text-foreground' : 'text-slate-500 hover:text-foreground',
              !isLoggedIn && isProtected && 'opacity-70 hover:opacity-100'
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

               {isLoggedIn ? (
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button variant="ghost" className="relative h-14 w-14 rounded-full bg-white/40 shadow-inner shadow-white/50 ring-1 ring-white/50 backdrop-blur btn-focus hover:bg-white/60 dark:bg-white/10 dark:ring-white/10 overflow-hidden">
                       <Avatar className="h-full w-full">
                        <AvatarImage 
                          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 120'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%234f46e5;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%236366f1;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='32' r='18' fill='url(%23grad)'/%3E%3Cpath d='M 25 55 Q 25 50 30 50 L 70 50 Q 75 50 75 55 L 75 105 Q 75 110 70 110 L 30 110 Q 25 110 25 105 Z' fill='url(%23grad)'/%3E%3C/svg%3E" 
                          alt="Profile" 
                        />
                        <AvatarFallback>
                          {userName ? userName.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-white/20 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90">
                    <DropdownMenuLabel>
                      {userName ? `Hi, ${userName}` : 'My Account'}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  asChild
                  variant="default"
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-600 hover:to-cyan-500 transition-all duration-200"
                >
                  <Link to="/login">Login</Link>
                </Button>
              )}
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

                     {isLoggedIn ? (
                       <div className="flex items-center gap-3 rounded-2xl bg-white/40 p-3 shadow-inner shadow-white/40 ring-1 ring-white/50 dark:bg-white/5 dark:ring-white/10">
                         <Avatar className="h-16 w-16">
                          <AvatarImage 
                            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 120'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%234f46e5;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%236366f1;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='32' r='18' fill='url(%23grad)'/%3E%3Cpath d='M 25 55 Q 25 50 30 50 L 70 50 Q 75 50 75 55 L 75 105 Q 75 110 70 110 L 30 110 Q 25 110 25 105 Z' fill='url(%23grad)'/%3E%3C/svg%3E" 
                            alt="Profile" 
                          />
                          <AvatarFallback>
                            {userName ? userName.charAt(0).toUpperCase() : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{userName || 'You'}</p>
                          <p className="text-xs text-muted-foreground">Manage profile & security</p>
                        </div>
                        <Button 
                          onClick={handleLogout}
                          variant="ghost" 
                          className="rounded-xl px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <LogOut className="h-3 w-3 mr-1" />
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <Button
                        asChild
                        variant="default"
                        className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-600 hover:to-cyan-500 transition-all duration-200"
                      >
                        <Link to="/login">Login</Link>
                      </Button>
                    )}
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

