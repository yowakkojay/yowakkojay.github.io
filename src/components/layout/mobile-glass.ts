const mobileLayout = "(width < 48rem), (hover: none) and (pointer: coarse) and (height < 30rem)";
const svgNamespace = "http://www.w3.org/2000/svg";
const samplePadding = 32;
const liveContent = "audio, canvas, embed, iframe, object, video, astro-island";
const pageControls = "script, style, link, template, dialog, #reading-progress, #to-top-btn";

type RefractionLayer = {
	clip: HTMLElement;
	sample: HTMLElement;
	map?: { width: number; height: number; filter: SVGFilterElement };
};

let filterVersion = 0;

function makeDisplacementMap(width: number, height: number, bevel: number) {
	const canvas = document.createElement("canvas");
	canvas.width = Math.ceil(width + 2 * samplePadding);
	canvas.height = Math.ceil(height + 2 * samplePadding);
	const context = canvas.getContext("2d");
	if (!context) return null;

	const image = context.createImageData(canvas.width, canvas.height);
	const halfWidth = width / 2;
	const halfHeight = height / 2;
	const radius = Math.min(halfWidth, halfHeight);
	for (let y = 0; y < canvas.height; y++) {
		const dy = y + 0.5 - canvas.height / 2;
		for (let x = 0; x < canvas.width; x++) {
			const dx = x + 0.5 - canvas.width / 2;
			const qx = Math.abs(dx) - halfWidth + radius;
			const qy = Math.abs(dy) - halfHeight + radius;
			const outsideX = Math.max(qx, 0);
			const outsideY = Math.max(qy, 0);
			const corner = Math.hypot(outsideX, outsideY);
			const inset = radius - corner - Math.min(Math.max(qx, qy), 0);
			// Pull toward the middle at the curved edge, leaving the middle optically flat.
			const edge = Math.max(0, Math.min(1, 1 - inset / bevel));
			const bend = edge * edge * (3 - 2 * edge);
			const normalX = corner ? outsideX / corner : Number(qx > qy);
			const normalY = corner ? outsideY / corner : Number(qy >= qx);
			const pixel = (y * canvas.width + x) * 4;
			image.data[pixel] = 128 - 127 * Math.sign(dx) * normalX * bend;
			image.data[pixel + 1] = 128 - 127 * Math.sign(dy) * normalY * bend;
			image.data[pixel + 3] = 255;
		}
	}
	context.putImageData(image, 0, 0);
	return canvas.toDataURL();
}

function updateFilter(
	layer: RefractionLayer,
	rect: DOMRect,
	defs: SVGDefsElement,
	lifted: boolean,
) {
	const { width, height } = rect;
	// The image scales with the lens. Reuse it through small changes during the lift animation.
	const previous = layer.map;
	if (previous && Math.abs(previous.width - width) < 6 && Math.abs(previous.height - height) < 6) {
		return true;
	}
	const map = makeDisplacementMap(width, height, lifted ? 22 : 17);
	if (!map) return false;

	const filter = document.createElementNS(svgNamespace, "filter");
	// WebKit can keep the old map when an existing filter's image is replaced.
	filter.id = `mobile-glass-${++filterVersion}`;
	filter.setAttribute("x", "0");
	filter.setAttribute("y", "0");
	filter.setAttribute("width", "100%");
	filter.setAttribute("height", "100%");
	filter.setAttribute("color-interpolation-filters", "sRGB");
	const image = document.createElementNS(svgNamespace, "feImage");
	image.setAttribute("href", map);
	image.setAttribute("width", "100%");
	image.setAttribute("height", "100%");
	image.setAttribute("preserveAspectRatio", "none");
	image.setAttribute("result", "map");
	const displacement = document.createElementNS(svgNamespace, "feDisplacementMap");
	displacement.setAttribute("in", "SourceGraphic");
	displacement.setAttribute("in2", "map");
	displacement.setAttribute("scale", lifted ? "38" : "20");
	displacement.setAttribute("xChannelSelector", "R");
	displacement.setAttribute("yChannelSelector", "G");
	filter.append(image, displacement);
	defs.append(filter);
	layer.sample.style.setProperty("--mobile-glass-lens", `url(#${filter.id})`);
	previous?.filter.remove();
	layer.map = { width, height, filter };
	return true;
}

function copySection(source: HTMLElement, media: HTMLElement[]) {
	const copy = source.cloneNode(true) as HTMLElement;
	copy.querySelectorAll(liveContent).forEach((element, index) => {
		// Preserve layout without mounting a second player, iframe, canvas, or Astro island.
		const original = media[index];
		if (!original) return;
		const placeholder = document.createElement("div");
		const { width, height } = original.getBoundingClientRect();
		const { display, margin } = getComputedStyle(original);
		Object.assign(placeholder.style, {
			display: display === "inline" ? "inline-block" : display,
			width: `${width}px`,
			height: `${height}px`,
			margin,
		});
		element.replaceWith(placeholder);
	});
	for (const element of copy.querySelectorAll(pageControls)) element.remove();
	for (const element of copy.querySelectorAll("[id]")) element.removeAttribute("id");
	for (const element of copy.querySelectorAll("a[href]")) element.removeAttribute("href");

	const section = document.createElement("div");
	section.className = copy.className;
	Object.assign(section.style, { position: "absolute", top: "0", left: "0", margin: "0" });
	section.append(...copy.childNodes);
	return section;
}

function alignSample(layer: RefractionLayer, lens: DOMRect, sources: DOMRect[]) {
	for (const [index, copy] of Array.from(layer.sample.children).entries()) {
		const source = sources[index];
		if (!(copy instanceof HTMLElement) || !source) continue;
		const width = `${source.width}px`;
		const transform = `translate(${source.left - lens.left + samplePadding}px, ${source.top - lens.top + samplePadding}px)`;
		if (copy.style.width !== width) copy.style.width = width;
		if (copy.style.transform !== transform) copy.style.transform = transform;
	}
}

export function mountMobileGlass(
	nav: HTMLElement,
	controls: HTMLElement,
	indicator: HTMLElement,
	solidGlass: MediaQueryList,
	signal: AbortSignal,
) {
	const dockClip = nav.querySelector<HTMLElement>(".glass-dock-refraction");
	const chipClip = controls.querySelector<HTMLElement>(".glass-chip-refraction");
	const dockSample = dockClip?.querySelector<HTMLElement>(".glass-refraction-sample");
	const chipSample = chipClip?.querySelector<HTMLElement>(".glass-refraction-sample");
	const defs = document.querySelector<SVGDefsElement>("#mobile-glass-filters");
	if (!dockClip || !chipClip || !dockSample || !chipSample || !defs) return;
	if (!CSS.supports("filter", "url(#mobile-glass)")) return;

	const dock: RefractionLayer = { clip: dockClip, sample: dockSample };
	const chip: RefractionLayer = { clip: chipClip, sample: chipSample };
	for (const { clip } of [dock, chip]) {
		clip.style.setProperty("--mobile-glass-padding", `${samplePadding}px`);
	}

	const mobile = matchMedia(mobileLayout);
	let frame = 0;
	let dirty = true;
	let sources: HTMLElement[] = [];
	let copiedRects: DOMRect[] = [];
	let media: HTMLElement[] = [];
	const enabled = () => mobile.matches && !solidGlass.matches && !signal.aborted;
	const schedule = () => {
		if (!frame && enabled()) frame = requestAnimationFrame(render);
	};
	const invalidate = () => {
		dirty = true;
		schedule();
	};
	const changes = new MutationObserver(invalidate);
	const sizes = new ResizeObserver(schedule);
	const dragState = new MutationObserver(schedule);

	const paintLayer = (
		layer: RefractionLayer,
		rect: DOMRect,
		sourceRects: DOMRect[],
		mediaRects: DOMRect[],
	) => {
		const overMedia = mediaRects.some(
			(mediaRect) =>
				mediaRect.width > 0 &&
				mediaRect.height > 0 &&
				mediaRect.bottom > rect.top &&
				mediaRect.top < rect.bottom &&
				mediaRect.right > rect.left &&
				mediaRect.left < rect.right,
		);
		if (
			!rect.width ||
			!rect.height ||
			overMedia ||
			!updateFilter(layer, rect, defs, layer === chip)
		) {
			layer.clip.hidden = true;
			return;
		}
		alignSample(layer, rect, sourceRects);
		layer.clip.hidden = false;
	};

	function render() {
		frame = 0;
		if (!enabled()) return;
		if (sources.length === 0) {
			const main = document.getElementById("main");
			if (!main) return;
			sources = [main];
			const footer = document.body.querySelector<HTMLElement>(":scope > footer");
			if (footer) sources.push(footer);
			for (const source of sources) {
				changes.observe(source, {
					subtree: true,
					childList: true,
					characterData: true,
					attributeFilter: ["open", "hidden", "src", "srcset", "sizes"],
				});
				sizes.observe(source);
			}
		}

		const rect = nav.getBoundingClientRect();
		const dragging = controls.hasAttribute("data-dragging");
		const chipRect = dragging ? indicator.getBoundingClientRect() : null;
		const chipOrigin = chipRect ? controls.getBoundingClientRect() : null;
		const sourceRects = sources.map((source) => source.getBoundingClientRect());
		const layoutChanged = sourceRects.some(({ width, height }, index) => {
			const copied = copiedRects[index];
			return width !== copied?.width || height !== copied?.height;
		});
		if (dirty || layoutChanged) {
			media = [];
			const copies = sources.map((source) => {
				const sectionMedia = Array.from(source.querySelectorAll<HTMLElement>(liveContent));
				media.push(...sectionMedia);
				return copySection(source, sectionMedia);
			});
			dock.sample.replaceChildren(...copies);
			chip.sample.replaceChildren();
			copiedRects = sourceRects;
			dirty = false;
		}
		const mediaRects = media.map((element) => element.getBoundingClientRect());
		paintLayer(dock, rect, sourceRects, mediaRects);
		if (!chipRect || !chipOrigin) {
			chip.clip.hidden = true;
			return;
		}
		if (!chip.sample.firstElementChild) {
			chip.sample.replaceChildren(
				...Array.from(dock.sample.children, (copy) => copy.cloneNode(true)),
			);
		}
		Object.assign(chip.clip.style, {
			left: `${chipRect.left - chipOrigin.left}px`,
			top: `${chipRect.top - chipOrigin.top}px`,
			width: `${chipRect.width}px`,
			height: `${chipRect.height}px`,
		});
		paintLayer(chip, chipRect, sourceRects, mediaRects);
		// Read the rendered capsule while CSS is expanding it, even with a stationary finger.
		schedule();
	}

	function syncAvailability() {
		if (enabled()) {
			sizes.observe(nav);
			dragState.observe(controls, { attributeFilter: ["data-dragging"] });
			schedule();
			return;
		}
		cancelAnimationFrame(frame);
		frame = 0;
		changes.disconnect();
		sizes.disconnect();
		dragState.disconnect();
		for (const layer of [dock, chip]) {
			layer.clip.hidden = true;
			layer.sample.replaceChildren();
			layer.map?.filter.remove();
			delete layer.map;
		}
		sources = [];
		copiedRects = [];
		media = [];
		dirty = true;
	}

	mobile.addEventListener("change", syncAvailability, { signal });
	solidGlass.addEventListener("change", syncAvailability, { signal });
	window.addEventListener("scroll", schedule, { passive: true, signal });
	window.addEventListener("resize", schedule, { signal });
	window.addEventListener("pageshow", schedule, { signal });
	window.visualViewport?.addEventListener("resize", schedule, { passive: true, signal });
	window.visualViewport?.addEventListener("scroll", schedule, { passive: true, signal });
	document.addEventListener("astro:page-load", schedule, { signal });
	signal.addEventListener("abort", syncAvailability, { once: true });
	syncAvailability();
}
