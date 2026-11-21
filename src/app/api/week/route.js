import { NextResponse } from 'next/server';
import { addNewWeekColumn } from '@/lib/google';

export async function POST(request) {
  try {
    const body = await request.json();
    const { sheetTitle, weekLabel } = body;

    if (!sheetTitle || !weekLabel) {
      return NextResponse.json(
        { success: false, error: 'sheetTitle and weekLabel are required.' },
        { status: 400 }
      );
    }

    const result = await addNewWeekColumn({ sheetTitle, weekLabel });
    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error('Error adding new week column:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
