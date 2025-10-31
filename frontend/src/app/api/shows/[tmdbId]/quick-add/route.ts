import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { AuthService } from '@/lib/auth';
import { TMDBService } from '@/lib/tmdb';

// Middleware to authenticate requests
async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  try {
    const user = await AuthService.verifyToken(token);
    return user;
  } catch (error) {
    return null;
  }
}

interface RouteParams {
  params: {
    tmdbId: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tmdbId = parseInt(params.tmdbId);

    // First, ensure the show exists in our database
    let show: any = await DatabaseService.getShowByTmdbId(tmdbId);

    if (!show) {
      // Fetch show details from TMDB and upsert
      const showDetails = await TMDBService.getShowDetails(tmdbId);
      if (!showDetails) {
        return NextResponse.json(
          { success: false, error: 'Show not found' },
          { status: 404 }
        );
      }

      show = await DatabaseService.upsertShow(showDetails);
      if (!show) {
        return NextResponse.json(
          { success: false, error: 'Failed to create show' },
          { status: 500 }
        );
      }
    }

    // Quick add to watchlist
    const result = await DatabaseService.quickAddToWatchlist(user.id, show.id);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Show added to watchlist successfully'
    });
  } catch (error: any) {
    console.error('Quick add error:', error);

    if (error.message === 'Show is already in watchlist') {
      return NextResponse.json(
        { success: false, error: 'Show is already in your watchlist' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to add show to watchlist' },
      { status: 500 }
    );
  }
}
