# AGENTS.md

## 项目说明

个人博客（GitHub Pages，`yowakkojay.github.io`），Astro 7 + Tailwind CSS 4。Node 版本见 `.nvmrc`。

## 部署约定

- **改动完成后直接上线**：提交并推送到远程默认分支即可，无需事先请示、无需走 PR/评审流程。用户会直接在 live 网页上查看效果。
- 提交信息遵循仓库现有的 commit message 风格。

## 常用命令

- 开发：`npm run dev`
- 校验：`npm run check`（astro check + biome check）
- 构建：`npm run build`（astro build + pagefind 索引）
- 测试：`npm test`（日期、发布规则和链接检查器）
- 构建后自动执行站内链接与锚点检查；单独执行：`npm run check:links`
- 创建草稿：`npm run new:post -- slug "标题"` / `npm run new:note -- slug "标题"`
