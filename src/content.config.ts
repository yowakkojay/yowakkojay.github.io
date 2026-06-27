import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema.
	// 迁移自 Hexo 的 frontmatter：title / date / categories / tags。
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			// Hexo 用 date（YYYY-MM-DD），这里统一转 Date 对象
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			description: z.string().optional(),
			// 文章分类（Hexo categories），单值或列表
			categories: z.union([z.string(), z.array(z.string())]).optional(),
			// 文章标签（Hexo tags）
			tags: z.array(z.string()).default([]),
			// 是否启用数学公式（用于在三篇含 LaTeX 的文章上按需加载）
			math: z.boolean().default(false),
			// 旧式 URL：如 "2026/02/21/归一化"，由 getStaticPaths 直接用作路由 slug
			slug: z.string(),
			heroImage: z.optional(image()),
		}),
});

export const collections = { blog };
