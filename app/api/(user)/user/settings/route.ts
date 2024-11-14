import { type NextRequest } from "next/server";

async function handle(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  // const slug = (await params).slug;
}

export const GET = handle;
export const POST = handle;
