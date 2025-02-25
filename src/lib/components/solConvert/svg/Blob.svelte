<script>
	import { seedRandom, calculateSegmentBounds } from './solSvgUtils';
	import SvgShapeBase from './SvgShapeBase.svelte';

	function generateBlobPath(width, height, pointCount, strength, seed) {
		const random = seedRandom(seed * 500);
		const radius = Math.min(width, height) / 3;
		const angleStep = (Math.PI * 2) / pointCount;
		const kappa = (4 / 3) * Math.tan(Math.PI / (2 * pointCount));
		const strengthFactor = 1 - strength / 10;

		let points = [];
		for (let i = 0; i <= pointCount; i++) {
			const angle = angleStep * i;
			const randomRadius =
				i === pointCount
					? points[0]?.radius || 0
					: random() * (radius - radius * strengthFactor) + radius * strengthFactor;

			const x = Math.cos(angle) * randomRadius;
			const y = Math.sin(angle) * randomRadius;
			const controlDist = kappa * randomRadius;

			points.push({
				point: { x, y },
				cp1: {
					x: x + Math.sin(angle) * controlDist,
					y: y - Math.cos(angle) * controlDist
				},
				cp2: {
					x: x - Math.sin(angle) * controlDist,
					y: y + Math.cos(angle) * controlDist
				},
				angle,
				radius: randomRadius
			});
		}

		let minX = Infinity,
			maxX = -Infinity,
			minY = Infinity,
			maxY = -Infinity;
		points.forEach((current, i) => {
			if (i === 0) return;
			const prev = points[i - 1];
			const bounds = calculateSegmentBounds(prev.point, prev.cp2, current.cp1, current.point);
			minX = Math.min(minX, bounds.minX);
			maxX = Math.max(maxX, bounds.maxX);
			minY = Math.min(minY, bounds.minY);
			maxY = Math.max(maxY, bounds.maxY);
		});

		const scaleX = width / (maxX - minX);
		const scaleY = height / (maxY - minY);
		const offsetX = -minX * scaleX;
		const offsetY = -minY * scaleY;

		let path = '';
		points.forEach((current, i) => {
			if (i === 0) {
				path = `M ${current.point.x * scaleX + offsetX},${current.point.y * scaleY + offsetY}`;
			} else {
				const prev = points[i - 1];
				path += ` C ${prev.cp2.x * scaleX + offsetX},${prev.cp2.y * scaleY + offsetY} ${
					current.cp1.x * scaleX + offsetX
				},${current.cp1.y * scaleY + offsetY} ${
					current.point.x * scaleX + offsetX
				},${current.point.y * scaleY + offsetY}`;
			}
		});

		path += ' Z';
		return path;
	}

	let {
		fillType = 'solid',
		fillColor = '#FFE0DB',
		colors = ['#FFE0DB'],
		angle = 0,
		strokeColor = '#EB4C2D',
		strokeWidth = 1,
		shadow = [],
		pointCount = 5,
		strength = 5,
		seed = 9
	} = $props();

	const generatePath = (width, height) => {
		return generateBlobPath(width, height, pointCount, strength, seed);
	};

	let svg;
	let id = crypto.randomUUID();

	function updatePaths({ width, height }) {
		if (!svg || width <= 0 || height <= 0) return;

		const path = generatePath(width, height);

		svg
			.querySelectorAll('[data-clip-path],[data-fill-path],[data-stroke-path],[data-shadow]')
			.forEach((el) => {
				el.setAttribute('d', path);
			});

		if (fillType === 'linear') {
			const gradient = svg.querySelector('linearGradient');
			if (gradient) {
				const [cx, cy] = [width / 2, height / 2];
				const radius = Math.sqrt(width * width + height * height) / 2;
				const angleRad = angle * RADIANS;
				const x1 = cx + radius * Math.cos(angleRad + Math.PI / 2);
				const y1 = cy + radius * Math.sin(angleRad + Math.PI / 2);
				const x2 = cx + radius * Math.cos(angleRad - Math.PI / 2);
				const y2 = cy + radius * Math.sin(angleRad - Math.PI / 2);

				gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
				gradient.setAttribute('x1', x1);
				gradient.setAttribute('y1', y1);
				gradient.setAttribute('x2', x2);
				gradient.setAttribute('y2', y2);
			}
		}
	}

	$effect(() => {
		const observer = new ResizeObserver(([entry]) => updatePaths(entry.contentRect));
		if (svg?.parentElement) {
			observer.observe(svg.parentElement);
			return () => observer.disconnect();
		}
	});

	const outsideShadows = shadow.filter((s) => !s.outside);
	const insideShadows = shadow.filter((s) => s.outside);
</script>

<SvgShapeBase
	{fillType}
	{fillColor}
	{colors}
	{angle}
	{strokeColor}
	{strokeWidth}
	{shadow}
	shapeType="blob"
	{generatePath}
/>
