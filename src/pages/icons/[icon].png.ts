import type { APIContext } from "astro";
import sharp from "sharp";

export function getStaticPaths() {
	return [
		{ params: { icon: "apple-touch-icon" }, props: { size: 180 } },
		{ params: { icon: "icon-192" }, props: { size: 192 } },
		{ params: { icon: "icon-512" }, props: { size: 512 } },
	];
}

export async function GET({ props }: APIContext) {
	const image = await sharp("public/killua.webp")
		.resize(props.size, props.size, { fit: "cover" })
		.png()
		.toBuffer();
	return new Response(new Uint8Array(image), { headers: { "Content-Type": "image/png" } });
}
