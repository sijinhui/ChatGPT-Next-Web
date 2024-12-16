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
  }
  // interface Session {
  //   user?: User;
  // }
}

declare module "@auth/core/types" {
  /**
   * 扩展 Session 接口，添加自定义的用户属性
   */
  interface Session extends DefaultSession{
    user: {
      id: string;
      username?: string | null;
      hasPassword?: boolean | null;
      isAdmin?: boolean | null;
    } & DefaultSession["user"];
  }

  /**
   * 扩展 User 接口，添加自定义属性
   * 注意：保持属性可选，以与 AdapterUser 兼容
   */
  // interface User extends NextAuthUser {
  //   id: string;
  //   username?: string;
  //   gh_username?: string;
  //   password?: string;
  //   isAdmin?: boolean;
  //   allowToLogin?: boolean;
  // }

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
