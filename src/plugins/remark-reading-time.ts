import { toString as mdastToString } from "mdast-util-to-string";
import getReadingTime from "reading-time";

export function remarkReadingTime() {
	// @ts-expect-error:next-line
	return (tree, { data }) => {
		const textOnPage = mdastToString(tree);
		const readingTime = getReadingTime(textOnPage);
		data.astro.frontmatter.readingTime = readingTime.text;
		// 分钟数（向上取整、至少 1），供模板按站点语言自行格式化（readingTime.text 固定为英文）
		data.astro.frontmatter.readingTimeMinutes = Math.max(1, Math.ceil(readingTime.minutes));
	};
}
