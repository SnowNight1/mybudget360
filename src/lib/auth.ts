// src/lib/auth.ts
import {
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      currency: string;
      monthlyBudget?: number | null; // 期望 null
    };
  }
  interface User{ // 扩展原始 User
    id: string;
    currency: string;
    monthlyBudget?: number | null; // Prisma 是 number | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    currency?: string;
    monthlyBudget?: number | null; // 与 Prisma 和 Session 保持一致 (number | null)
                                   // 如果仍然报错，可以尝试 number | null | undefined
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, trigger, session: updateSessionData }) { // `session` 参数在 trigger='update' 时有值
      if (user) { // 首次登录或注册
        token.id = user.id;
        // `user` 对象来自 PrismaAdapter，应包含数据库字段
        // (user as any) 用于访问我们扩展的字段，因为此时 `user` 的类型可能还是 NextAuth 基础 User
        token.currency = (user as any).currency || "JPY"; // 提供默认值
        token.monthlyBudget = (user as any).monthlyBudget === undefined ? null : (user as any).monthlyBudget; // 确保是 null 而不是 undefined
      }

      // 当通过 useSession().update() 更新 session 时
      if (trigger === "update" && updateSessionData) {
        if (updateSessionData.monthlyBudget !== undefined) {
          token.monthlyBudget = updateSessionData.monthlyBudget; // updateSessionData.monthlyBudget 可以是 number 或 null
        }
        if (updateSessionData.currency !== undefined) { // 如果也允许更新 currency
          token.currency = updateSessionData.currency;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.currency = token.currency as string;
        // 如果 token.monthlyBudget 是 undefined (jwt 中没有设置)，这里会是 undefined
        // 如果 token.monthlyBudget 是 null，这里会是 null
        session.user.monthlyBudget = token.monthlyBudget;
      }
      return session;
    },
  },
};