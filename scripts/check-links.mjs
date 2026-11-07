import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parse } from "parse5";

function htmlFiles(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const file = path.join(directory, entry.name);
		return entry.isDirectory() ? htmlFiles(file) : file.endsWith(".html") ? [file] : [];
	});
}

function inspectHtml(file) {
	const ids = new Set();
	const links = [];
	const mathErrors = [];
	let canonical;
	function visit(node) {
		const attrs = Object.fromEntries((node.attrs ?? []).map(({ name, value }) => [name, value]));
		if (attrs.id) ids.add(attrs.id);
		if (attrs.class?.split(/\s+/).includes("katex-error")) {
			mathErrors.push(attrs.title ?? "KaTeX 公式渲染失败");
		}
		if (attrs.rel === "canonical") canonical = attrs.href;
		for (const key of ["href", "src", "poster"]) {
			if (attrs[key]) links.push(attrs[key]);
		}
		if (attrs.property === "og:image" && attrs.content) links.push(attrs.content);
		if (attrs.srcset && !attrs.srcset.startsWith("data:")) {
			for (const candidate of attrs.srcset.split(",")) {
				const url = candidate.trim().split(/\s+/)[0];
				if (url) links.push(url);
			}
		}
		for (const child of node.childNodes ?? []) visit(child);
	}
	visit(parse(readFileSync(file, "utf8")));
	return { ids, links, canonical, mathErrors };
}

export function checkLinks(directory = "dist") {
	const root = path.resolve(directory);
	const pages = new Map(htmlFiles(root).map((file) => [file, inspectHtml(file)]));
	const errors = [];
	for (const [file, page] of pages) {
		const relative = path.relative(root, file).split(path.sep).join("/");
		for (const message of page.mathErrors) errors.push(`${relative}: ${message}`);
		const pageUrl = new URL(page.canonical ?? relative, "https://local.invalid/");
		for (const link of page.links) {
			try {
				const url = new URL(link, pageUrl);
				if (url.origin !== pageUrl.origin || !["http:", "https:"].includes(url.protocol)) continue;
				let target = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
				if (!target.startsWith(`${root}${path.sep}`) && target !== root)
					throw new Error("路径越界");
				if (existsSync(target) && statSync(target).isDirectory())
					target = path.join(target, "index.html");
				if (!existsSync(target)) throw new Error("页面或资源不存在");
				const hash = decodeURIComponent(url.hash.slice(1).split(":~:text=")[0] ?? "");
				if (hash && pages.has(target) && !pages.get(target).ids.has(hash))
					throw new Error(`锚点不存在：${hash}`);
			} catch (error) {
				errors.push(`${relative}: ${link} — ${error.message}`);
			}
		}
	}
	return { pages: pages.size, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
	const result = checkLinks(process.argv[2]);
	if (result.errors.length) {
		console.error(result.errors.join("\n"));
		process.exitCode = 1;
	} else console.log(`链接检查通过：${result.pages} 个页面，站内链接、资源与锚点均有效。`);
}
