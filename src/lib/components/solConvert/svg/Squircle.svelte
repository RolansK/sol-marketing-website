<script>
	import { RADIANS } from './solSvgUtils';
	import SvgShapeBase from './SvgShapeBase.svelte';

	let {
		borderRadius = '20px',
		smoothing = 0.5,
		fillType = 'solid',
		fillColor = '#FFE0DB',
		colors = ['#FFE0DB'],
		angle = 0,
		strokeColor = '#ff0000',
		strokeWidth = 10,
		shadow = []
	} = $props();

	function getPathParamsForCorner(cornerRadius, cornerSmoothing, maxRadius) {
		const clampedRadius = Math.min(cornerRadius, maxRadius);
		const clampedSmoothing = Math.min(cornerSmoothing, maxRadius / clampedRadius - 1);
		const p = Math.min((1 + clampedSmoothing) * clampedRadius, maxRadius);
		const arcMeasure = 90 * (1 - clampedSmoothing);
		const arcSectionLength = Math.sin((arcMeasure / 2) * RADIANS) * clampedRadius * Math.SQRT2;
		const angleAlpha = (90 - arcMeasure) / 2;
		const p3ToP4Distance = clampedRadius * Math.tan((angleAlpha / 2) * RADIANS);
		const angleBeta = 45 * clampedSmoothing;
		const c = p3ToP4Distance * Math.cos(angleBeta * RADIANS);
		const d = c * Math.tan(angleBeta * RADIANS);
		const b = (p - arcSectionLength - c - d) / 3;
		const a = 2 * b;

		return { a, b, c, d, p, arcSectionLength, cornerRadius: clampedRadius };
	}

	function drawCornerPath({ a, b, c, d, cornerRadius, arcSectionLength }, type) {
		if (cornerRadius === 0) {
			return type.startsWith('top') ? `l${d},0` : `l0,${d}`;
		}

		const commands = {
			topRight: `c${a},0,${a + b},0,${a + b + c},${d}a${cornerRadius},${cornerRadius},0,0,1,${arcSectionLength},${arcSectionLength}c${d},${c},${d},${b + c},${d},${a + b + c}`,
			bottomRight: `c0,${a},0,${a + b},${-d},${a + b + c}a${cornerRadius},${cornerRadius},0,0,1,${-arcSectionLength},${arcSectionLength}c${-c},${d},${-(b + c)},${d},${-(a + b + c)},${d}`,
			bottomLeft: `c${-a},0,${-(a + b)},0,${-(a + b + c)},${-d}a${cornerRadius},${cornerRadius},0,0,1,${-arcSectionLength},${-arcSectionLength}c${-d},${-c},${-d},${-(b + c)},${-d},${-(a + b + c)}`,
			topLeft: `c0,${-a},0,${-(a + b)},${d},${-(a + b + c)}a${cornerRadius},${cornerRadius},0,0,1,${arcSectionLength},${-arcSectionLength}c${c},${-d},${b + c},${-d},${a + b + c},${-d}`
		};

		return commands[type];
	}

	const values = borderRadius.split(' ').map(parseFloat);
	const cornerRadii = Array(4)
		.fill(values[0] || 0)
		.map((v, i) => values[i] || v);

	function generateSquirclePath(width, height) {
		const adjustedWidth = width;
		const adjustedHeight = height;
		const maxRadius = Math.min(adjustedWidth, adjustedHeight) / 2;

		const corners = cornerRadii.map((radius) =>
			getPathParamsForCorner(radius, smoothing, maxRadius)
		);
		const [topLeft, topRight, bottomRight, bottomLeft] = corners;

		return `M${adjustedWidth - topRight.p},${0}${drawCornerPath(topRight, 'topRight')}L${adjustedWidth},${adjustedHeight - bottomRight.p}${drawCornerPath(bottomRight, 'bottomRight')}L${bottomLeft.p},${adjustedHeight}${drawCornerPath(bottomLeft, 'bottomLeft')}L${0},${topLeft.p}${drawCornerPath(topLeft, 'topLeft')}Z`;
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
	generatePath={generateSquirclePath}
/>
