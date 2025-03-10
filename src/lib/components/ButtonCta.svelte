<script>
	const { icon, title = 'Demo' } = $props();
</script>

<button class="button-cta bottom">
	{#if icon}
		{@const Icon = icon}
		<Icon class="icon" />
	{/if}
	<span>{title}</span>
</button>
