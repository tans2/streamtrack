import { TMDBService } from './services/tmdb';
import { DatabaseService } from './services/database';
import dotenv from 'dotenv';

dotenv.config();

async function testServices() {
  console.log('🧪 Testing StreamTrack Services...\n');

  // Test TMDB API connection
  console.log('1. Testing TMDB API connection...');
  try {
    const tmdbConnected = await TMDBService.testConnection();
    if (tmdbConnected) {
      console.log('✅ TMDB API connection successful\n');
    } else {
      console.log('❌ TMDB API connection failed\n');
      return;
    }
  } catch (error) {
    console.log('❌ TMDB API connection failed:', error, '\n');
    return;
  }

  // Test fetching popular shows
  console.log('2. Testing TMDB popular shows...');
  try {
    const popularShows = await TMDBService.getPopularShows(1, 5);
    console.log(`✅ Fetched ${popularShows.shows.length} popular shows`);
    console.log('Sample shows:');
    popularShows.shows.slice(0, 3).forEach((show: any, index: number) => {
      console.log(`   ${index + 1}. ${show.title} (Rating: ${show.rating})`);
    });
    console.log('');
  } catch (error) {
    console.log('❌ Failed to fetch popular shows:', error, '\n');
  }

  // Test search functionality
  console.log('3. Testing TMDB search...');
  try {
    const searchResults = await TMDBService.searchShows('stranger things', 1, 3);
    console.log(`✅ Search found ${searchResults.shows.length} results for "stranger things"`);
    searchResults.shows.forEach((show: any, index: number) => {
      console.log(`   ${index + 1}. ${show.title} (${show.status})`);
    });
    console.log('');
  } catch (error) {
    console.log('❌ Search failed:', error, '\n');
  }

  // Test database connection (if Supabase is configured)
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('4. Testing database connection...');
    try {
      const dbConnected = await DatabaseService.testConnection();
      if (dbConnected) {
        console.log('✅ Database connection successful\n');
      } else {
        console.log('❌ Database connection failed\n');
      }
    } catch (error) {
      console.log('❌ Database connection failed:', error, '\n');
    }
  } else {
    console.log('4. Skipping database test (Supabase not configured)\n');
  }

  console.log('🎉 Service testing complete!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  testServices().catch(console.error);
}

export { testServices };

