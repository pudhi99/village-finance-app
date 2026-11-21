import { NextResponse } from 'next/server';
import { getPnLAndDashboardData } from '@/lib/google';

export async function GET() {
  try {
    const data = await getPnLAndDashboardData();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
