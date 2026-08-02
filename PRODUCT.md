# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro 6.3（静态输出）+ Tailwind CSS 4 + TypeScript，基于 Astro Cactus 主题。Node 22。GitHub Pages 静态部署，自定义域名 yowakkojay.com。

## Users

主用户是作者本人 Yowakko Jay（郁二杰）——把博客当作 AI / 深度学习学习的沉淀与复习载体。次要受众是中文 AI / 深度学习领域的同行、学习者与从业者；作者希望内容被这个群体看到，逐步建立技术影响力。

## Product Purpose

一个中文 AI / 深度学习技术写作的个人博客。承载带数学公式（KaTeX）与代码（PyTorch、强化学习等）的深度技术内容。既是个人知识沉淀，也面向社区展示技术能力。

## Positioning

中文 AI / 深度学习技术博客，内容以可推导的数学 + 可运行的代码为深度锚点（区别于泛泛的概念博文）。作者郁二杰的个人技术品牌入口。

## Operating Context

- 内容以 Markdown / MDX 写在 `src/content/post` 与 `src/content/note`，文件名即 URL slug；Astro Content Collections 校验 frontmatter。
- 数学公式用 KaTeX，代码用 Expressive Code（dracula / github-light 双主题），自带阅读时长、admonition、GitHub card 等 remark 插件。
- 部署：改完直接提交并 push 到远程默认分支即上线（见 AGENTS.md 约定），不走 PR / 评审。作者在 live 网页查看效果。
- 主开发机为 Windows，当前 Linux 环境（`~/jay_workspace/yowakkojay.github.io`）为从 GitHub 克隆的工作副本。
- 配套图床仓库 `blogImages`。

## Capabilities and Constraints

- 文章 / notes / tags 内容集合，Pagefind 静态搜索，RSS，sitemap，robots.txt，web app manifest。
- Satori 自动生成 OG 图；支持 Webmentions。
- 暗 / 亮双模式切换。
- 约束：站点语言 zh-CN；HTML lang 与 ogLocale 为 zh-CN / zh_CN；自定义域名 yowakkojay.com。
- 开放未决：本次 Impeccable 的改造方向（整体重做视觉 / 增量改进 / 先出设计系统）尚未确定；视觉与内容结构的可改动范围完全开放（作者表示“都可以谈”）。

## Brand Commitments

- 站点标题 "Yowakko Jay"，描述 "郁二杰的博客 · AI / 深度学习"，作者名 Yowakko Jay / 郁二杰。
- 当前视觉沿用 Astro Cactus 主题（绿色主题色、等宽正文字体、dracula / github-light 代码主题）；作者已确认现有主题色与风格不是硬约束，可在后续工作中重新讨论。

## Evidence on Hand

- 5 篇已发布文章（2025-07 至 2026-04）：PyTorch on Windows、概率统计、GRPO+Qwen+GSM8K、归一化、AI workflow。
- 无客户证言 / 数据看板 / 第三方评测（个人博客性质，属正常缺失，后续工作不得虚构此类内容）。

## Product Principles

1. 内容优先：技术深度（可推导的数学 + 可运行的代码）是核心价值，一切设计服务于阅读与理解。
2. 双重身份并重：既是个人沉淀，也是面向社区的影响力建设——阅读体验与可发现性同等重要。
3. 低仪式感、快反馈：静态站、直接 push 上线，改动尽快在真实网页可见。
4. 中文 AI / 深度学习领域的个人品牌锚点：让访客一眼知道“这是谁、写什么”。

## Accessibility & Inclusion

沿用 Astro Cactus 主题的 a11y 基线（语义化 HTML、响应式、暗 / 亮模式）；站点面向中文读者。无额外确认的产品级 a11y 要求。
