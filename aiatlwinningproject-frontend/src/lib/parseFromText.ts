/**
 * Parse when and where from user input text
 */

export interface ParsedDetails {
  when?: string
  where?: string
}

/**
 * Extract timing information from text
 */
function parseWhen(input: string): string | undefined {
  // Match time patterns with "around", "at", "by", "before", "after"
  const timeWithPrepositionPatterns = [
    /\b(around|at|by|before|after)\s+(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)\b/i,
    /\b(around|at|by|before|after)\s+(\d{1,2})\s*(am|pm|AM|PM)\b/i,
  ]

  for (const pattern of timeWithPrepositionPatterns) {
    const match = input.match(pattern)
    if (match) {
      return match[0].trim()
    }
  }

  // Match time patterns without preposition
  const timePatterns = [
    /\b(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)\b/i,
    /\b(\d{1,2})\s*(am|pm|AM|PM)\b/i,
  ]

  for (const pattern of timePatterns) {
    const match = input.match(pattern)
    if (match) {
      return match[0].trim()
    }
  }

  // Match relative time
  const relativePatterns = [
    /\b(now|today|tomorrow|tonight|this\s+(?:morning|afternoon|evening|week|weekend))\b/i,
    /\b(asap|as\s+soon\s+as\s+possible|urgent|immediate)\b/i,
    /\b(in|within)\s+(\d+)\s+(?:hour|hr|minute|min|day)\b/i,
    /\b(by\s+tomorrow|by\s+today)\b/i,
  ]

  for (const pattern of relativePatterns) {
    const match = input.match(pattern)
    if (match) {
      return match[0].trim()
    }
  }

  return undefined
}

/**
 * Extract location information from text
 */
function parseWhere(input: string): string | undefined {
  // First, try common campus locations (case-insensitive)
  const commonLocations = [
    'Student Center',
    'Library',
    'Main Quad',
    'Dining Hall',
    'Gym',
    'Campus',
    'Dorm',
  ]
  
  for (const loc of commonLocations) {
    const regex = new RegExp(`\\b${loc.replace(/\s+/g, '\\s+')}\\b`, 'i')
    if (regex.test(input)) {
      return loc
    }
  }

  // Match parking lot patterns
  const parkingMatch = input.match(/\b(Parking\s+Lot\s+[A-Z])\b/i)
  if (parkingMatch) {
    return parkingMatch[1]
  }

  // Match building patterns
  const buildingMatch = input.match(/\b(Building\s+[A-Z0-9]+)\b/i)
  if (buildingMatch) {
    return buildingMatch[1]
  }

  // Look for location after common prepositions (at, in, near, by)
  // Match pattern: "at Location" or "in Location" where Location starts with capital letter
  const prepositionPatterns = [
    /\b(at|in|near|by)\s+([A-Z][A-Za-z0-9\s&'-]{2,40}?)(?:\s+(?:around|at|by|,|\.|;|$|\n|around))/i,
    /\b(at|in|near|by)\s+([A-Z][A-Za-z0-9\s&'-]{2,40})\b/i,
  ]

  for (const pattern of prepositionPatterns) {
    const match = input.match(pattern)
    if (match && match[2]) {
      const loc = match[2].trim()
      // Filter out common false positives and time-related words
      if (
        loc.length > 2 &&
        loc.length < 50 &&
        !loc.match(/\b(the|a|an|my|your|this|that|today|tomorrow|5pm|6pm|7pm|8pm|9pm|10pm|11pm|12pm|1pm|2pm|3pm|4pm|5am|6am|7am|8am|9am|10am|11am|12am|1am|2am|3am|4am)\b/i)
      ) {
        // Capitalize first letter of each word for consistency
        return loc.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
      }
    }
  }

  return undefined
}

/**
 * Parse when and where from input text
 */
export function parseFromText(input: string): ParsedDetails {
  if (!input || !input.trim()) {
    return {}
  }

  const normalizedInput = input.trim()

  return {
    when: parseWhen(normalizedInput),
    where: parseWhere(normalizedInput),
  }
}

