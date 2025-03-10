<script>
	const { icon, title = 'Demo' } = $props();
</script>

<button class="nav-button">
	{#if icon}
		{@const Icon = icon}
		<Icon class="icon" />
	{/if}
	<span class="title">{title}</span>
</button>

<style>
	.nav-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
	}
</style>
