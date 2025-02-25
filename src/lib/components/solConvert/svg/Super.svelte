<script>
	import SvgShapeBase from './SvgShapeBase.svelte';
	import { RADIANS } from './solSvgUtils';

	function generateSuperPath(width, height, m, n1, n2, n3, ratio) {
		const segments = 7560;
		const points = [];
		let minX = Infinity,
			maxX = -Infinity,
			minY = Infinity,
			maxY = -Infinity;

		for (let i = 0; i <= segments; i++) {
			const angle = (i / segments) * Math.PI * 2;
			const cosAngle = Math.cos((m * angle) / 4);
			const sinAngle = Math.sin((m * angle) / 4);
			const radius = Math.pow(
				Math.pow(Math.abs(cosAngle), n2) + Math.pow(Math.abs(sinAngle / ratio), n3),
				-1 / n1
			);
			const x = radius * Math.cos(angle);
			const y = radius * Math.sin(angle);
			points.push({ x, y });
			minX = Math.min(minX, x);
			maxX = Math.max(maxX, x);
			minY = Math.min(minY, y);
			maxY = Math.max(maxY, y);
		}

		const scaleFactor = Math.min(width / (maxX - minX), height / (maxY - minY));
		const [translateX, translateY] = [
			-minX * scaleFactor + (width - (maxX - minX) * scaleFactor) / 2,
			-minY * scaleFactor + (height - (maxY - minY) * scaleFactor) / 2
		];

		return (
			points.reduce((path, { x, y }, i) => {
				const scaledX = x * scaleFactor + translateX;
				const scaledY = y * scaleFactor + translateY;
				return `${path}${i === 0 ? 'M' : 'L'}${scaledX},${scaledY}`;
			}, '') + 'Z'
		);
	}

	let {
		ratio = 1.3,
		m = 47,
		n1 = 15,
		n2 = 22,
		n3 = 28,
		fillType = 'solid',
		fillColor = '#FFE0DB',
		colors = ['#FFE0DB'],
		angle = 0,
		strokeColor = '#ff0000',
		strokeWidth = 1,
		shadow = []
	} = $props();

	const generatePath = (width, height) => {
		return generateSuperPath(width, height, m, n1, n2, n3, ratio);
	};

	let svg;
	let id = crypto.randomUUID();

	function updatePaths({ width, height }) {
		if (!svg || width <= 0 || height <= 0) return;

		const path = generatePath(width, height);
		const gradient = svg.querySelector('linearGradient');

		svg
			.querySelectorAll('[data-clip-path],[data-fill-path],[data-stroke-path],[data-shadow]')
			.forEach((el) => {
				el.setAttribute('d', path);
			});

		if (fillType === 'linear' && gradient) {
			const radius = Math.sqrt(width * width + height * height) / 2;
			const [cx, cy] = [width / 2, height / 2];
			const [x1, y1, x2, y2] = [
				cx + radius * Math.cos((angle * Math.PI) / 2 + Math.PI / 2),
				cy + radius * Math.sin((angle * Math.PI) / 2 + Math.PI / 2),
				cx + radius * Math.cos((angle * Math.PI) / 2 - Math.PI / 2),
				cy + radius * Math.sin((angle * Math.PI) / 2 - Math.PI / 2)
			];

			gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
			gradient.setAttribute('x1', x1);
			gradient.setAttribute('y1', y1);
			gradient.setAttribute('x2', x2);
			gradient.setAttribute('y2', y2);
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
	shapeType="supershape"
	{generatePath}
/>
