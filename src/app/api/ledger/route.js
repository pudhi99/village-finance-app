import { NextResponse } from 'next/server';
import { getLedgerData, addLedgerTransaction } from '@/lib/google';

export async function GET() {
  try {
    const data = await getLedgerData();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching ledger data:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { date, particulars, credit, debit } = body;

    if (!particulars) {
      return NextResponse.json({ success: false, error: 'Particulars are required.' }, { status: 400 });
    }

    const result = await addLedgerTransaction({
      date: date || new Date().toLocaleDateString('en-GB'),
      particulars,
      credit: credit || 0,
      debit: debit || 0,
    });

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error('Error adding ledger transaction:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
