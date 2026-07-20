import { Router } from 'express'
import { search, getTrendingSearches, getSuggestions } from '../controllers/searchController'

const router = Router()

/**
 * Public search endpoints (no auth required)
 */
router.get('/search', search)
router.get('/search/trending', getTrendingSearches)
router.get('/search/suggest', getSuggestions)

export default router
