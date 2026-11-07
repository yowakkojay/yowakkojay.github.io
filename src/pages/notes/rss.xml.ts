import rss from "@astrojs/rss";
import { getAllNotes } from "@/data/note";
import { siteConfig } from "@/site.config";
import { collectionDateSort } from "@/utils/date";

export const GET = async () => {
	const notes = (await getAllNotes()).sort(collectionDateSort);

	return rss({
		title: `${siteConfig.title} · 短笔记`,
		description: "论文速记、实验观察与工程踩坑记录",
		site: import.meta.env.SITE,
		items: notes.map((note) => ({
			title: note.data.title,
			description: note.data.description,
			pubDate: note.data.publishDate,
			link: `notes/${note.id}/`,
		})),
	});
};
