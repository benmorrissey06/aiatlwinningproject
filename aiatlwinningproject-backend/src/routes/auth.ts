import express, { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { User } from '../models/User'
import { SellerProfile } from '../models/SellerProfile'

const router = express.Router()

// Register user with bio processing
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, location, bio } = req.body

    // Validate required fields
    if (!name || !email || !password || !location || !bio) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' })
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      location,
      bio,
      verified: false,
      trustScore: 0,
      rating: 0,
      pastTrades: 0,
      badges: []
    })

    await user.save()

    // Process bio through existing LLM service to create seller profile
    try {
      // Call existing LLM service from json-parsing-gemini
      const response = await fetch('http://localhost:3001/api/parse-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: bio, userId: (user._id as any).toString() })
      })

      if (response.ok) {
        const sellerProfileData = await response.json()
        
        // Create seller profile with LLM output
        const sellerProfile = new SellerProfile({
          ...sellerProfileData,
          user_id: (user._id as any).toString(),
          context: { original_text: bio }
        })

        await sellerProfile.save()

        // Link seller profile to user
        user.sellerProfile = sellerProfile._id as any
        await user.save()

        console.log('Seller profile created and linked successfully')
      } else {
        console.warn('LLM service unavailable, user created without seller profile')
      }
    } catch (llmError) {
      console.warn('Failed to process bio through LLM:', llmError)
      // User registration still succeeds even if LLM processing fails
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location,
        verified: user.verified,
        trustScore: user.trustScore,
        hasSellerProfile: !!user.sellerProfile
      },
      token
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).populate('sellerProfile')
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location,
        verified: user.verified,
        trustScore: user.trustScore,
        rating: user.rating,
        pastTrades: user.pastTrades,
        badges: user.badges,
        hasSellerProfile: !!user.sellerProfile,
        sellerProfile: user.sellerProfile
      },
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    // TODO: Add JWT middleware to verify token
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const user = await User.findById(userId).populate('sellerProfile').select('-password')
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location,
        bio: user.bio,
        verified: user.verified,
        trustScore: user.trustScore,
        rating: user.rating,
        pastTrades: user.pastTrades,
        badges: user.badges,
        sellerProfile: user.sellerProfile,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router