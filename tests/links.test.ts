import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { checkLinks } from "../scripts/check-links.mjs";

test("检查中文锚点、编码资源路径和跨页链接，跳过站外链接", () => {
	const root = mkdtempSync(path.join(os.tmpdir(), "blog-links-"));
	try {
		mkdirSync(path.join(root, "post"));
		writeFileSync(path.join(root, "图 1.svg"), "<svg/>");
		writeFileSync(
			path.join(root, "index.html"),
			'<a href="/post/#%E4%B8%AD%E6%96%87">正文</a><img src="/%E5%9B%BE%201.svg"><a href="https://example.com/missing">外链</a>',
		);
		writeFileSync(
			path.join(root, "post/index.html"),
			'<h2 id="中文">中文</h2><a href="../">首页</a>',
		);
		assert.deepEqual(checkLinks(root), { pages: 2, errors: [] });
		writeFileSync(
			path.join(root, "index.html"),
			'<a href="/post/#missing">坏锚点</a><img src="/missing.png">',
		);
		assert.equal(checkLinks(root).errors.length, 2);
		writeFileSync(
			path.join(root, "index.html"),
			'<span class="katex-error" title="ParseError">broken math</span>',
		);
		assert.match(checkLinks(root).errors[0] ?? "", /ParseError/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
