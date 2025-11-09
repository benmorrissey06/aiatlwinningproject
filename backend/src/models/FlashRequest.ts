import mongoose, { Document, Schema } from 'mongoose'

export interface IFlashRequest extends Document {
  text: string
  metadata: {
    category?: string
    quantity?: string
    when?: string
    location?: string
    urgency?: number
    requireCheckIn?: boolean
    source?: string
  }
  userId: string
  status: 'active' | 'fulfilled' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

const flashRequestSchema = new Schema<IFlashRequest>({
  text: {
    type: String,
    required: true,
    trim: true
  },
  metadata: {
    category: String,
    quantity: String,
    when: String,
    location: String,
    urgency: {
      type: Number,
      default: 1,
      min: 1,
      max: 5
    },
    requireCheckIn: {
      type: Boolean,
      default: false
    },
    source: String
  },
  userId: {
    type: String,
    required: false // Making it optional for now since we don't have auth tokens in all requests
  },
  status: {
    type: String,
    enum: ['active', 'fulfilled', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
})

// Add indexes for better query performance
flashRequestSchema.index({ userId: 1, createdAt: -1 })
flashRequestSchema.index({ status: 1, createdAt: -1 })
flashRequestSchema.index({ 'metadata.category': 1 })

export const FlashRequest = mongoose.model<IFlashRequest>('FlashRequest', flashRequestSchema)
