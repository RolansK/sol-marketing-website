import { useRef, useEffect, useId, Fragment } from 'react';

const RADIANS = Math.PI / 180;

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

function generatePath(
	width,
	height,
	cornerRadii,
	cornerSmoothing,
	adjustment = 0,
	offset = { x: 0, y: 0 }
) {
	const adjustedWidth = width - 2 * adjustment;
	const adjustedHeight = height - 2 * adjustment;
	const maxRadius = Math.min(adjustedWidth, adjustedHeight) / 2;

	const corners = cornerRadii.map((radius) =>
		getPathParamsForCorner(radius, cornerSmoothing, maxRadius)
	);
	const [topLeft, topRight, bottomRight, bottomLeft] = corners;

	return `M${adjustedWidth - topRight.p + offset.x},${offset.y}${drawCornerPath(topRight, 'topRight')}L${adjustedWidth + offset.x},${adjustedHeight - bottomRight.p + offset.y}${drawCornerPath(bottomRight, 'bottomRight')}L${bottomLeft.p + offset.x},${adjustedHeight + offset.y}${drawCornerPath(bottomLeft, 'bottomLeft')}L${offset.x},${topLeft.p + offset.y}${drawCornerPath(topLeft, 'topLeft')}Z`;
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

export default function Squircle({
	borderRadius = '20px',
	smoothing = 0.5,
	fillType = 'solid',
	fillColor = '#FFE0DB',
	colors = ['#FFE0DB'],
	angle = 0,
	strokeColor = '#ff0000',
	strokeWidth = 10,
	shadow = []
}) {
	const svgRef = useRef(null);
	const id = useId();

	const values = borderRadius.split(' ').map(parseFloat);
	const cornerRadii = Array(4)
		.fill(values[0] || 0)
		.map((v, i) => values[i] || v);

	const updatePaths = ({ width, height }) => {
		const svg = svgRef.current;
		if (width <= 0 || height <= 0) return;

		const outerPath = generatePath(width, height, cornerRadii, smoothing);
		const innerPath =
			width > strokeWidth * 2 && height > strokeWidth * 2
				? generatePath(
						width,
						height,
						cornerRadii.map((r) => Math.max(0, r - strokeWidth)),
						smoothing,
						strokeWidth,
						{ x: strokeWidth, y: strokeWidth }
					)
				: '';

		svg.querySelector('[data-outer]')?.setAttribute('d', outerPath);
		svg.querySelector('[data-inner]')?.setAttribute('d', `${outerPath} ${innerPath}`);
		svg.querySelectorAll('[data-shadow]').forEach((el) => el.setAttribute('d', outerPath));

		if (fillType === 'linear') {
			const gradient = svg.querySelector('linearGradient');
			if (gradient) {
				const cx = width / 2;
				const cy = height / 2;
				const radius = Math.sqrt(width * width + height * height) / 2;
				const x1 = cx + radius * Math.cos(angle * RADIANS + Math.PI / 2);
				const y1 = cy + radius * Math.sin(angle * RADIANS + Math.PI / 2);
				const x2 = cx + radius * Math.cos(angle * RADIANS - Math.PI / 2);
				const y2 = cy + radius * Math.sin(angle * RADIANS - Math.PI / 2);

				gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
				gradient.setAttribute('x1', x1);
				gradient.setAttribute('y1', y1);
				gradient.setAttribute('x2', x2);
				gradient.setAttribute('y2', y2);
			}
		}
	};

	useEffect(() => {
		const observer = new ResizeObserver(([{ contentRect }]) => updatePaths(contentRect));
		svgRef.current?.parentElement && observer.observe(svgRef.current.parentElement);
		return () => observer.disconnect();
	}, [cornerRadii, smoothing, strokeWidth, fillType, angle, shadow]);

	const outsideShadows = shadow.filter((s) => !s.outside);
	const insideShadows = shadow.filter((s) => s.outside);

	return (
		<svg ref={svgRef} style={{ overflow: 'visible' }}>
			<defs>
				{fillType === 'linear' && (
					<linearGradient id={`squircle-gradient-${id}`}>
						{colors.map((color, i) => (
							<stop key={i} offset={`${(i / (colors.length - 1)) * 100}%`} stopColor={color} />
						))}
					</linearGradient>
				)}
				{createShadowFilter(outsideShadows, true, id)}
				{createShadowFilter(insideShadows, false, id)}
			</defs>
			{outsideShadows.length > 0 && <path data-shadow filter={`url(#outside-shadow-${id})`} />}
			<path
				data-outer
				fill={fillType === 'solid' ? fillColor || '#0000' : `url(#squircle-gradient-${id})`}
			/>
			{insideShadows.length > 0 && <path data-shadow filter={`url(#inside-shadow-${id})`} />}
			<path data-inner fillRule="evenodd" fill={strokeColor || '#0000'} />
		</svg>
	);
}
