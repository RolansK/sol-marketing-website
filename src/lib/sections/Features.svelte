<script>
	import Button from '$lib/components/Button.svelte';
	import Super from '$lib/components/svg/Super.svelte';
	import Eye from '$lib/icons/eye.svelte';

	let activeIndex = $state(0);

	const features = [
		{
			title: 'Customizable in Framer',
			description:
				'All the components are fully customizable right on canvas through controls in the sidebar. Color styles are also fully supported.',
			shape: {
				ratio: 3.6,
				m: 10,
				n1: 1.7,
				n2: -0.4,
				n3: 0.7,
				fillColor: '#00000000',
				strokeColor: '#7D7D7E',
				activeStrokeColor: '#E53817'
			}
		},
		{
			title: 'Dependency free',
			description:
				'Sol does not rely on 3rd party JavaScript libraries. It is built on standard web technologies, keeping your website size down.',
			shape: {
				ratio: 0.3,
				m: 8,
				n1: 2.9,
				n2: 10,
				n3: 2.4,
				fillColor: '#00000000',
				strokeColor: '#7D7D7E',
				activeStrokeColor: '#E53817'
			}
		},
		{
			title: 'Fast. On mobile, too',
			description:
				'Components are optimized to be fast and easy on resources. This means they maintain good framerates - even on budget phones and laptops.',
			shape: {
				ratio: 1,
				m: 6,
				n1: 10,
				n2: 50,
				n3: 10,
				fillColor: '#00000000',
				strokeColor: '#7D7D7E',
				activeStrokeColor: '#E53817'
			}
		}
	];
</script>

<section class="features-container">
	<div class="features">
		{#each features as feature, i}
			<span onpointerenter={() => (activeIndex = i)} class:active={activeIndex === i}>
				<div class="features-shape">
					<Super
						ratio={feature.shape.ratio}
						m={feature.shape.m}
						n1={feature.shape.n1}
						n2={feature.shape.n2}
						n3={feature.shape.n3}
						fillColor={feature.shape.fillColor}
						strokeColor={activeIndex === i
							? feature.shape.activeStrokeColor
							: feature.shape.strokeColor}
						strokeWidth={1}
					/>
				</div>
				<h2>{feature.title}</h2>
				<p>{feature.description}</p>
			</span>
		{/each}
		<div class="features-controls">
			{#each features as _, i}
				<button onpointerenter={() => (activeIndex = i)} class:active={activeIndex === i}
					>{i + 1}</button
				>
			{/each}
		</div>
	</div>
</section>
