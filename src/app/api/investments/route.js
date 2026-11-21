import { NextResponse } from 'next/server';
import { getInvestmentsData, addInvestmentEntry } from '@/lib/google';

export async function GET() {
  try {
    const data = await getInvestmentsData();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching investments data:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { date, partnerName, amount } = body;

    if (!partnerName || !amount) {
      return NextResponse.json({ success: false, error: 'partnerName and amount are required.' }, { status: 400 });
    }

    const result = await addInvestmentEntry({
      date: date || new Date().toLocaleDateString('en-GB'),
      partnerName,
      amount: Number(amount),
    });

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error('Error adding investment entry:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
