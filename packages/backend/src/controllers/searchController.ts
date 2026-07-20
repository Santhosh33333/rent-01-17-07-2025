import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SearchResult {
  type: 'user' | 'event' | 'community' | 'booking'
  id: string
  title: string
  subtitle?: string
  description?: string
  imageUrl?: string
  link?: string
  metadata?: Record<string, any>
}

/**
 * Universal search across all entities
 * GET /search?q=keyword&filter=all|users|events|communities&limit=20
 */
export async function search(req: Request, res: Response) {
  try {
    const { q, filter = 'all', limit = 20 } = req.query
    const query = String(q || '').trim().toLowerCase()
    const searchLimit = Math.min(Number(limit) || 20, 100)

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: { results: [], total: 0 },
        message: 'Query too short'
      })
    }

    const results: SearchResult[] = []

    // Search users
    if (filter === 'all' || filter === 'users') {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { fullName: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
          ]
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
          status: true,
        },
        take: searchLimit,
      })

      results.push(...users.map(u => ({
        type: 'user' as const,
        id: u.id,
        title: u.fullName || 'Anonymous',
        subtitle: u.email,
        description: u.status === 'ACTIVE' ? 'Active' : u.status,
        imageUrl: u.avatarUrl || undefined,
        link: `/profile/${u.id}`,
        metadata: { status: u.status }
      })))
    }

    // Search events
    if (filter === 'all' || filter === 'events') {
      const events = await prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
            { location: { contains: query } },
          ]
        },
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          startTime: true,
          attendeeCount: true,
        },
        take: searchLimit,
      })

      results.push(...events.map(e => ({
        type: 'event' as const,
        id: e.id,
        title: e.title,
        subtitle: new Date(e.startTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        description: `${e.location || 'Location TBA'} • ${e.attendeeCount || 0} attending`,
        link: `/events/${e.id}`,
        metadata: {
          startTime: e.startTime,
          location: e.location,
          attendeeCount: e.attendeeCount
        }
      })))
    }

    // Search communities
    if (filter === 'all' || filter === 'communities') {
      const communities = await prisma.community.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
          ]
        },
        select: {
          id: true,
          name: true,
          description: true,
          memberCount: true,
        },
        take: searchLimit,
      })

      results.push(...communities.map(c => ({
        type: 'community' as const,
        id: c.id,
        title: c.name,
        subtitle: 'Community',
        description: `${c.memberCount || 0} members`,
        link: `/communities/${c.id}`,
        metadata: {
          members: c.memberCount
        }
      })))
    }

    // Sort by relevance (exact match first, then partial)
    const sortedResults = results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === query ? 0 : 1
      const bExact = b.title.toLowerCase() === query ? 0 : 1
      return aExact - bExact
    })

    return res.json({
      success: true,
      data: {
        results: sortedResults.slice(0, searchLimit),
        total: sortedResults.length,
        query,
        filter
      }
    })
  } catch (error) {
    console.error('Search error:', error)
    return res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * Get trending searches (popular queries)
 * GET /search/trending
 */
export async function getTrendingSearches(req: Request, res: Response) {
  try {
    // Get top communities
    const topCommunities = await prisma.community.findMany({
      select: { id: true, name: true },
      take: 5,
    })

    // Get upcoming events
    const topEvents = await prisma.event.findMany({
      where: { startTime: { gte: new Date() } },
      select: { id: true, title: true, startTime: true },
      take: 5,
      orderBy: { startTime: 'asc' }
    })

    return res.json({
      success: true,
      data: {
        communities: topCommunities,
        events: topEvents,
      }
    })
  } catch (error) {
    console.error('Trending search error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to get trending',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * Get search suggestions (autocomplete)
 * GET /search/suggest?q=keyword
 */
export async function getSuggestions(req: Request, res: Response) {
  try {
    const { q } = req.query
    const query = String(q || '').trim().toLowerCase()

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: { suggestions: [] }
      })
    }

    const suggestions: string[] = []

    // Get user name suggestions
    const users = await prisma.user.findMany({
      where: { fullName: { contains: query } },
      select: { fullName: true },
      take: 3,
    })
    suggestions.push(...users.map(u => u.fullName).filter(Boolean))

    // Get event title suggestions
    const events = await prisma.event.findMany({
      where: { title: { contains: query } },
      select: { title: true },
      take: 3,
    })
    suggestions.push(...events.map(e => e.title))

    // Get community name suggestions
    const communities = await prisma.community.findMany({
      where: { name: { contains: query } },
      select: { name: true },
      take: 3,
    })
    suggestions.push(...communities.map(c => c.name))

    // Remove duplicates and limit
    const unique = Array.from(new Set(suggestions)).slice(0, 10)

    return res.json({
      success: true,
      data: { suggestions: unique }
    })
  } catch (error) {
    console.error('Suggestions error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to get suggestions',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
