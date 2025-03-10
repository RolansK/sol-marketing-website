<script>
	const { icon, title = 'Demo', class: className = '' } = $props();
</script>

<button class="button-primary {className}">
	{#if icon}
		{@const Icon = icon}
		<Icon class="icon" />
	{/if}
	<span>{title}</span>
</button>
