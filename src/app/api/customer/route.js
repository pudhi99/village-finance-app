import { NextResponse } from 'next/server';
import { addCustomer, updateCustomer } from '@/lib/google';

export async function POST(request) {
  try {
    const body = await request.json();
    const { sheetTitle, customerData } = body;

    if (!sheetTitle || !customerData) {
      return NextResponse.json(
        { success: false, error: 'sheetTitle and customerData are required.' },
        { status: 400 }
      );
    }

    const result = await addCustomer({ sheetTitle, customerData });
    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error('Error adding customer:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { sheetTitle, rowIndex, updates } = body;

    if (!sheetTitle || !rowIndex || !updates) {
      return NextResponse.json(
        { success: false, error: 'sheetTitle, rowIndex, and updates are required.' },
        { status: 400 }
      );
    }

    const result = await updateCustomer({
      sheetTitle,
      rowIndex: Number(rowIndex),
      updates,
    });

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error('Error updating customer:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
