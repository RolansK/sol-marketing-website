<script>
	import {
		RADIANS,
		solveQuadratic,
		bezierCoordinate,
		bezierPoint,
		calculateSegmentBounds
	} from './solSvgUtils';

	function generatePath(width, height, cornerCount, bend) {
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

	let svg;
	let id = crypto.randomUUID();

	function updatePaths({ width, height }) {
		if (!svg || width <= 0 || height <= 0) return;

		const path = generatePath(width, height, cornerCount, bend);
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
				cx + radius * Math.cos(angle * RADIANS + Math.PI / 2),
				cy + radius * Math.sin(angle * RADIANS + Math.PI / 2),
				cx + radius * Math.cos(angle * RADIANS - Math.PI / 2),
				cy + radius * Math.sin(angle * RADIANS - Math.PI / 2)
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

<svg bind:this={svg} style="overflow: visible">
	<defs>
		{#if fillType === 'linear'}
			<linearGradient id={`polygon-gradient-${id}`}>
				{#each colors as color, i}
					<stop offset={`${(i / (colors.length - 1)) * 100}%`} stop-color={color} />
				{/each}
			</linearGradient>
		{/if}
		{#if outsideShadows.length > 0}
			<filter
				id={`outside-shadow-${id}`}
				x={`-${outsideShadows.reduce(
					(acc, { x, y, blur }) => Math.max(acc, Math.max(Math.abs(x), Math.abs(y)) + blur),
					1
				)}px`}
				y={`-${outsideShadows.reduce(
					(acc, { x, y, blur }) => Math.max(acc, Math.max(Math.abs(x), Math.abs(y)) + blur),
					1
				)}px`}
				width={`${
					2 *
					outsideShadows.reduce(
						(acc, { x, y, blur }) => Math.max(acc, Math.max(Math.abs(x), Math.abs(y)) + blur),
						1
					)
				}px`}
				height={`${
					2 *
					outsideShadows.reduce(
						(acc, { x, y, blur }) => Math.max(acc, Math.max(Math.abs(x), Math.abs(y)) + blur),
						1
					)
				}px`}
			>
				{#each outsideShadows as { x, y, blur, color }, index}
					<feOffset dx={x || 0.001} dy={y} in="SourceAlpha" result={`offset-${index}`} />
					<feGaussianBlur stdDeviation={blur} in={`offset-${index}`} result={`blur-${index}`} />
					<feFlood flood-color={color} result={`color-${index}`} />
					<feComposite
						operator="in"
						in={`color-${index}`}
						in2={`blur-${index}`}
						result={`shadow-${index}`}
					/>
				{/each}
				<feMerge>
					{#each outsideShadows as _, i}
						<feMergeName in={`shadow-${outsideShadows.length - 1 - i}`}></feMergeName>
					{/each}
				</feMerge>
			</filter>
		{/if}
		{#if insideShadows.length > 0}
			<filter id={`inside-shadow-${id}`}>
				{#each insideShadows as { x, y, blur, color }, index}
					<feOffset dx={x || 0.001} dy={y} in="SourceAlpha" result={`offset-${index}`} />
					<feGaussianBlur stdDeviation={blur} in={`offset-${index}`} result={`blur-${index}`} />
					<feComposite
						operator="out"
						in="SourceAlpha"
						in2={`blur-${index}`}
						result={`composite-${index}`}
					/>
					<feFlood flood-color={color} result={`color-${index}`} />
					<feComposite
						operator="in"
						in={`color-${index}`}
						in2={`composite-${index}`}
						result={`shadow-${index}`}
					/>
				{/each}
				<feMerge>
					{#each insideShadows as _, i}
						<feMergeName in={`shadow-${insideShadows.length - 1 - i}`}></feMergeName>
					{/each}
				</feMerge>
			</filter>
		{/if}
		<clipPath id={`stroke-clip-${id}`}>
			<path data-clip-path />
		</clipPath>
	</defs>
	{#if outsideShadows.length > 0}
		<path data-shadow filter={`url(#outside-shadow-${id})`} />
	{/if}
	<path
		data-fill-path
		fill={fillType === 'solid' ? fillColor || '#0000' : `url(#polygon-gradient-${id})`}
	/>
	{#if insideShadows.length > 0}
		<path data-shadow filter={`url(#inside-shadow-${id})`} />
	{/if}
	{#if strokeColor && strokeWidth > 0}
		<path
			data-stroke-path
			fill="none"
			stroke={strokeColor}
			stroke-width={strokeWidth * 2}
			clip-path={`url(#stroke-clip-${id})`}
		/>
	{/if}
</svg>
