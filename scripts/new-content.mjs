import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const [kind, slug, ...titleParts] = process.argv.slice(2);
const title = titleParts.join(" ").trim();
if (
	!["post", "note"].includes(kind) ||
	!slug ||
	!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug) ||
	!title ||
	title.length > 60
) {
	console.error(
		'用法：npm run new:post -- english-slug "文章标题"（最多 60 字）；短笔记使用 new:note。',
	);
	process.exit(1);
}

const now = new Date();
const date = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Shanghai" }).format(now);
const template = readFileSync(new URL(`../templates/${kind}.md`, import.meta.url), "utf8");
const content = template
	.replace("{{TITLE}}", JSON.stringify(title))
	.replace("{{PUBLISH_DATE}}", JSON.stringify(now.toISOString()));
const directory = path.join("src", "content", kind);
const file = path.join(directory, `${date}-${slug}.md`);
mkdirSync(directory, { recursive: true });
try {
	writeFileSync(file, content, { flag: "wx" });
	console.log(`已创建草稿：${file}\n运行 npm run dev 预览，准备发布时将 draft 改为 false。`);
} catch (error) {
	if (error.code === "EEXIST") {
		console.error(`文件已存在，未覆盖：${file}`);
		process.exitCode = 1;
	} else throw error;
}
