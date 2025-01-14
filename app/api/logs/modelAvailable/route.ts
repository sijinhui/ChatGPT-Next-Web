import { NextRequest, NextResponse } from "next/server";
// import { addHours } from "date-fns";
import prisma from "@/lib/prisma";
// import {useAllModels} from "@/app/utils/hooks";

// 缓存最近的模型可用性数据
const modelAvailabilityCache: Record<string, any> = {};
const cacheExpiryTime = 5 * 60 * 1000; // 缓存有效期为 5 分钟

async function handle(req: NextRequest) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const requestData = await req.json();
  const { models } = requestData;
  const cacheKey = JSON.stringify(models);

  // 检查缓存中是否存在数据且未过期
  if (modelAvailabilityCache[cacheKey]?.expiry > Date.now()) {
    return NextResponse.json({
      results: modelAvailabilityCache[cacheKey].data,
    });
  }

  const results = await fetchRecentRecords(models);

  // 更新缓存
  modelAvailabilityCache[cacheKey] = {
    data: results,
    expiry: Date.now() + cacheExpiryTime,
  };

  return NextResponse.json({ results: results });
}

async function fetchRecentRecords(models: string[]) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const results: Record<string, any> = {};

  const calculateBooleanAverage = (
    list: { responseStatus: boolean | null }[],
  ) => {
    const total = list.length;
    const trueCount = list.filter((item) => item["responseStatus"]).length;
    return parseFloat(
      (trueCount / total).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }),
    );
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

      if (latestRecord.createdAt >= sevenDaysAgo) {
        const recentRecords = await prisma.logEntry.findMany({
          where: {
            createdAt: {
              gte: sevenDaysAgo,
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

// export const GET = handle;
export const POST = handle;
