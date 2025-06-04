import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// 你可以保留 Next.js 提供的基础配置
const nextJsConfigs = [
  ...compat.extends("next/core-web-vitals"),
  // "next/typescript" 实际上是 @typescript-eslint/eslint-plugin 和 @typescript-eslint/parser
  // 的预配置集合，通常与 Next.js 结合使用。
  // 如果 "next/typescript" 已经包含了你需要的 TypeScript 规则，你可以基于它修改。
  // 或者，如果你想更明确地控制，可以不使用 "next/typescript" 而是直接配置
  // typescript-eslint，但这会更复杂。
  // 假设 "next/typescript" 设置了你想要修改的规则。
  // 但更常见的是， "next/typescript" 主要是配置 parser 和一些基础规则。
  // 具体的规则覆盖最好在单独的对象中进行。

  // 为了确保你的规则覆盖生效，最好将它们放在一个独立的对象中，
  // 并且这个对象在数组中位于被扩展的配置之后。
];

const customRulesConfig = {
  // 如果你的规则是针对特定文件类型的，可以添加 'files' 键，例如：
  // files: ["**/*.ts", "**/*.tsx"],
  // 但如果这些规则应该全局应用于所有被 lint 的 JS/TS 文件，则可以省略 'files'。

  rules: {
    // 将你之前遇到的错误降级为警告
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "warn",
    "@typescript-eslint/no-unused-expressions": "warn",
    // 你可以根据需要添加或修改其他规则
    // "no-console": "warn", // 示例：将 console.log 降级为警告
  },
};

// 合并所有配置
const eslintConfig = [
  ...nextJsConfigs, // 先应用 Next.js 的基础配置
  ...compat.extends("next/typescript"), // 应用 Next.js 的 TypeScript 特定配置
  customRulesConfig, // 然后应用你的自定义规则覆盖
];

export default eslintConfig;