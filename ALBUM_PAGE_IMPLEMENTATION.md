# Album Page Implementation

## Overview
This document describes the frontend implementation of dynamic album pages for the Groovo application. The feature allows users to view detailed information about individual albums including track listings, metadata, and navigation.

## What Has Been Implemented

### Frontend Components

#### 1. TypeScript Interfaces (`app/types/spotify.ts`)
Created comprehensive TypeScript interfaces for:
- `SpotifyArtist` - Artist information
- `SpotifyImage` - Image metadata
- `SpotifyTrack` - Track information
- `SpotifyAlbum` - Basic album information
- `SpotifyAlbumWithTracks` - Extended album information with track listings

#### 2. API Route (`app/api/album/[id]/route.ts`)
Created a Next.js API route that:
- Accepts a Spotify album ID as a dynamic parameter
- Authenticates with Spotify using our client credentials
- Fetches detailed album information using the Spotify Web API
- Returns formatted album data including tracks

#### 3. Album Page Component (`app/album/[id]/page.tsx`)
Created a album page that displays:
- **Album Information**: Title, artist, release date, total tracks, genres
- **Album Artwork**: the album cover image
- **Action Buttons**: 
  - "Play on Spotify" button that links to the Spotify album page
  - "Review Album" button (UI only, no functionality yet)
- **Compact Tracklist** (first 12 tracks):
  - Track number
  - Track name
  - Duration
  - Displays "+X more tracks" if album has more than 12 tracks (we can change it to have all of the tracks tho)
- **Reviews Section** (mock data, frontend only):
  - User avatar with the initials
  - Username
  - 5-star rating display (purple for filled stars)
  - Review text
  - Date
- **Navigation**: Back button to return to previous page; clickable Groovo logo in header
- **Loading States**: Skeleton UI while data is being fetched
- **Error Handling**: Fallback UI when album data is unavailable

#### 4. Updated Existing Components
Modified the following components to link to album pages:
- `app/profile/SavedAlbumsGrid.tsx` - Albums now navigate to their detail page
- `app/page.tsx` - New releases link to album detail pages
- `app/discover/page.tsx` - Search results link to album detail pages

### Features Implemented
 Dynamic album routes using Next.js 15 App  
 Album page component with comprehensive information display  
 TypeScript interfaces for type safety  
 API route for fetching album details from Spotify  
 Navigation links from all album grids to individual pages  
 Back button for navigation  
 Loading indicator during data fetch  
 Error handling with fallback UI  
 Review section with mock data (frontend only)  
 Compact tracklist showing first 12 tracks  
 Review button (UI only, no backend functionality)  
 Link to Spotify for full album playback  
 Groovo logo now links back to main page on all pages  
 Reviews display with star ratings and avatars   (WITH MOCK DATA)



**Database Schema Needed**:
```typescript
interface Review {
  _id: string;
  userId: string;
  albumId: string; // Spotify ID
  rating: number; // 1-5
  reviewText: string;
  createdAt: Date;
  updatedAt: Date;
}
```


#### Need to do( has not been implemented)
Review Button Functionality
User Authentication Integration
- Verify user is authenticated before allowing review submission
- Associate reviews with the authenticated user
- Implement authorization checks for update/delete operations

The "Review Album" button on `app/album/[id]/page.tsx` needs:
- Modal/dialog for review submission
- Form with rating selector (1-5 stars)(we could add half stars in the future but for now stars should be fine I Think)
- Text area for review text
- Submit handler to call the review API
- Success/error handling

## Current API Endpoints in Use

### Existing Endpoints
1. **GET /api/spotify?query=** - Search albums 
2. **GET /api/new-album-releases?market=&limit=** - Get new releases 
3. **GET /api/album/[id]** - Get album details (newly created)

## Testing the Implementation

### To Test the Current Implementation:
1. Navigate to any album from:
   - Home page (new releases)
   - Discover page (search results)
   - Profile page (saved albums)
2. Click on an album card
3. You should see the album detail page with all information

### To Test Reviews (After Backend Implementation):
1. Click "Review Album" button
2. Submit a review with rating and text
3. Review should appear on the album page
4. User can edit/delete their own reviews

## Files Created/Modified

### New Files:
- `app/types/spotify.ts` - TypeScript interfaces
- `app/api/album/[id]/route.ts` - Album API route
- `app/album/[id]/page.tsx` - Album page component
- `ALBUM_PAGE_IMPLEMENTATION.md` - This documentation

### Modified Files:
- `app/profile/SavedAlbumsGrid.tsx` - Added Link component to make albums clickable
- `app/page.tsx` - Changed anchor tags to Link components; made logo clickable
- `app/discover/page.tsx` - Changed anchor tags to Link components; added navigation header with links
- `app/profile/page.tsx` - Split logo into separate Link elements for proper hover behavior; made logo clickable to return home

## Notes

- All album IDs used are Spotify IDs (not database IDs)
- The implementation assumes Spotify IDs are consistent across the application(wont work with profile page for now)

