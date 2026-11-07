import { z } from "astro/zod";

// 支持 YYYY-MM-DD，或带时区的 ISO 时间；拒绝无效日期和依赖机器时区的字符串。
export const contentDateSchema = z
	.union([z.iso.date(), z.iso.datetime({ offset: true }), z.date()])
	.transform((value) => new Date(value))
	.pipe(z.date());
