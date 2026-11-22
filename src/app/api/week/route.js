import { NextResponse } from 'next/server';
import { addNewWeekColumn } from '@/lib/google';

export async function POST(request) {
  try {
    const body = await request.json();
    const { sheetTitle, weekLabel } = body;

    if (!weekLabel) {
      return NextResponse.json(
        { success: false, error: 'weekLabel is required.' },
        { status: 400 }
      );
    }

    if (!sheetTitle || sheetTitle === 'all') {
      const [r1, r2] = await Promise.all([
        addNewWeekColumn({ sheetTitle: 'ఎదుర్లంక (Edurlanka)', weekLabel }),
        addNewWeekColumn({ sheetTitle: 'కొత్తపల్లి (Kothapalli)', weekLabel }),
      ]);
      return NextResponse.json({ success: true, result: { edurlanka: r1, kothapalli: r2 } });
    }

    const result = await addNewWeekColumn({ sheetTitle, weekLabel });
    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error('Error adding new week column:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
