import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma, User } from "@prisma/client";
import { hashPassword } from "@/lib/utils";
import UserInclude = Prisma.UserInclude;

async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  // 判断网址和请求方法
  const method = req.method;
  // const url = req.url;
  const { pathname, searchParams } = new URL(req.url);
  const searchText = searchParams.get("search");

  // console.log(req, '2', params.path)

  if (method === "GET") {
    // 是否有查询
    try {
      const skip = Number(searchParams.get("skip"));
      const take = Number(searchParams.get("take"));
      // console.log("-----", skip, take);
      const userIncludeLoginRecord: UserInclude = {
        userLoginRecord: {
          orderBy: {
            timestamp: "desc",
          },
          take: 1,
        },
      };

      const result = searchText
        ? await prisma.user.findMany({
            orderBy: {
              createdAt: "desc",
            },
            include: userIncludeLoginRecord,
            where: {
              OR: [
                {
                  name: {
                    contains: searchText,
                  },
                },
                {
                  username: {
                    contains: searchText,
                  },
                },
                {
                  email: {
                    contains: searchText,
                  },
                },
              ],
            },
          })
        : await prisma.user.findMany({
            orderBy: {
              createdAt: "desc",
            },
            include: userIncludeLoginRecord,
          });
      const count = result.length;
      return NextResponse.json({
        count: count,
        results: result.map((item) => {
          return {
            id: item.id,
            name: item.name,
            username: item.username,
            gh_username: item.gh_username,
            image: item.image,
            email: item.email,
            emailVerified: item.emailVerified,
            everyLimitToken: item.everyLimitToken,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            lastLoginAt: item.userLoginRecord[0]?.timestamp || null,
            allowToLogin: item.allowToLogin,
            isAdmin: item.isAdmin,
          };
        }),
      });
    } catch {}
    return NextResponse.json({ error: "未知错误" }, { status: 500 });
  }

  if (method === "DELETE") {
    if (!params.path) {
      return NextResponse.json({ error: "未输入用户ID" }, { status: 400 });
    }
    try {
      const userId = params.path[0];
      const user = await prisma.user.delete({
        where: {
          id: userId,
        },
      });
      // console.log('user', user)
    } catch (e) {
      console.log("[delete user]", e);
      return NextResponse.json({ error: "无法删除用户" }, { status: 400 });
    }
    return NextResponse.json({ result: "删除用户成功" });
  }

  if (method === "PUT") {
    try {
      const userId = params.path[0];
      let new_user_info: Partial<User> = Object.entries(
        await req.json(),
      ).reduce((acc, [key, value]) => {
        if (value !== null) {
          // @ts-ignore
          acc[key] = value;
        }
        return acc;
      }, {});
      return await changeUserInfo(userId, new_user_info);
    } catch {
      return NextResponse.json({ error: "未知错误" }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "当前方法不支持" }, { status: 405 });
}

async function changeUserInfo(id: string, info: Partial<User>) {
  if (info.password) {
    info["password"] = hashPassword(info.password);
  }
  // console.log("-----------", id, info, hashDPassword);
  if (info) {
    await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        ...info,
      },
    });
    return NextResponse.json({ result: "ok" });
  }
  return NextResponse.json({ error: "未知错误" }, { status: 500 });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
