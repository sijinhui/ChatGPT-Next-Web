import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function handle(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const slug = (await params).slug;
  // 判断网址和请求方法
  const method = req.method;
  // const url = req.url;
  const { pathname, searchParams } = new URL(req.url);
  // console.log('----', pathname, searchParams, slug)
  if (method === "GET" && !slug) {
    const all_setting = await prisma.setting.findMany();
    // console.log("all_setting,", all_setting);
    return NextResponse.json({ result: all_setting });
  }
  if (method === "POST" && !slug) {
    try {
      const setting_instance = await prisma.setting.create({
        data: await req.json(),
      });
      // console.log('-------', setting_instance)
      return NextResponse.json({ result: setting_instance });
    } catch (e) {
      console.log("[insert setting] error,", e);
    }
  }

  if (method === "PUT" && slug) {
    try {
      const setting_key = slug[0];
      const setting_instance = await prisma.setting.update({
        where: {
          key: setting_key,
        },
        data: await req.json(),
      });
      return NextResponse.json({ result: setting_instance });
    } catch {}
  }

  if (method === "DELETE" && slug) {
    try {
      const setting_key = slug[0];
      const setting_instance = await prisma.setting.delete({
        where: {
          key: setting_key,
        },
      });
      return NextResponse.json({ result: setting_instance });
    } catch {}
  }

  return NextResponse.json({ error: "当前方法不支持" }, { status: 405 });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
