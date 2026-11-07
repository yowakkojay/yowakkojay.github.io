import { rehypeHeadingIds, unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";
import expressiveCode from "astro-expressive-code";
import icon from "astro-icon";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypeKatex from "rehype-katex";
import rehypeUnwrapImages from "rehype-unwrap-images";
import remarkDirective from "remark-directive"; /* Handle ::: directives as nodes */
import remarkMath from "remark-math";
import { rehypeLazyImages } from "./src/plugins/rehype-lazy-images";
import { remarkAdmonitions } from "./src/plugins/remark-admonitions";
import { remarkGithubCard } from "./src/plugins/remark-github-card";
import { remarkReadingTime } from "./src/plugins/remark-reading-time";
import { expressiveCodeOptions, siteConfig } from "./src/site.config";

// https://astro.build/config
export default defineConfig({
	site: siteConfig.url,
	compressHTML: true,
	image: {
		domains: ["webmention.io"],
	},
	integrations: [expressiveCode(expressiveCodeOptions), icon(), sitemap(), mdx()],
	markdown: {
		processor: unified({
			rehypePlugins: [
				// 数学公式：remark-math 解析 $...$ / $$...$$，rehype-katex 渲染为 KaTeX。
				// 必须放在其他 rehype 之前，避免它们误处理 math 节点。
				[rehypeKatex, { strict: false, throwOnError: false }],
				rehypeHeadingIds,
				[rehypeAutolinkHeadings, { behavior: "wrap", properties: { className: ["not-prose"] } }],
				[
					rehypeExternalLinks,
					{
						rel: ["noreferrer", "noopener"],
						target: "_blank",
					},
				],
				rehypeUnwrapImages,
				rehypeLazyImages,
			],
			remarkPlugins: [
				remarkMath,
				remarkReadingTime,
				remarkDirective,
				remarkGithubCard,
				remarkAdmonitions,
			],
			remarkRehype: {
				footnoteLabelProperties: {
					className: [""],
				},
			},
		}),
	},
	vite: {
		plugins: [tailwind()],
	},
	env: {
		schema: {
			WEBMENTION_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
			WEBMENTION_URL: envField.string({ context: "client", access: "public", optional: true }),
			WEBMENTION_PINGBACK: envField.string({ context: "client", access: "public", optional: true }),
		},
	},
});
