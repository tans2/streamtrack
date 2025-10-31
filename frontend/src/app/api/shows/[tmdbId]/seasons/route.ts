import { NextRequest, NextResponse } from 'next/server';
import { TMDBService } from '@/lib/tmdb';

interface RouteParams {
  params: {
    tmdbId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const tmdbId = parseInt(params.tmdbId);
    const { searchParams } = new URL(request.url);
    const seasonNumber = searchParams.get('season');

    if (seasonNumber) {
      // Get specific season details
      const seasonData = await TMDBService.getShowSeasons(tmdbId, parseInt(seasonNumber));

      if (!seasonData) {
        return NextResponse.json(
          { success: false, error: 'Season not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: seasonData
      });
    } else {
      // Get show details for season count
      const showDetails = await TMDBService.getShowDetails(tmdbId);

      if (!showDetails) {
        return NextResponse.json(
          { success: false, error: 'Show not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          total_seasons: showDetails.number_of_seasons,
          season: null
        }
      });
    }
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch seasons' },
      { status: 500 }
    );
  }
}
