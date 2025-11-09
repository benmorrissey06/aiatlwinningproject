import { Router, Request, Response } from 'express'
import { FlashRequest, IFlashRequest } from '../models/FlashRequest'
import { Types } from 'mongoose'

const router = Router()

// Create a new flash request
router.post('/', async (req: Request, res: Response) => {
  try {
    const { text, metadata = {} } = req.body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Text is required and must be a non-empty string' 
      })
    }

    // Extract metadata fields with defaults
    const category = metadata.category || 'Other'
    const urgency = typeof metadata.urgency === 'number' ? metadata.urgency : 1
    const userId = metadata.userId || null

    // Create flash request
    const flashRequest = new FlashRequest({
      text: text.trim(),
      category,
      urgency,
      userId,
      metadata,
      status: 'active'
    })

    const savedRequest = await flashRequest.save()

    res.status(201).json({
      success: true,
      requestId: (savedRequest._id as Types.ObjectId).toString(),
      data: {
        id: savedRequest._id,
        text: savedRequest.text,
        metadata: savedRequest.metadata,
        status: savedRequest.status,
        createdAt: savedRequest.createdAt
      }
    })
  } catch (error) {
    console.error('Error creating flash request:', error)
    res.status(500).json({ 
      error: 'Failed to create flash request',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get all flash requests (for admin/testing)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, category, limit = 50 } = req.query
    
    const filter: any = {}
    if (status) filter.status = status
    if (category) filter['metadata.category'] = category

    const requests = await FlashRequest
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .select('-__v')

    res.json({
      success: true,
      count: requests.length,
      data: requests.map((request: IFlashRequest) => ({
        id: (request._id as Types.ObjectId).toString(),
        text: request.text,
        category: request.metadata.category,
        urgency: request.metadata.urgency,
        status: request.status,
        userId: request.userId,
        createdAt: request.createdAt,
        metadata: request.metadata
      }))
    })
  } catch (error) {
    console.error('Error fetching flash requests:', error)
    res.status(500).json({ 
      error: 'Failed to fetch flash requests',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get a specific flash request by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid request ID format' })
    }

    const flashRequest = await FlashRequest.findById(id).select('-__v')
    
    if (!flashRequest) {
      return res.status(404).json({ error: 'Flash request not found' })
    }

    res.json({
      success: true,
      data: {
        id: (flashRequest._id as Types.ObjectId).toString(),
        text: flashRequest.text,
        status: flashRequest.status,
        userId: flashRequest.userId,
        createdAt: flashRequest.createdAt,
        updatedAt: flashRequest.updatedAt,
        metadata: flashRequest.metadata
      }
    })
  } catch (error) {
    console.error('Error fetching flash request:', error)
    res.status(500).json({ 
      error: 'Failed to fetch flash request',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get matches for a flash request (mock implementation)
router.get('/:id/matches', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid request ID format' })
    }

    const flashRequest = await FlashRequest.findById(id)
    
    if (!flashRequest) {
      return res.status(404).json({ error: 'Flash request not found' })
    }

    // Mock matches based on the request category
    const mockMatches = [
      {
        user: {
          id: '1',
          name: 'Alex Chen',
          major: 'Computer Science',
          dorm: 'East Campus - Baker House',
          rating: 4.9,
          verified: true,
          trustScore: 95,
          pastTrades: 15,
          badges: ['Verified Student', 'Top Helper']
        },
        likelihood: 0.9,
        distanceMin: 5,
        sharedTraits: ['Same dorm area', 'Electronics category']
      },
      {
        user: {
          id: '2',
          name: 'Jordan Smith',
          major: 'Biology',
          dorm: 'West Campus - Random Hall',
          rating: 4.8,
          verified: true,
          trustScore: 92,
          pastTrades: 22,
          badges: ['Verified Student', 'Campus Leader']
        },
        likelihood: 0.75,
        distanceMin: 8,
        sharedTraits: ['High trust score', 'Similar item history']
      }
    ]

    res.json({
      success: true,
      requestId: id,
      request: {
        id: (flashRequest._id as Types.ObjectId).toString(),
        text: flashRequest.text,
        metadata: flashRequest.metadata
      },
      matches: mockMatches
    })
  } catch (error) {
    console.error('Error fetching matches:', error)
    res.status(500).json({ 
      error: 'Failed to fetch matches',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Send pings for a flash request (mock implementation)
router.post('/:id/pings', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { matchIds, broadcastType = 'narrow' } = req.body

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid request ID format' })
    }

    const flashRequest = await FlashRequest.findById(id)
    
    if (!flashRequest) {
      return res.status(404).json({ error: 'Flash request not found' })
    }

    // Mock ping logic
    const pingedCount = Array.isArray(matchIds) ? matchIds.length : 0

    res.json({
      success: true,
      pinged: pingedCount,
      broadcastType
    })
  } catch (error) {
    console.error('Error sending pings:', error)
    res.status(500).json({ 
      error: 'Failed to send pings',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
