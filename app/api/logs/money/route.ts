import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCurStartEnd } from "@/app/utils/custom";

async function handle(
  req: NextRequest,
  { params }: { params: { path: string } },
) {
  const session = await getSession();
  const user_id = session?.user.id;

  // 总费用
  const all_money = await prisma.logEntry.aggregate({
    where: { userID: user_id },
    _sum: { logMoney: true },
  });
  // 当天费用
  const { startOfTheDayInTimeZone, endOfTheDayInTimeZone } = getCurStartEnd();
  const today_money = await prisma.logEntry.aggregate({
    where: {
      userID: user_id,
      createdAt: {
        gte: startOfTheDayInTimeZone.toISOString(),
        lte: endOfTheDayInTimeZone.toISOString(),
      },
    },
    _sum: { logMoney: true },
  });

  return NextResponse.json({
    status: 200,
    result: {
      total: all_money._sum.logMoney?.toFixed(2),
      today: today_money._sum.logMoney?.toFixed(2),
    },
  });
}

export const GET = handle;

// export const runtime = "edge";
