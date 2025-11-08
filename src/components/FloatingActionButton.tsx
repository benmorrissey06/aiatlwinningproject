import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function FloatingActionButton() {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate('/request/create')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition"
      aria-label="Create new request"
    >
      <Plus className="h-6 w-6" aria-hidden="true" />
      <span className="sr-only">Create new request</span>
    </button>
  )
}

