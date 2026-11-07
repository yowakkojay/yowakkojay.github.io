const buildTime = Date.now();

export function isPublished(data: { draft: boolean; publishDate: Date }, now = buildTime) {
	return !data.draft && data.publishDate.getTime() <= now;
}
