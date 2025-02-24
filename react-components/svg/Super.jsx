import { useRef, useEffect, useId, Fragment } from 'react';

const RADIANS = Math.PI / 180;

function generatePath(width, height, m, n1, n2, n3, ratio) {
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

export default function Super({
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
}) {
	const svgRef = useRef(null);
	const id = useId();

	const updatePaths = ({ width, height }) => {
		const svg = svgRef.current;
		if (width <= 0 || height <= 0) return;

		const path = generatePath(width, height, m, n1, n2, n3, ratio);
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
	}, [m, n1, n2, n3, ratio, fillType, angle, shadow]);

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
