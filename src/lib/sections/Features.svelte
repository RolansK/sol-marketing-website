<script>
	import Button from '$lib/components/Button.svelte';
	import Super from '$lib/components/svg/Super.svelte';
	import Eye from '$lib/icons/eye.svelte';
</script>

<section class="features-container">
	<div class="features">
		<span>
			<div class="features-shape">
				<Super />
			</div>
			<h2>Customizable in Framer</h2>
			<p>
				All the components are fully customizable right on canvas through controls in the sidebar.
				Color styles are also fully supported.
			</p>
		</span>
		<span>
			<div class="features-shape">
				<Super />
			</div>
			<h2>Dependency free</h2>
			<p>
				Sol does not rely on 3rd party JavaScript libraries. It is built on standard web
				technologies, keeping your website size down.
			</p>
		</span>
		<span>
			<div class="features-shape">
				<Super />
			</div>
			<h2>Fast. On mobile, too</h2>
			<p>
				Components are optimized to be fast and easy on resources. This means they maintain good
				framerates - even on budget phones and laptops.
			</p>
		</span>
	</div>
	<div class="slider-controls">
		<button></button>
	</div>
</section>
