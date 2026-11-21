import { NextResponse } from 'next/server';
import { recordCollection } from '@/lib/google';

export async function POST(request) {
  try {
    const body = await request.json();
    const { sheetTitle, rowIndex, colIndex, amount, paymentMode } = body;

    if (!sheetTitle || !rowIndex || colIndex === undefined) {
      return NextResponse.json(
        { success: false, error: 'sheetTitle, rowIndex, and colIndex are required.' },
        { status: 400 }
      );
    }

    const result = await recordCollection({
      sheetTitle,
      rowIndex: Number(rowIndex),
      colIndex: Number(colIndex),
      amount: amount !== undefined ? amount : '',
      paymentMode: paymentMode || 'Cash',
    });

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error('Error recording collection:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
