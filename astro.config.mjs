// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax';

// https://astro.build/config
export default defineConfig({
	// 自定义域名，用于生成 canonical URL / sitemap / RSS
	site: 'https://yowakkojay.com',
	// 输出目录式 URL（如 /2026/02/21/归一化/），匹配旧 Hexo 站点结构，保留 SEO 与外链
	build: {
		format: 'directory',
	},
	trailingSlash: 'always',
	integrations: [mdx(), sitemap()],
	markdown: {
		// 数学公式：remark-math 解析 $...$ / $$...$$，rehype-mathjax 渲染为 MathJax。
		// 与原 Hexo 站（markdown-it-mathjax3）同源，公式原文无需任何改写。
		remarkPlugins: [remarkMath],
		rehypePlugins: [
			[
				rehypeMathjax,
				{
					tex: {
						inlineMath: [
							['$', '$'],
							['\\(', '\\)'],
						],
						displayMath: [
							['$$', '$$'],
							['\\[', '\\]'],
						],
					},
				},
			],
		],
	},
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
