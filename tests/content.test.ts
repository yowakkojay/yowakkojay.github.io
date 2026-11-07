import assert from "node:assert/strict";
import { test } from "node:test";
import { contentDateSchema } from "../src/utils/content-schema.ts";
import { isPublished } from "../src/utils/publication.ts";

test("拒绝无效日期和没有时区的时间，支持 YAML Date 与闰日", () => {
	for (const value of [
		"not-a-date",
		"2026-02-30",
		"2025-02-29",
		"2026-11-07T08:00:00",
		new Date("invalid"),
	]) {
		assert.equal(contentDateSchema.safeParse(value).success, false);
	}
	assert.equal(contentDateSchema.parse("2024-02-29").toISOString(), "2024-02-29T00:00:00.000Z");
	assert.equal(
		contentDateSchema.parse("2026-11-07T08:00:00+08:00").toISOString(),
		"2026-11-07T00:00:00.000Z",
	);
	assert.equal(
		contentDateSchema.parse(new Date("2026-11-07")).toISOString(),
		"2026-11-07T00:00:00.000Z",
	);
});

test("草稿和未来文章不可发布，到达发布时间后才可发布", () => {
	const now = Date.parse("2026-11-07T00:00:00Z");
	assert.equal(isPublished({ draft: true, publishDate: new Date(now - 1) }, now), false);
	assert.equal(isPublished({ draft: false, publishDate: new Date(now + 1) }, now), false);
	assert.equal(isPublished({ draft: false, publishDate: new Date(now) }, now), true);
});
