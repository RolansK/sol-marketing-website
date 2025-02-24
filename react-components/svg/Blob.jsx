import { useEffect, useId, Fragment } from 'react';

const RADIANS = Math.PI / 180;

function seedRandom(seed) {
	const m = 4294967296;
	const a = 1664525;
	const c = 1013904223;
	let z = seed >>> 0;

	return function () {
		z = (a * z + c) % m;
		return z / m;
	};
}

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

function generatePath(width, height, pointCount, strength, seed) {
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

export default function Blob({
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
}) {
	const id = useId();

	const updatePaths = (svg, { width, height }) => {
		if (!svg || width <= 0 || height <= 0) return;

		const path = generatePath(width, height, pointCount, strength, seed);

		svg
			.querySelectorAll('[data-clip-path],[data-fill-path],[data-stroke-path],[data-shadow]')
			.forEach((el) => el.setAttribute('d', path));

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
	};

	useEffect(() => {
		const svg = document.querySelector(`svg[data-blob-id="${id}"]`);
		if (!svg?.parentElement) return;

		const observer = new ResizeObserver((entries) => {
			updatePaths(svg, entries[0].contentRect);
		});

		observer.observe(svg.parentElement);
		return () => observer.disconnect();
	}, [pointCount, strength, seed, fillType, angle, shadow, id]);

	const outsideShadows = shadow.filter((s) => !s.outside);
	const insideShadows = shadow.filter((s) => s.outside);

	return (
		<svg data-blob-id={id} style={{ overflow: 'visible' }}>
			<defs>
				{fillType === 'linear' && (
					<linearGradient id={`blob-gradient-${id}`}>
						{colors.map((color, i) => (
							<stop key={i} offset={`${(i / (colors.length - 1)) * 100}%`} stopColor={color} />
						))}
					</linearGradient>
				)}
				{createShadowFilter(outsideShadows, true, id)}
				{createShadowFilter(insideShadows, false, id)}
				<clipPath id={`stroke-clip-${id}`}>
					<path data-clip-path />
				</clipPath>
			</defs>
			{outsideShadows.length > 0 && <path data-shadow filter={`url(#outside-shadow-${id})`} />}
			<path
				data-fill-path
				fill={fillType === 'solid' ? fillColor || '#0000' : `url(#blob-gradient-${id})`}
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
