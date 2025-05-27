  // app/page.tsx
  import { redirect } from "next/navigation";
  import { getServerSession } from "next-auth";
  import { authOptions } from "../api/auth/[...nextauth]/route";
  import { Button } from "@/components/ui/button";
  import { signIn } from "next-auth/react";
  
  export default async function Home() {
    // 1. 服务器端获取 Session（只有服务器组件才能用 await）
    const session = await getServerSession(authOptions);
  
    // 2. 若已登录 → 直接重定向到 /dashboard
    if (session) redirect("/dashboard");
  
    // 3. 未登录 → 显示 Google 登录按钮
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Button size="lg" onClick={() => signIn("google")}>Google でログイン</Button>
      </main>
    );
  }