// types/next-auth.d.ts
// import { DefaultSession, User } from "@auth/core/types";
export type {
  Account,
  DefaultSession,
  Profile,
  Session,
  User as NextAuthUser,
} from "@auth/core/types"

declare module "next-auth" {
  interface User {
    id: string;
    username?: string | null;
    hasPassword?: boolean | null;
    isAdmin?: boolean | null;
    allowToLogin?: boolean;
  }
  interface Session {
    user?: {
      id: string;
      username?: string | null;
      hasPassword?: boolean | null;
      isAdmin?: boolean | null;

    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  /**
   * 扩展 JWT 接口，添加自定义的用户属性
   */
  interface JWT {
    user: {
      id: string;
      username?: string | null;
      gh_username?: string | null;
      password?: string | null;
      isAdmin?: boolean | null;
    };
  }
}
