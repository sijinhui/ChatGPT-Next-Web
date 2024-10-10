import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { VerifiedUser, VerifiedAdminUser } from "@/lib/auth_client";

export default async function middleware(req: NextRequest) {
    const url = req.nextUrl;
    const searchParams = req.nextUrl.searchParams.toString();
    const path = `${url.pathname}${
        searchParams.length > 0 ? `?${searchParams}` : ""
    }`;
    // 直接将/app/下面路由重定向到顶层
    if (path.startsWith('/app')) {
        return NextResponse.redirect(new URL(path.replace('/app', ''), req.url), 301);
    }

    const session = await getToken({ req });
    const isUser = await VerifiedUser(session);
    const isAdminUser = await VerifiedAdminUser(session);
    // console.log('----session', session, '---isUser', isUser, '---isAdmin', isAdminUser)
    // 管理员页面的api接口还是要认证的
    if (path.startsWith('/api/admin/')) {
        // 需要确认是管理员
        if (!isAdminUser) return NextResponse.json({error: '无管理员授权'}, { status: 401 });
    }
    // 不是用户且页面不是登录页
    if (!isUser && !path.startsWith("/login") ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // 如果登录了且页面是登录页面
    if (isUser && path.startsWith("/login")) {
        return NextResponse.redirect(new URL("/", req.url))
    }

    if (path.startsWith('/login')) {
        return NextResponse.rewrite(
            new URL(`/app${path}`, req.url),
        );
    }
    if (path.startsWith("/admin")) {
        return NextResponse.rewrite(
            new URL(`/app${path}`, req.url),
        );
    }
    // 测试用，回头删了
    if (path.startsWith("/azureVoice")) {
      return NextResponse.rewrite(
        new URL(`/app${path}`, req.url),
      );
    }

    // if (VerifiedNeedSetPassword(path, session)) {
    //   console.log('-0-0-- 需要修改密码', )
    //   // return NextResponse.redirect(new URL("/login/set-password", req.url))
    // }

    return NextResponse.next()
}


export const config = {
    matcher: [
        // "/api/:path*",
        "/((?!api/logs/|api/auth/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
    ],
};

// 发现中间件在边缘网络中才生效，自己部署的docker不行
