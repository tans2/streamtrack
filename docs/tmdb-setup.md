# TMDB API Setup Guide for StreamTrack

## 🎬 What is TMDB?

**The Movie Database (TMDB)** is a free, community-built database of movies and TV shows. It provides a comprehensive API that we'll use to:

- Fetch popular TV shows
- Get show details, seasons, and episodes
- Access show images and metadata
- Track show status and air dates

## 🚀 Getting Started

### 1. Create TMDB Account
- Visit [themoviedb.org](https://www.themoviedb.org)
- Click "Sign Up" in the top right
- Fill in your details and verify your email

### 2. Request API Access
- Log in to your TMDB account
- Go to **Settings → API**
- Click **"Request an API key"**
- Choose **"Developer"** option
- Fill out the form:
  - **Application Name**: `StreamTrack`
  - **Application URL**: `http://localhost:3000` (for development)
  - **Application Summary**: "Streaming content tracking app for TV shows"
  - **Application Purpose**: "Personal project"
  - **Application Category**: "Personal"

### 3. Get Your API Key
- Wait for approval (usually instant for personal projects)
- Copy your **API Key (v3 auth)** - it looks like: `1234567890abcdef1234567890abcdef`

## 🔑 API Key Usage

### Rate Limits
- **Free tier**: 1,000 requests per day
- **More than enough** for development and personal use

### Base URL
```
https://api.themoviedb.org/3
```

### Example API Calls
```bash
# Get popular TV shows
GET https://api.themoviedb.org/3/tv/popular?api_key=YOUR_API_KEY

# Get show details
GET https://api.themoviedb.org/3/tv/1399?api_key=YOUR_API_KEY

# Search for shows
GET https://api.themoviedb.org/3/search/tv?api_key=YOUR_API_KEY&query=stranger+things
```

## 📺 TV Show Endpoints We'll Use

### 1. **Popular Shows**
```
GET /tv/popular
```
- Returns currently popular TV shows
- Perfect for homepage content

### 2. **Show Details**
```
GET /tv/{tv_id}
```
- Complete show information
- Status, air dates, genres, ratings

### 3. **Show Seasons**
```
GET /tv/{tv_id}/season/{season_number}
```
- Season information and episodes
- Air dates and episode counts

### 4. **Search Shows**
```
GET /search/tv?query={search_term}
```
- Find shows by title
- User search functionality

### 5. **Show Images**
```
GET /tv/{tv_id}/images
```
- Posters, backdrops, and stills
- Multiple sizes available

## 🎯 What We'll Build

1. **TMDB Service** - Backend service to fetch data
2. **Show Discovery** - Popular shows on homepage
3. **Show Search** - User search functionality
4. **Show Details** - Individual show pages
5. **Content Sync** - Regular updates from TMDB

## ✅ Next Steps

1. Create TMDB account
2. Request API key
3. Add API key to environment variables
4. Test API connection
5. Start building TMDB service

## 🆘 Need Help?

- TMDB API docs: [developers.themoviedb.org](https://developers.themoviedb.org)
- API status: [status.themoviedb.org](https://status.themoviedb.org)
- Community: [themoviedb.org/community](https://www.themoviedb.org/community)




