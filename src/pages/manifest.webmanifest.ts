import { siteConfig } from "@/site.config";

export function GET() {
	return new Response(
		JSON.stringify({
			id: "/",
			name: siteConfig.title,
			short_name: siteConfig.title,
			description: siteConfig.description,
			lang: siteConfig.lang,
			start_url: "/",
			display: "standalone",
			background_color: "#1d1f21",
			theme_color: "#2bbc8a",
			icons: [192, 512].map((size) => ({
				src: `/icons/icon-${size}.png`,
				sizes: `${size}x${size}`,
				type: "image/png",
			})),
		}),
		{ headers: { "Content-Type": "application/manifest+json" } },
	);
}
