<script>
	import SvgShapeBase from './SvgShapeBase.svelte';
	import { RADIANS } from './solSvgUtils';

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

	let id = crypto.randomUUID();

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
</script>

<SvgShapeBase
	{fillType}
	{fillColor}
	{colors}
	{angle}
	{strokeColor}
	{strokeWidth}
	{shadow}
	{id}
	generatePath={(width, height) => generateSuperPath(width, height, m, n1, n2, n3, ratio)}
/>
