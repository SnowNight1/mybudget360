# MyBudget360

## English

### Introduction

MyBudget360 is a personal budget management web application built with Next.js, Prisma, and NextAuth. It helps users track their income and expenses, set budgets, and gain insights through interactive charts and dashboards.

### Features

* **Secure Authentication**: Login and session management with NextAuth.js
* **Record Management**: Create, view, update, and delete income and expense records
* **Budget & Category Settings**: Define monthly budgets and categorize transactions
* **Dashboard & Charts**: Visualize financial data with charts and summary cards
* **Responsive UI**: Built with React components and styled for desktop and mobile

### Tech Stack

* **Framework**: Next.js 13 (App Router)
* **Language**: TypeScript
* **Styling**: CSS Modules / Tailwind CSS
* **Database**: SQLite (via Prisma ORM)
* **Authentication**: NextAuth.js
* **UI Library**: Radix UI & lucide-react

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/mybudget360.git
   cd mybudget360/apps/web
   ```
2. Install dependencies:

   ```bash
   pnpm install
   ```
3. Configure environment variables:

   * Copy `.env.example` to `.env`
   * Set `DATABASE_URL`, `NEXTAUTH_SECRET`, and OAuth credentials
4. Run database migrations:

   ```bash
   pnpm prisma migrate dev
   ```
5. Start the development server:

   ```bash
   pnpm dev
   ```

### Usage

1. Visit `http://localhost:3000/login` to sign in or register.
2. Configure your budgets under `/budget`.
3. Add income or expense records at `/add`.
4. View summary and charts on `/dashboard`.

### Contributing

Welcome contributions! Please open issues and submit pull requests. Read `CONTRIBUTING.md` for details.

### License

This project is licensed under the MIT License.

---

## 中文

### 项目简介

MyBudget360 是一个个人预算管理 Web 应用，基于 Next.js、Prisma 和 NextAuth 实现。帮助用户记录收入和支出、设置预算，并通过交互式图表和仪表盘获取财务洞察。

### 功能

* **安全认证**：使用 NextAuth.js 实现登录与会话管理
* **记录管理**：创建、查看、更新和删除收支记录
* **预算与分类**：定义每月预算并对交易进行分类
* **仪表盘与图表**：以图表和摘要卡的形式可视化财务数据
* **响应式 UI**：基于 React 组件，支持桌面和移动端

### 技术栈

* **框架**：Next.js 13（App Router）
* **语言**：TypeScript
* **样式**：CSS Modules / Tailwind CSS
* **数据库**：SQLite（通过 Prisma ORM）
* **认证**：NextAuth.js
* **UI 库**：Radix UI 和 lucide-react

### 安装

1. 克隆仓库：

   ```bash
   git clone https://github.com/yourusername/mybudget360.git
   cd mybudget360/apps/web
   ```
2. 安装依赖：

   ```bash
   pnpm install
   ```
3. 配置环境变量：

   * 复制 `.env.example` 为 `.env`
   * 设置 `DATABASE_URL`、`NEXTAUTH_SECRET` 及 OAuth 凭据
4. 运行数据库迁移：

   ```bash
   pnpm prisma migrate dev
   ```
5. 启动开发服务器：

   ```bash
   pnpm dev
   ```

### 使用

1. 访问 `http://localhost:3000/login` 登录或注册。
2. 在 `/budget` 页面设置预算。
3. 在 `/add` 页面添加收支记录。
4. 在 `/dashboard` 页面查看摘要和图表。

### 贡献

欢迎贡献！请提交 issue 或 pull request，详情请阅读 `CONTRIBUTING.md`。

### 许可证

本项目采用 MIT 许可证。
