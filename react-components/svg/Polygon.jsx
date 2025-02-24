import { useRef, useEffect, useId, Fragment } from 'react';

const RADIANS = Math.PI / 180;

function solveQuadratic(a, b, c) {
	if (a === 0) return b !== 0 ? [-c / b] : [];

	const discriminant = b * b - 4 * a * c;
	if (discriminant < 0) return [];

	const discRoot = Math.sqrt(discriminant);
	return [(-b + discRoot) / (2 * a), (-b - discRoot) / (2 * a)].filter(
		(root) => root >= 0 && root <= 1
	);
}

function bezierCoordinate(t, p0, p1, p2, p3) {
	const oneMinusT = 1 - t;
	return (
		oneMinusT * oneMinusT * oneMinusT * p0 +
		3 * oneMinusT * oneMinusT * t * p1 +
		3 * oneMinusT * t * t * p2 +
		t * t * t * p3
	);
}

function bezierPoint(t, p0, p1, p2, p3) {
	const x = bezierCoordinate(t, p0.x, p1.x, p2.x, p3.x);
	const y = bezierCoordinate(t, p0.y, p1.y, p2.y, p3.y);
	return { x, y };
}

function calculateSegmentBounds(start, cp1, cp2, end) {
	let minX = Math.min(start.x, end.x);
	let maxX = Math.max(start.x, end.x);
	let minY = Math.min(start.y, end.y);
	let maxY = Math.max(start.y, end.y);

	[0, 1].forEach((axis) => {
		const values = axis === 0 ? [start.x, cp1.x, cp2.x, end.x] : [start.y, cp1.y, cp2.y, end.y];

		const a = -values[0] + 3 * values[1] - 3 * values[2] + values[3];
		const b = 2 * values[0] - 4 * values[1] + 2 * values[2];
		const c = -values[0] + values[1];

		solveQuadratic(a, b, c).forEach((t) => {
			const point = bezierPoint(t, start, cp1, cp2, end);
			minX = Math.min(minX, point.x);
			maxX = Math.max(maxX, point.x);
			minY = Math.min(minY, point.y);
			maxY = Math.max(maxY, point.y);
		});
	});

	return { minX, minY, maxX, maxY };
}

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
		-pathBounds.minX * finalScale + (width - (pathBounds.maxX - pathBounds.minX) * finalScale) / 2;
	let offsetY =
		-pathBounds.minY * finalScale + (height - (pathBounds.maxY - pathBounds.minY) * finalScale) / 2;

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

function createShadowFilter(shadows, isOutside, id) {
	if (!shadows.length) return null;

	const expansion = isOutside
		? shadows.reduce(
				(acc, { x, y, blur }) => Math.max(acc, Math.max(Math.abs(x), Math.abs(y)) + blur),
				1
			)
		: 0;

	const filterProps = isOutside
		? {
				x: `-${expansion}px`,
				y: `-${expansion}px`,
				width: `${2 * expansion}px`,
				height: `${2 * expansion}px`
			}
		: {};

	return (
		<filter id={`${isOutside ? 'outside' : 'inside'}-shadow-${id}`} {...filterProps}>
			{shadows.map(({ x, y, blur, color }, index) => (
				<Fragment key={index}>
					<feOffset dx={x || 0.001} dy={y} in="SourceAlpha" result={`offset-${index}`} />
					<feGaussianBlur stdDeviation={blur} in={`offset-${index}`} result={`blur-${index}`} />
					{!isOutside && (
						<feComposite
							operator="out"
							in="SourceAlpha"
							in2={`blur-${index}`}
							result={`composite-${index}`}
						/>
					)}
					<feFlood floodColor={color} result={`color-${index}`} />
					<feComposite
						operator="in"
						in={`color-${index}`}
						in2={isOutside ? `blur-${index}` : `composite-${index}`}
						result={`shadow-${index}`}
					/>
				</Fragment>
			))}
			<feMerge>
				{shadows.map((_, i) => (
					<feMergeNode key={i} in={`shadow-${shadows.length - 1 - i}`} />
				))}
			</feMerge>
		</filter>
	);
}

export default function Polygon({
	cornerCount = 3,
	bend = 0,
	fillType = 'solid',
	fillColor = '#FFE0DB',
	colors = ['#FFE0DB'],
	angle = 0,
	strokeColor = '#ff0000',
	strokeWidth = 1,
	shadow = []
}) {
	const svgRef = useRef(null);
	const id = useId();

	const updatePaths = ({ width, height }) => {
		const svg = svgRef.current;
		if (width <= 0 || height <= 0) return;

		const path = generatePath(width, height, cornerCount, bend);
		const gradient = svg.querySelector('linearGradient');

		svg
			.querySelectorAll('[data-clip-path],[data-fill-path],[data-stroke-path],[data-shadow]')
			.forEach((el) => el.setAttribute('d', path));

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
	};

	useEffect(() => {
		const observer = new ResizeObserver(([{ contentRect }]) => updatePaths(contentRect));
		svgRef.current?.parentElement && observer.observe(svgRef.current.parentElement);
		return () => observer.disconnect();
	}, [cornerCount, bend, fillType, angle, shadow]);

	const outsideShadows = shadow.filter((s) => !s.outside);
	const insideShadows = shadow.filter((s) => s.outside);

	return (
		<svg ref={svgRef} style={{ overflow: 'visible' }}>
			<defs>
				{fillType === 'linear' && (
					<linearGradient id={`supershape-gradient-${id}`}>
						{colors.map((color, i) => (
							<stop key={i} offset={`${(i / (colors.length - 1)) * 100}%`} stopColor={color} />
						))}
					</linearGradient>
				)}
				{createShadowFilter(outsideShadows, true, id)}
				{createShadowFilter(insideShadows, false, id)}
				<clipPath id={`stroke-clip-${id}`}>
					<path data-clip-path />{' '}
				</clipPath>
			</defs>
			{outsideShadows.length > 0 && <path data-shadow filter={`url(#outside-shadow-${id})`} />}
			<path
				data-fill-path
				fill={fillType === 'solid' ? fillColor || '#0000' : `url(#supershape-gradient-${id})`}
			/>
			{insideShadows.length > 0 && <path data-shadow filter={`url(#inside-shadow-${id})`} />}
			{strokeColor && strokeWidth > 0 && (
				<path
					data-stroke-path
					fill="none"
					stroke={strokeColor}
					strokeWidth={strokeWidth * 2}
					clipPath={`url(#stroke-clip-${id})`}
				/>
			)}
		</svg>
	);
}
