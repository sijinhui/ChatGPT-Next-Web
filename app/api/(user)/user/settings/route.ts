import { NextRequest } from "next/server";

async function handle(
  req: NextRequest,
  { params }: { params: { path: string } },
) {}

export const GET = handle;
export const POST = handle;
