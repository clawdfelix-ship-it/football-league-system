import { NextResponse } from 'next/server';
import { createMatchKitOverridesTable } from '@/lib/migrations';

export async function POST() {
  try {
    await createMatchKitOverridesTable();
    return NextResponse.json({ success: true, message: 'match_kit_overrides table created successfully' });
  } catch (error) {
    console.error('Failed to create table:', error);
    return NextResponse.json(
      { error: 'Failed to create table', details: String(error) },
      { status: 500 }
    );
  }
}
