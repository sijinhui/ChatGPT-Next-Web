import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { EChartsOption } from "echarts";
import { differenceInDays } from "date-fns";

async function handle(req: NextRequest) {
  // count
  const count = await prisma.logEntry.count();

  // start_date
  const start_date_data = await prisma.logEntry.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });
  const currentDate = new Date();
  const dayDifference = differenceInDays(
    currentDate,
    start_date_data.createdAt,
  );

  return NextResponse.json({
    result: "OK",
    count: count,
    "date-range": dayDifference,
  });
}

export const GET = handle;
