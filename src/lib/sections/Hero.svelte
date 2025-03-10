<script>
	import ButtonCta from '$lib/components/ButtonCta.svelte';

	import Eye from '$lib/icons/eye.svelte';
</script>

<section class="hero">
	<div>
		<span>Loved by pros</span>
		<span>Visual</span>
		<Eye />
		<span>plugin</span>
		<span>for Framer</span>

		<ButtonCta icon={Eye} title="Watch the demo" />
		<ButtonCta icon={Eye} title="Follow on X" />
	</div>
</section>
