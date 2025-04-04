<script>
	const { icon, title = 'Demo', class: className = '', url = '' } = $props();

	function handleClick(event) {
		if (url) {
			if (url.startsWith('#')) {
				event.preventDefault();

				const targetId = url.substring(1);
				const element = document.getElementById(targetId);

				if (element) {
					element.scrollIntoView({
						behavior: 'smooth',
						block: 'start'
					});

					history.pushState(null, null, url);
				}
			} else {
				window.open(url, '_blank', 'noopener,noreferrer');
			}
		}
	}
</script>

<button
	class="button-cta {className}"
	onclick={(e) => {
		e.preventDefault();
		handleClick(e);
	}}
>
	{#if icon}
		{@const Icon = icon}
		<Icon class="icon" />
	{/if}
	<span>{title}</span>
</button>
