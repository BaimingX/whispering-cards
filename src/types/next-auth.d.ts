import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * 扩展Session类型以包含用户ID
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  /**
   * 扩展User类型
   */
  interface User {
    id: string;
  }
} 