# Yowakko Jay 的博客

[yowakkojay.com](https://yowakkojay.com) · 郁二杰的 AI / 深度学习笔记。

Astro 7 + Tailwind CSS 4 + TypeScript，静态部署至 GitHub Pages。基于 [Astro Cactus](https://github.com/chrismwilliams/astro-theme-cactus)，保留原项目许可证与致谢。

## 本地开发

使用 `.nvmrc` 指定的 Node 22.23.4（或满足 `package.json` engines 的更新版本）：

```sh
nvm use
npm ci
npm run dev
```

开发地址见终端输出。开发模式会显示草稿和未来日期的内容；搜索需要生产索引，请通过以下方式验证：

```sh
npm run build
npm run preview
```

## 写一篇文章

```sh
npm run new:post -- my-experiment "我的实验记录"
npm run new:note -- paper-reading "论文速记"
```

命令从 `templates/` 创建带日期前缀的 Markdown，默认 `draft: true`，不会覆盖同名文件。文章在 `src/content/post/`，短笔记在 `src/content/note/`。日期文件名前缀按北京时间生成。

1. 补全标题、摘要、分类与标签。
2. 按模板记录问题、结论、推导、实验环境、代码与参考资料。
3. 用 `npm run dev` 检查公式、代码、图片和目录。
4. 发布前将 `draft` 改为 `false`，确认 `publishDate`。
5. 已发布内容更新时保留 `publishDate`，设置 `updatedDate` 并补充更新记录。

文件名决定 URL。已发布文章应保留原文件名，以免破坏外链及按路径关联的 Giscus 评论。

### Frontmatter 参考

```yaml
---
title: "文章标题"
description: "文章摘要"
publishDate: "2026-11-07T08:00:00+08:00"
updatedDate: "2026-11-08T09:00:00+08:00"
draft: false
category: deep-learning
tags: [pytorch, normalization]
pinned: false
---
```

| 字段          | 文章 | 短笔记 | 说明                                   |
| ------------- | ---- | ------ | -------------------------------------- |
| `title`       | 必填 | 必填   | 最多 60 字符                           |
| `description` | 必填 | 可选   | 列表、搜索引擎与分享摘要               |
| `publishDate` | 必填 | 必填   | `YYYY-MM-DD` 或带时区的 ISO 时间       |
| `draft`       | 可选 | 可选   | 默认 false；创建命令显式设为 true      |
| `updatedDate` | 可选 | —      | 不可早于发布日期                       |
| `category`    | 可选 | —      | 稳定的分类 slug                        |
| `tags`        | 可选 | —      | 自动去重并转小写                       |
| `pinned`      | 可选 | —      | 首页和文章列表最多展示 3 篇置顶        |
| `ogImage`     | 可选 | —      | 自定义分享图 URL；默认自动生成         |
| `coverImage`  | 可选 | —      | `{ src: 本地图片路径, alt: 图片说明 }` |

时间统一以北京时间展示。仅日期的值按 UTC 零点解释；需要预约到具体时间时，使用 `+08:00` 的完整时间。

### 图片、公式与代码

- 正文图片放在 `public/images/<文章文件名>/`，Markdown 使用 `/images/...` 路径，推荐 WebP 并提供有意义的 alt。
- 本地 Markdown 图片在构建时补齐尺寸，默认懒加载；正文灯箱支持点击、键盘 Enter/空格、滚轮缩放、拖动及双指缩放，Escape 关闭。
- 行内公式 `$...$`，块级公式 `$$...$$`；代码块声明语言，例如 `python`。
- 链接到章节时使用页面实际生成的标题 ID。生产构建会检查站内资源和锚点。

## 专题与短笔记

专题入口为 `/categories/`，由 `src/data/categories.ts` 维护中文名称、简介和 `readingOrder`：

| URL slug        | 展示名称 |
| --------------- | -------- |
| `math`          | 数学基础 |
| `deep-learning` | 深度学习 |
| `engineering`   | 工程实践 |

推荐阅读顺序填写文章文件名（不带 `.md`）。只有已公开且属于该分类的文章会出现在生产专题页。新分类未配置介绍时也能生成列表页。

短笔记适合论文速记、单次实验观察和踩坑记录，不必凑成长文。入口 `/notes/`，独立订阅 `/notes/rss.xml`。自定义标签介绍可写在 `src/content/tag/<标签>.md`。

## 检查与上线

```sh
npm run check
npm test
npm run build
```

- `check`：Astro 类型检查与 Biome。
- `test`：日期有效性、草稿/预约发布边界、链接检查器回归测试。
- `build`：静态页面、分享图、图标与搜索索引生成，再检查全站内部链接、资源和锚点。
- `check:links`：单独检查已有 `dist/`，不请求外部网站。

构建检查也会拦截 KaTeX 渲染错误。Biome 不格式化 Markdown/MDX，避免自动重写数学公式；正文排版由作者维护。

提交并推送 `main` 后，GitHub Actions 会依次运行安装、校验、测试、构建与 Pages 部署。

### 预约发布

生产构建只包含 `draft: false` 且 `publishDate` 已到的文章和短笔记；首页、专题、RSS、分享图和搜索索引使用相同发布规则。

工作流每小时第 17 分钟（UTC）触发重建，也支持 Actions 页面手动运行。GitHub 定时任务可能延迟，所以这是“下一次成功构建发布”，不是精确到分钟的定时服务。公开仓库长期无活动时，GitHub 也可能停用定时工作流。

## 维护参考

- 站点信息与导航：`src/site.config.ts`。
- 设计约定：`DESIGN.md`；正文使用系统字体，OG 中文字体只在构建期使用，不发送给网页访客。
- 分享图样式：`src/pages/og-image/_ogMarkup.ts`；修改字体或样式后更新 `_cacheUtil.ts` 的 `CACHE_VERSION`。
- Noto Sans SC 字体来自 `notofonts/noto-cjk`，授权见 `src/assets/OFL-NotoSansSC.txt`。
- 评论：`src/components/Giscus.astro`，接近评论区时加载，也可手动加载；主题跟随站点。
- 站点图标：由 `public/killua.webp` 构建为 PNG；manifest 与 robots.txt 使用本地端点生成。
- 依赖维护：定期运行 `npm outdated` 和 `npm audit`，升级后完整校验。`sharp`、`katex` overrides 统一渲染版本，另两个定向 overrides 为上游尚未放宽范围的补丁修复，升级对应上游时重新检查。

Webmentions 为可选功能；启用时配置构建环境中的 `WEBMENTION_API_KEY`、`WEBMENTION_URL` 和 `WEBMENTION_PINGBACK`。没有配置时使用 Giscus 即可。
