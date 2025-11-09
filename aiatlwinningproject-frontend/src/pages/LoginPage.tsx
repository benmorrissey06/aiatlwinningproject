import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, User, MapPin, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    location: '',
    bio: ''
  })
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get the return URL from navigation state, or default to profile
  const returnUrl = (location.state as { from?: string })?.from || '/profile'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        // Login
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.detail || 'Login failed')
        }

        const data = await response.json()
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('userId', data.userId)
        // Store user name for display in navbar
        if (data.user?.name) {
          localStorage.setItem('userName', data.user.name)
        }
        toast.success('Login successful!', {
          description: `Welcome back, ${data.user.name}!`,
        })
        // Trigger a custom event to notify NavBar of login
        window.dispatchEvent(new CustomEvent('authChange'))
        // Navigate to the return URL or profile
        navigate(returnUrl)
      } else {
        // Register
        if (!formData.name || !formData.email || !formData.password || !formData.location || !formData.bio) {
          toast.error('Please fill in all fields')
          setLoading(false)
          return
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            location: formData.location,
            bio: formData.bio,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.detail || 'Registration failed')
        }

        const data = await response.json()
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('userId', data.userId)
        // Store user name for display in navbar
        if (data.user?.name) {
          localStorage.setItem('userName', data.user.name)
        }
        toast.success('Registration successful!', {
          description: 'Your account has been created and your bio is being processed.',
        })
        // Trigger a custom event to notify NavBar of login
        window.dispatchEvent(new CustomEvent('authChange'))
        // Navigate to the return URL or profile
        navigate(returnUrl)
      }
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4 py-12"
    >
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? 'Sign in to continue to Flash Request'
                : 'Join Flash Request and start trading'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  <User className="inline h-4 w-4 mr-2" />
                  Full Name
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                <Mail className="inline h-4 w-4 mr-2" />
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@university.edu"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Lock className="inline h-4 w-4 mr-2" />
                Password
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <MapPin className="inline h-4 w-4 mr-2" />
                    Location (City, State)
                  </label>
                  <Input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Boston, MA"
                    required={!isLogin}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <FileText className="inline h-4 w-4 mr-2" />
                    Bio
                  </label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself, your interests, and what you like to buy/sell..."
                    rows={5}
                    required={!isLogin}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your bio will be processed to create your seller profile
                  </p>
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setFormData({ email: '', password: '', name: '', location: '', bio: '' })
              }}
              className="text-sm text-primary hover:underline"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

