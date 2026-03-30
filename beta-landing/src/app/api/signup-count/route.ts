import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { count, error } = await supabase
      .from('beta_signups')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return NextResponse.json({ count: count || 0 });
  } catch {
    // Fail silently — page still works without the count
    return NextResponse.json({ count: 0 });
  }
}
