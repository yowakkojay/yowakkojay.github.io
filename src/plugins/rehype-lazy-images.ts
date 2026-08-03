import { existsSync } from "node:fs";
import path from "node:path";
import type { Root } from "hast";
import sharp from "sharp";
import { visit } from "unist-util-visit";

/**
 * 给 markdown 渲染出的 <img> 统一加上懒加载属性，
 * 避免长文（如 GRPO 训练记录，20+ 张图）打开时一次性下载全部图片。
 * 同时给 public 下的本地图片注入真实宽高，避免图片加载后布局抖动（CLS）。
 */

// 构建期按文件缓存尺寸，避免同一图片在多篇文章/多处重复读取
const dimsCache = new Map<string, { width: number; height: number } | null>();

async function getLocalImageDims(src: string): Promise<{ width: number; height: number } | null> {
	if (dimsCache.has(src)) return dimsCache.get(src)!;
	let dims: { width: number; height: number } | null = null;
	try {
		// markdown 里的 src 是 percent-encoded（如 %2B、%20），需解码后映射到 public/
		const file = path.join(process.cwd(), "public", decodeURIComponent(src));
		if (existsSync(file)) {
			const meta = await sharp(file).metadata();
			if (meta.width && meta.height) dims = { width: meta.width, height: meta.height };
		}
	} catch {
		// 读取失败不阻断构建，仅不注入宽高
	}
	dimsCache.set(src, dims);
	return dims;
}

export function rehypeLazyImages() {
	return async (tree: Root) => {
		const tasks: Promise<void>[] = [];
		visit(tree, "element", (node) => {
			if (node.tagName !== "img" || !node.properties) return;
			node.properties.loading ??= "lazy";
			node.properties.decoding ??= "async";
			const src = typeof node.properties.src === "string" ? node.properties.src : "";
			// 仅处理未显式指定宽高的站内本地图片（/images/... 等 public 资源）
			if (src.startsWith("/") && node.properties.width == null && node.properties.height == null) {
				tasks.push(
					getLocalImageDims(src.split("?")[0]!).then((dims) => {
						if (dims) {
							node.properties.width = dims.width;
							node.properties.height = dims.height;
						}
					}),
				);
			}
		});
		await Promise.all(tasks);
	};
}
