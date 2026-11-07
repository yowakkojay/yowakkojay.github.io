import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { contentDateSchema } from "./utils/content-schema";

function removeDupsAndLowerCase(array: string[]) {
	return [...new Set(array.map((str) => str.trim().toLowerCase()).filter(Boolean))];
}

const titleSchema = z.string().max(60);

const baseSchema = z.object({
	title: titleSchema,
});

const post = defineCollection({
	loader: glob({ base: "./src/content/post", pattern: "**/*.{md,mdx}" }),
	schema: ({ image }) =>
		baseSchema
			.extend({
				description: z.string(),
				coverImage: z
					.object({
						alt: z.string(),
						src: image(),
					})
					.optional(),
				draft: z.boolean().default(false),
				ogImage: z.string().optional(),
				tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
				// 领域分类（tags 之上的一级粗粒度维度，如 深度学习 / 数学基础 / 工程实践）
				category: z.string().optional(),
				publishDate: contentDateSchema,
				updatedDate: contentDateSchema.optional(),
				pinned: z.boolean().default(false),
			})
			.refine((data) => !data.updatedDate || data.updatedDate >= data.publishDate, {
				message: "updatedDate 不能早于 publishDate",
				path: ["updatedDate"],
			}),
});

const note = defineCollection({
	loader: glob({ base: "./src/content/note", pattern: "**/*.{md,mdx}" }),
	schema: baseSchema.extend({
		description: z.string().optional(),
		publishDate: contentDateSchema,
		draft: z.boolean().default(false),
	}),
});

const tag = defineCollection({
	loader: glob({ base: "./src/content/tag", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		title: titleSchema.optional(),
		description: z.string().optional(),
	}),
});

export const collections = { post, note, tag };
