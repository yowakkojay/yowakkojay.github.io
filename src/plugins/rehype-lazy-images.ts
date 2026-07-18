import type { Root } from "hast";
import { visit } from "unist-util-visit";

/**
 * 给 markdown 渲染出的 <img> 统一加上懒加载属性，
 * 避免长文（如 GRPO 训练记录，20+ 张图）打开时一次性下载全部图片。
 */
export function rehypeLazyImages() {
	return (tree: Root) => {
		visit(tree, "element", (node) => {
			if (node.tagName === "img" && node.properties) {
				node.properties.loading ??= "lazy";
				node.properties.decoding ??= "async";
			}
		});
	};
}
