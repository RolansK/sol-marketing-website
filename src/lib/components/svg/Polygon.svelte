<script>
	import { calculateSegmentBounds } from './solSvgUtils';
	import SvgShapeBase from './SvgShapeBase.svelte';

	let {
		cornerCount = 3,
		bend = 0,
		fillType = 'solid',
		fillColor = '#FFE0DB',
		colors = ['#FFE0DB'],
		angle = 0,
		strokeColor = '#ff0000',
		strokeWidth = 1,
		shadow = []
	} = $props();

	function generatePolygonPath(width, height, cornerCount, bend) {
		const angleOffset = -Math.PI / 2;
		const angleIncrement = (2 * Math.PI) / cornerCount;

		const unitVertices = Array.from({ length: cornerCount }, (_, i) => {
			const angle = angleOffset + i * angleIncrement;
			return { x: Math.cos(angle), y: Math.sin(angle) };
		});

		const bounds = unitVertices.reduce(
			(acc, vertex) => ({
				minX: Math.min(acc.minX, vertex.x),
				maxX: Math.max(acc.maxX, vertex.x),
				minY: Math.min(acc.minY, vertex.y),
				maxY: Math.max(acc.maxY, vertex.y)
			}),
			{ minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
		);

		const unitWidth = bounds.maxX - bounds.minX;
		const unitHeight = bounds.maxY - bounds.minY;
		const scale = Math.min(width / unitWidth, height / unitHeight);
		const centerX = width / 2;
		const centerY = height / 2;

		const scaledVertices = unitVertices.map((vertex) => ({
			x: (vertex.x - (bounds.minX + bounds.maxX) / 2) * scale + centerX,
			y: (vertex.y - (bounds.minY + bounds.maxY) / 2) * scale + centerY
		}));

		const sides = scaledVertices.map((startVertex, i) => {
			const endVertex = scaledVertices[(i + 1) % cornerCount];
			const vector = {
				x: endVertex.x - startVertex.x,
				y: endVertex.y - startVertex.y
			};
			const sideLength = Math.hypot(vector.x, vector.y);
			const unitVector = {
				x: vector.x / sideLength,
				y: vector.y / sideLength
			};
			const perpendicular = { x: -unitVector.y, y: unitVector.x };

			const safeDistance = 0.25 * (2 * Math.cos(Math.PI / cornerCount));

			const mappedBend = -bend * safeDistance * scale;

			return {
				start: startVertex,
				end: endVertex,
				c1x: startVertex.x + vector.x * 0.25 + perpendicular.x * mappedBend,
				c1y: startVertex.y + vector.y * 0.25 + perpendicular.y * mappedBend,
				c2x: endVertex.x - vector.x * 0.25 + perpendicular.x * mappedBend,
				c2y: endVertex.y - vector.y * 0.25 + perpendicular.y * mappedBend
			};
		});

		const calculateBounds = (sides) => {
			return sides.reduce(
				(acc, side) => {
					const segmentBounds = calculateSegmentBounds(
						side.start,
						{ x: side.c1x, y: side.c1y },
						{ x: side.c2x, y: side.c2y },
						side.end
					);
					return {
						minX: Math.min(acc.minX, segmentBounds.minX),
						maxX: Math.max(acc.maxX, segmentBounds.maxX),
						minY: Math.min(acc.minY, segmentBounds.minY),
						maxY: Math.max(acc.maxY, segmentBounds.maxY)
					};
				},
				{ minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
			);
		};

		let pathBounds = calculateBounds(sides);
		let finalScale = Math.min(
			width / (pathBounds.maxX - pathBounds.minX),
			height / (pathBounds.maxY - pathBounds.minY)
		);
		let offsetX =
			-pathBounds.minX * finalScale +
			(width - (pathBounds.maxX - pathBounds.minX) * finalScale) / 2;
		let offsetY =
			-pathBounds.minY * finalScale +
			(height - (pathBounds.maxY - pathBounds.minY) * finalScale) / 2;

		const finalAdjustedSides = sides.map((side) => ({
			start: {
				x: side.start.x * finalScale + offsetX,
				y: side.start.y * finalScale + offsetY
			},
			end: {
				x: side.end.x * finalScale + offsetX,
				y: side.end.y * finalScale + offsetY
			},
			c1x: side.c1x * finalScale + offsetX,
			c1y: side.c1y * finalScale + offsetY,
			c2x: side.c2x * finalScale + offsetX,
			c2y: side.c2y * finalScale + offsetY
		}));

		let path = `M ${finalAdjustedSides[0].start.x},${finalAdjustedSides[0].start.y}`;
		finalAdjustedSides.forEach((side) => {
			path += ` C ${side.c1x},${side.c1y} ${side.c2x},${side.c2y} ${side.end.x},${side.end.y}`;
		});
		path += ' Z';

		return path;
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
	generatePath={(width, height) => generatePolygonPath(width, height, cornerCount, bend)}
/>
