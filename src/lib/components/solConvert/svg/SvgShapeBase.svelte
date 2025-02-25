<script>
	import { RADIANS } from './solSvgUtils';

	const {
		fillType = 'solid',
		fillColor = '#FFE0DB',
		colors = ['#FFE0DB'],
		angle = 0,
		strokeColor = '#ff0000',
		strokeWidth = 1,
		shadow = [],
		shapeType = 'shape',
		generatePath = () => '',
		children = () => null
	} = $props();

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

	const outsideShadows = $derived(shadow.filter((s) => !s.outside));
	const insideShadows = $derived(shadow.filter((s) => s.outside));
</script>

<svg bind:this={svg} style="overflow: visible">
	<defs>
		{#if fillType === 'linear'}
			<linearGradient id={`${shapeType}-gradient-${id}`}>
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
		fill={fillType === 'solid' ? fillColor || '#0000' : `url(#${shapeType}-gradient-${id})`}
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
	{#if children}
		{@render children()}
	{/if}
</svg>
