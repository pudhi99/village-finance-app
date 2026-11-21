import { NextResponse } from 'next/server';
import { getVillageData } from '@/lib/google';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || 'ఎదుర్లంక (Edurlanka)';
    const data = await getVillageData(name);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching village data:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
