interface CategoryInfo {
	name: string;
	description: string;
	readingOrder: string[];
}

// URL 使用稳定 slug，展示名称和推荐阅读顺序独立维护。
const categories: Record<string, CategoryInfo> = {
	math: {
		name: "数学基础",
		description:
			"从概率、统计与微积分出发，把模型背后的数学概念重新推导一遍。适合作为深度学习实践的基础读物。",
		readingOrder: ["2025-08-16-probability-statistics"],
	},
	"deep-learning": {
		name: "深度学习",
		description:
			"从归一化等基础组件，到大模型后训练和具身智能论文解读。结合公式、代码与实验现象理解模型。",
		readingOrder: [
			"2026-02-21-normalization",
			"2026-01-25-grpo-qwen-gsm8k",
			"2026-08-03-rynnbrain-nav",
		],
	},
	engineering: {
		name: "工程实践",
		description:
			"记录环境搭建、工具使用与自动化工作流。关注如何把想法跑起来，以及实际使用中遇到的问题。",
		readingOrder: ["2025-07-13-pytorch-windows", "2026-04-24-ai-workflow"],
	},
};

export function getCategoryInfo(slug: string): CategoryInfo {
	return (
		categories[slug] ?? {
			name: slug,
			description: `「${slug}」相关的文章与实践记录。`,
			readingOrder: [],
		}
	);
}
