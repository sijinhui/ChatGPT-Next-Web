import { NextRequest, NextResponse } from "next/server";

async function handle(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  return NextResponse.json({});
}

export const GET = handle;
