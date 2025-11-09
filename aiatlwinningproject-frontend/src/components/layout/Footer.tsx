import { Link } from 'react-router-dom'
import { Shield, FileText, Lock, AlertCircle } from 'lucide-react'

const footerLinks = [
  { to: '/safety', label: 'Safety', icon: Shield },
  { to: '/terms', label: 'Terms', icon: FileText },
  { to: '/privacy', label: 'Privacy', icon: Lock },
  { to: '/report', label: 'Report Issue', icon: AlertCircle },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-background shadow-sm">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Footer Text */}
          <p className="text-sm text-muted-foreground text-center md:text-left">
            Campus-verified network • Private messaging • Smart meet-ups
          </p>

          {/* Footer Links */}
          <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {footerLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </footer>
  )
}

