import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
    return NextResponse.json(
        {
            error: 'This upload flow is deprecated. Use POST /api/photos/upload instead.',
        },
        { status: 410 },
    );
}
