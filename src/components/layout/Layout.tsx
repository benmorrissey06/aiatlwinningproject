import { Outlet } from 'react-router-dom'
import { NavBar } from './NavBar'
import { Footer } from './Footer'
import { FloatingActionButton } from '@/components/FloatingActionButton'
import { CampusProvider } from './CampusContext'
import { CampusHeader } from './CampusHeader'

export function Layout() {
  return (
    <CampusProvider>
      <div className="flex min-h-screen flex-col">
        <NavBar />
        <CampusHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <FloatingActionButton />
      </div>
    </CampusProvider>
  )
}

