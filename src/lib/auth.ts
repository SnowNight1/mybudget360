// src/lib/auth.ts
import { type NextAuthOptions, type DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

//console.log("[auth.ts] Initializing authOptions...");
//console.log("[auth.ts] GOOGLE_ID available:", !!process.env.GOOGLE_ID);
//console.log("[auth.ts] GOOGLE_SECRET available:", !!process.env.GOOGLE_SECRET);
//console.log("[auth.ts] NEXTAUTH_SECRET available:", !!process.env.NEXTAUTH_SECRET);

// 扩展 Session User 类型以包含 id
declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string; // 假设你的 User id 是 string 类型 (cuid)
      // 如果有其他你想在 session.user 中访问的自定义字段，也在这里添加
      // currency?: string;
      // monthlyBudget?: number;
    };
  }
}

// 如果使用 JWT 策略，也需要扩展 JWT 类型
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    // currency?: string;
    // monthlyBudget?: number;
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
  session: { strategy: "jwt" }, // 使用 JWT 策略
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, account, profile }) {
      //console.log("[auth.ts] JWT Callback invoked.");
      // 首次登录时 (user 对象存在)，将用户 ID 添加到 JWT token
      if (user) {
        token.id = user.id;
        //console.log(`[auth.ts] JWT Callback: User found (ID: ${user.id}), token updated:`, token);
        // 如果你想添加 Prisma User 模型中的其他字段到 token
        // const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        // if (dbUser) {
        //   token.currency = dbUser.currency;
        //   token.monthlyBudget = dbUser.monthlyBudget;
        // }
      } else {
        //console.log("[auth.ts] JWT Callback: User not found, using existing token:", token);
      }
      return token;
    },
    async session({ session, token }) {
      //console.log("[auth.ts] Session Callback invoked.");
      //console.log("[auth.ts] Session Callback: Received token:", token);
      // 从 JWT token 中获取用户 ID 并添加到 session.user 对象
      if (token && session.user) {
        //console.log("[auth.ts] Session Callback: Session user updated:", session.user);
        session.user.id = token.id as string; // 类型断言，因为我们知道我们设置了它
        // session.user.currency = token.currency as string;
        // session.user.monthlyBudget = token.monthlyBudget as number;
      } else {
        console.warn("[auth.ts] Session Callback: No token or session.user found, session not updated.");
      }
      return session;
    },
  },
};