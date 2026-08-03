---
name: Yowakko Jay
description: 郁二杰的博客 · AI / 深度学习
colors:
  paper: "oklch(98.48% 0 0)"
  ink: "oklch(26.99% 0.0096 235.05)"
  ink-muted: "oklch(44.6% 0.03 256.802)"
  cinnabar: "oklch(55.27% 0.195 19.06)"
  peacock: "oklch(52.5% 0.115 200)"
  sumi: "oklch(18.15% 0 0)"
  night: "oklch(23.64% 0.0045 248)"
  chalk: "oklch(83.54% 0 264)"
  chalk-muted: "oklch(70.7% 0.022 261.325)"
  phosphor: "oklch(70.91% 0.1415 163.7)"
  sakura: "oklch(70.44% 0.1133 349)"
  moonlight: "oklch(94.66% 0 0)"
  celadon: "oklch(94.8% 0.106 136.49)"
typography:
  display:
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC", sans-serif'
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.333
    letterSpacing: "normal"
  headline:
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC", sans-serif'
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  title:
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC", sans-serif'
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.556
    letterSpacing: "normal"
  body:
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC", sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "normal"
  label:
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", "PingFang SC", "Microsoft YaHei", monospace'
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.75
    letterSpacing: "normal"
rounded:
  xs: "2px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "48px"
  xl: "64px"
components:
  nav-link:
    textColor: "{colors.cinnabar}"
    padding: "12px 8px"
  nav-link-dark:
    textColor: "{colors.phosphor}"
    padding: "12px 8px"
  link-inline:
    textColor: "{colors.ink}"
  link-inline-dark:
    textColor: "{colors.chalk}"
  chip-updated:
    backgroundColor: "oklch(55.27% 0.195 19.06 / 5%)"
    textColor: "{colors.cinnabar}"
    rounded: "{rounded.lg}"
    padding: "4px 8px"
  chip-updated-dark:
    backgroundColor: "oklch(94.8% 0.106 136.49 / 5%)"
    textColor: "{colors.celadon}"
    rounded: "{rounded.lg}"
    padding: "4px 8px"
  card-note:
    backgroundColor: "oklch(26.99% 0.0096 235.05 / 5%)"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  card-note-dark:
    backgroundColor: "oklch(83.54% 0 264 / 5%)"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  button-icon:
    textColor: "{colors.ink}"
    size: "36px"
    padding: "8px"
  button-icon-hover:
    textColor: "{colors.cinnabar}"
---

# Design System: Yowakko Jay

## Overview

**Creative North Star: "实验笔记本 The Lab Notebook"**

一本摊开在桌上的实验笔记本：克制、精确、有体温。每条记录都有等宽字体的日期戳，每个结论都可以推导，每段代码都可以运行。设计不抢内容的风头——密度舒适的排版、大量留白、列表而非卡片——但每一处保留下来的装饰都有理由：首页 Hero 画布上，单位圆被连续变化的线性变换拉成椭圆，这是整本笔记本的扉页版画，声明"这里的数学是活的"。

这个系统有昼夜双重身份。亮色主题是白天实验台上的纸面：近白的纸、蓝灰的墨迹、朱砂红橙的记号笔。暗色主题是深夜的终端：深青灰的屏、粉笔灰的字、磷光薄荷绿的光标。两套主题共享同一副骨架，accent 与链接色随主题翻转色相——切换主题就像从纸笔切换到磷光屏，全页颜色 350ms 原地渐变是这次切换的仪式：内容原地保留，墨色在同一次呼吸里完成转换。

装饰极少，但不冷淡。语气是研究者写给同行的笔记：诚实、可追溯、偶尔玩味（macOS 三色窗口圆点、`#` 标题锚点、鼠标划过网格的排斥泡）。已确认的反面：不用 emoji 充当图标。

**Key Characteristics:**
- 昼夜双生的色彩系统：accent 与链接色随主题翻转（朱砂 ↔ 磷光，孔雀青 ↔ 樱粉）
- 内容永远是平坦的纸面；阴影只给悬浮其上的铬件（floating chrome）
- 等宽字体只承载元数据（日期、阅读时长、代码、搜索），正文是中文友好的系统无衬线
- 唯一的"大手笔"装饰是 Hero 线性变换画布——全站其余部分保持安静
- 所有主题色都是 oklch + `@property` 注册，可以在主题切换时做属性级过渡

## Colors

昼夜双生的双色系统——白天纸面上的朱砂，黑夜终端里的磷光。所有主题色以 `oklch()` 定义并通过 `@property` 注册为可过渡属性；frontmatter 中亮色组与暗色组并列，均为 normative。

### Primary

- **朱砂 Cinnabar Vermilion**（`cinnabar`）：亮色主题的 accent。导航链接、当前页下划线、章节标题、"最新文章"栏头、标题 hover 的 `#` 锚点、阅读进度条、头像描边、Hero 椭圆、表单 `accent-color`。它同时是亮色主题的引用色（blockquote 文字、"Updated" 徽章）。
- **磷光 Phosphor Mint**（`phosphor`）：暗色主题的 accent，职责与朱砂一一对应。OG 图的底部描边（#2bbc89）是它的近亲。

### Secondary

- **孔雀 Peacock Cyan**（`peacock`）：亮色主题的链接色。注意：链接常态显示为正文墨色，链接色只在 hover 时出现在下划线上（2px 加粗），以及脚注上标、Pagefind 搜索结果的 hover 态。
- **樱粉 Sakura Pink**（`sakura`）：暗色主题的链接色，职责同上。

### Tertiary

- **青瓷 Celadon**（`celadon`）：暗色主题的引用色。blockquote 斜体文字、"Updated" 徽章的文字与 5% 底色。亮色主题下该职责由朱砂兼任。

### Neutral

- **纸 Paper**（`paper`）：亮色页面底色。
- **墨 Ink**（`ink`）：亮色正文与主要文字。
- **灰墨 Muted Ink**（`ink-muted`）：亮色次要文字——日期、页脚、辅助说明、`#` 锚点常态。
- **松烟 Sumi**（`sumi`）：亮色标题色（`.title`、prose 标题），比正文更黑一等。
- **夜 Night**（`night`）：暗色页面底色，带一丝青相。
- **粉笔 Chalk**（`chalk`）：暗色正文与主要文字。
- **灰粉笔 Muted Chalk**（`chalk-muted`）：暗色次要文字。
- **月光 Moonlight**（`moonlight`）：暗色标题色，比正文更白一等。

### Named Rules

**昼夜法则 The Day-and-Night Rule.** 每一个主题色决策都必须以亮/暗一对的形式交付，写入 `@theme` 与 `html[data-theme="dark"]` 两处。accent 与链接色跨主题翻转色相族，绝不允许只改一个主题或硬编码某一主题的值。

**荧光笔法则 The Highlighter Rule.** accent 是记号笔，不是油漆桶：它出现在导航、当前页标记、2px 进度条、锚点、描边和 hover 态上，任何一屏的占比都很小。它从不填充大面积表面——没有 accent 底色的按钮或卡片。

**揭示法则 The Hover-Reveal Rule.** 链接常态穿正文墨色、带 2px 偏移的细下划线；链接色（孔雀/樱粉）只在 hover 时以加粗下划线（2px）揭示。链接色不是链接的常态颜色。

## Typography

**Display / Body Font:** 系统无衬线栈（ui-sans-serif → PingFang SC / Hiragino Sans GB / Microsoft YaHei / Noto Sans CJK SC，零 webfont）
**Label / Mono Font:** 系统等宽栈（ui-monospace → SFMono / Menlo / Consolas，含 PingFang SC / Microsoft YaHei 中文回退）

**Character:** 不加载任何网络字体是有意为之——中文渲染交给各平台原生字体，零 FOUT、零延迟、原生质感。无衬线承担全部阅读与标题；等宽承担元数据与代码，是笔记本的"仪器字体"。

### Hierarchy

- **Display**（semibold 600, 1.5rem/24px, line-height 1.333）：页面级标题（`.title`）。首页 H1、文章标题。颜色用标题色（松烟/月光），不用 accent。
- **Headline**（semibold 600, 1.25rem/20px, line-height 1.4）：章节标题（"最新文章"、prose 内 H2）。栏头可用 accent 着色（如"最新文章"）。
- **Title**（semibold 600, 1.125rem/18px, line-height 1.556）：prose H3、目录摘要"目录"。
- **Body**（regular 400, 1rem/16px, line-height 1.75）：正文与 UI。1.75 的行高是给中文的呼吸空间。阅读宽度约 65ch。
- **Label**（semibold 600, 1rem/16px, mono）：日期戳、阅读时长、代码、搜索 UI、键盘提示。等宽 + semibold 是元数据的制服。

### Named Rules

**等宽即元数据法则 The Mono-is-Metadata Rule.** 等宽字体只用于日期、阅读时长、代码、搜索框与脚注标号——数据，不是散文。正文、标题、导航永远用无衬线。

**井号法则 The Hash-Mark Rule.** prose 内的标题在左侧沟槽携带一个 `#` 锚点标记：常态用 muted 色、绝对定位在 -1rem 处，hover 时变 accent 色。这是笔记本页边的索引符号，移动端（<sm）不出现。

## Layout

单列居中的阅读版面：内容列最大宽 1024px（max-w-5xl），两侧安全边距 16px（sm 起 32px），顶部留白 64px。页眉把圆形头像悬挂在内容列左缘之外（桌面端 `sm:ps-18` 的负偏移），让"人"独立于"文"。

节奏靠垂直间距而非分隔线：区块之间 48–64px（mb-12 / mt-16），列表条目间 16px（space-y-4）。正文阅读宽度约 65ch，prose 内标题上间距 48px。文章页在 lg（1024px）以上出现右侧粘性目录栏（basis-64，top-12），目录可伸出内容列右缘；移动端目录默认折叠为 `<details>`。页脚 `mt-auto` 贴底，短页面不留空洞。

断点只用两个档位：sm（640px，排版与导航形态切换）与 lg（1024px，文章页双栏）。没有中间态的微管理。

## Elevation & Depth

**纸面平，铬件浮。** 内容表面永远平坦——文章、列表、Note 卡片、GitHub 卡片都没有阴影；深度靠 5% 文字色叠层（global-text/5）的色调分层表达。阴影是结构信号，只标记"这一层浮在纸面之上"的 UI 铬件：右上角搜索/主题控制 pill、移动端下拉菜单。搜索对话框另有 8px 背景模糊，图片灯箱用 80% 黑遮罩。

### Shadow Vocabulary

- **chrome-low**（`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)` + 1px ring `rgb(0 0 0 / 0.10)`，暗色 ring 换 `rgb(255 255 255 / 0.15)`）：悬浮控制 pill（搜索 + 主题切换）。
- **chrome-high**（`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` + 同款 ring）：移动端导航下拉菜单。

### Named Rules

**浮铬法则 The Floating Chrome Rule.** 阴影只允许出现在悬浮于内容之上的铬件（控制 pill、下拉菜单、对话框、灯箱）。内容表面——卡片、列表、文章体——永远平坦。新增 UI 时先问："它浮在纸面上吗？"不是，就没有阴影。

## Shapes

小半径、诚实几何。圆角预算克制：行内代码 2px、代码块 4px、卡片与下拉菜单 6px、徽章 8px——没有超过 8px 的圆角矩形。完全圆（9999px）只给真正的 pill 与圆：头像、36px 图标按钮、回到顶部按钮、头像的 accent 描边。

直线与虚线是笔记本的标尺：表格用 1px 虚线（dashed #666）作行间与表头分隔，hr 也是虚线；行内代码带 1px 点线（dotted）边框。引用块没有左边框——它靠颜色（青瓷/朱砂）与斜体自成一体。标志性的剪影是椭圆：Hero 画布里单位圆被线性变换拉成的椭圆。

### Named Rules

**圆角预算法则 The Radius Budget Rule.** 圆角矩形不超过 8px；9999px 完全圆是 pill 与纯圆控件的特权，不分配给卡片或内容容器。

## Components

### 链接（cactus-link）

内容链接的角色：安静，但 hover 时开口说话。
- **Style:** 正文墨色 + 下划线（underline-offset 2px），常态下划线颜色同文字
- **Hover:** 下划线加粗到 2px 并染成链接色（孔雀/樱粉），文字颜色不变
- **变体:** 标签链接带 `#` 前缀（`before:content-['#']`），脚注上标带 `[ ]` 包围，hover 变链接色

### 导航（Nav）

- **Style:** accent 色、semibold、16px；当前页以下划线标记（2px，offset 4px，桌面端 2px），hover 加下划线
- **桌面:** 水平排列，条目间 1px 分隔线（divide-x），紧跟站点标题
- **移动:** 悬浮下拉卡片（chrome-high 阴影 + ring，6px 圆角，纵向 divide-y），由右上角汉堡按钮开合；按钮图标在横线与 accent 色叉号间缩放切换

### 文章列表行（Post Preview）

- **Style:** 等宽 semibold 的 muted 日期戳（min-w-30）+ 标题 cactus-link；桌面端日期与标题同列网格（`grid-cols-[auto_1fr]`），摘要缩进对齐标题列
- **摘要:** 三行截断的斜体引用（line-clamp-3）

### Note 卡片 / GitHub 卡片

- **Corner Style:** 6px 圆角（rounded-md）
- **Background:** 5% 文字色叠层（global-text/5）——色调分层，无阴影、无边框
- **Internal Padding:** 12px 16px（px-4 py-3）
- GitHub 卡片内含头像圆、标题、描述与星/叉/协议 chips（16px mask 图标 + 文字）；加载态用 50% 文字色 pulse 骨架

### 徽章（Updated Chip）

- **Style:** 引用色文字 + 同色 5% 底色，8px 圆角，padding 4px 8px

### Admonition（边注）

- **Style:** 2px 左边框（类型色）+ 类型色 5% 底色，无圆角，padding 16px 0 16px 16px
- **Title:** 类型色、bold、capitalize，前置 16px mask 图标
- **类型色:** note 蓝（blue-400）、tip 青柠（lime-500）、important 紫（purple-400）、caution 橙（orange-400）、warning 红（red-500）

### 代码块（Expressive Code）

- **Style:** dracula（暗）/ github-light（亮）双主题，4px 圆角，无窗口阴影，14px 等宽，行高 1.714rem
- **Frame:** 终端窗口的三个圆点改为 macOS 风格红/黄/绿三色（#FF5F57 / #FEBC2E / #28C840）
- **行内代码:** 等宽 14px，随代码主题着色；未被主题接管时带 1px 点线边框与 2px 圆角

### 目录（TOC）

- **Style:** `<details>` 折叠，摘要"目录"用 Title 级（18px semibold），marker hover 变 accent；条目缩进 16px
- **桌面:** 粘性右侧栏（top-12），默认展开；**移动:** 默认折叠

### 搜索（Pagefind）

- **Style:** 对话框 + 8px 背景模糊；UI 字体为等宽；触发按钮是 36px 方角图标钮，hover 变 accent
- **结果链接:** 底部 6px 渐变模拟的粗下划线，hover 变链接色；匹配词 `<mark>` 用标题色 + semibold

### 主题切换（Theme Toggle）—— 签名组件

36px 图标按钮，日/月 SVG 在缩放与透明度间互换，hover 变 accent。点击触发全页颜色 350ms 原地渐变（cubic-bezier(0.41, 0.1, 0.13, 1)，慢启动快收尾）：临时挂 `.theme-transition` 类，由 JS 在 rAF 循环里把七个颜色 token 以 oklab 空间逐帧插值写为 `<html>` inline style，内容原地保留、颜色同拍变换（不用 CSS `@property` 变量过渡——该路径在 Chrome 150 Linux 上间歇性卡死在进度 0）；代码块的框体结构元素（背景/边框）由无层级同步规则纳入同一拍过渡，语法高亮 token 随切换瞬翻——不要给 token span 挂过渡，代码多的文章 token 可达 1800+，并发动画会卡出长帧触发渲染器降级（60s 内切换全部瞬变），历史上加过又因此回滚；Hero 画布在渐变期间每帧重读颜色同步变换。历史上曾用 View Transitions 圆形扩散与覆盖层开孔方案，因 Chrome 150 伪元素 clip-path 渲染坐标系回归（Element Plus #24589 / crbug 480074843）及视觉取舍废弃。`prefers-reduced-motion` 下直接切换，无动画。

### Hero 画布（Hero Canvas）—— 签名组件

首页 Hero 的装饰性背景（`aria-hidden`，不拦截指针）：16×9 点阵在随机二维线性变换间平滑形变（4200ms smoothstep 插值），accent 色描边的单位圆随之拉成椭圆——致敬 Georgia Tech《Interactive Linear Algebra》封面。网格线 10% 透明度，交点为 accent 色 1.4px 圆点；鼠标经过产生排斥泡。上下边缘用页面底色渐隐融入纸面。离屏/隐藏标签页自动暂停；`prefers-reduced-motion` 下只绘制静态一帧；DPR 上限 2。

### 阅读进度条 / 回到顶部 / 灯箱

- **进度条:** 视口顶部 2px（h-0.5）accent 色发丝线，随滚动生长
- **回到顶部:** 48px 圆形按钮（桌面 40px→48px），锌灰底，滚动越过页头后从下方滑入（300ms），hover 出现链接色 2px 描边
- **灯箱:** 80% 黑遮罩 + 200ms 透明度/缩放过渡，点击图外、X 或 ESC 关闭

## Do's and Don'ts

### Do:

- **Do** 以亮/暗成对的方式交付每个主题色，写入 `@theme` 与 `[data-theme="dark"]` 两处，并用 `@property` 注册保证可过渡（昼夜法则）。
- **Do** 把 accent 当荧光笔用：导航、锚点、发丝进度条、描边、hover 态（荧光笔法则）。
- **Do** 用等宽 + semibold 承载元数据（日期、阅读时长、代码、搜索 UI），正文与标题留给无衬线（等宽即元数据法则）。
- **Do** 尊重 `prefers-reduced-motion`：主题切换直切、Hero 画布只画静态一帧。
- **Do** 用 5% 文字色叠层表达内容层的深度（Note 卡、GitHub 卡），保持纸面平坦。
- **Do** 新增 UI 时用现有的两级阴影词汇（chrome-low / chrome-high），且只给浮在纸面上的铬件。

### Don't:

- **Don't** 用 emoji 充当图标——图标只用 SVG（MDI 图标集或内联 SVG，mask 着色的 16px 小图标）。
- **Don't** 硬编码单一主题的 accent 或链接色值；它们随主题翻转，引用 token 而非数值。
- **Don't** 引入网络字体；系统无衬线/等宽栈是有意决策（中文原生渲染、零 FOUT）。
- **Don't** 给 blockquote 加左边框；它靠引用色与斜体识别，左边框属于 admonition。
- **Don't** 给内容表面（卡片、列表、文章体）加阴影或超过 8px 的圆角；阴影属于浮铬，圆角预算 ≤8px。
- **Don't** 在正文密度上使用卡片网格；文章列表就是"日期戳 + 链接"的行，列表即纸张。
