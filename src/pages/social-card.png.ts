import { renderOgImage } from "./og-image/_ogMarkup";

export async function GET() {
	const image = await renderOgImage("郁二杰的博客", "AI / 深度学习 · 数学推导与代码实践");
	return new Response(new Uint8Array(image), { headers: { "Content-Type": "image/png" } });
}
