import { NextRequest, NextResponse } from "next/server";
// import { addHours } from "date-fns";
import prisma from "@/lib/prisma";
// import {useAllModels} from "@/app/utils/hooks";

async function handle(req: NextRequest) {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const requestData = await req.json();
  const { models } = requestData;
  const results = await fetchRecentRecords(models);

  return NextResponse.json({ results: results });
}

export async function fetchRecentRecords(models: string[]) {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const results: Record<string, any> = {};

  const calculateBooleanAverage = (
    list: { responseStatus: boolean | null }[],
  ) => {
    const total = list.length;
    const trueCount = list.filter((item) => item["responseStatus"]).length;
    return trueCount / total;
  };

  await Promise.all(
    models.map(async (model) => {
      const latestRecord = await prisma.logEntry.findFirst({
        orderBy: {
          createdAt: "desc",
        },
        where: {
          model: model,
        },
        select: {
          model: true,
          createdAt: true,
          responseStatus: true,
        },
      });

      if (!latestRecord) {
        results[model] = {
          availability: 1,
        };
        return;
      }

      if (latestRecord.createdAt >= twentyFourHoursAgo) {
        const recentRecords = await prisma.logEntry.findMany({
          where: {
            createdAt: {
              gte: twentyFourHoursAgo,
            },
            model: model,
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            responseStatus: true,
          },
        });

        results[model] = {
          availability: calculateBooleanAverage(recentRecords),
        };
      } else {
        results[model] = {
          availability: latestRecord.responseStatus ? 1 : 0,
        };
      }
    }),
  );

  return results;
}

export const GET = handle;
export const POST = handle;
