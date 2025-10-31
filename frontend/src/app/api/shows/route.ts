import { NextRequest, NextResponse } from 'next/server';
import { TMDBService } from '@/lib/tmdb';
import { DatabaseService } from '@/lib/database';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json(
      { success: false, error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await TMDBService.searchShows(query, page, limit);

    // Enrich with watch providers
    const enrichedShows = await Promise.all(
      result.shows.map(async (show: any) => {
        const providers = await TMDBService.getWatchProviders(show.tmdb_id);
        return {
          ...show,
          providers: providers.providers,
          availability: providers.availability
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedShows,
      pagination: {
        page: result.page,
        total_pages: result.total_pages,
        total_results: result.total_results
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search shows' },
      { status: 500 }
    );
  }
}
