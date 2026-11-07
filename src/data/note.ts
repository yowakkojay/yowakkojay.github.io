import { getCollection } from "astro:content";
import { isPublished } from "@/utils/publication";

export async function getAllNotes() {
	return getCollection("note", ({ data }) => !import.meta.env.PROD || isPublished(data));
}
