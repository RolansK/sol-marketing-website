<script>
	let isOpen = $state(false);
	let { hamburgerClick } = $props();

	function toggleMenu() {
		isOpen = !isOpen;
		if (hamburgerClick) hamburgerClick(isOpen);
	}
</script>

<button onclick={toggleMenu} class="hamburger" class:open={isOpen}>
	<div class:open={isOpen}></div>
	<div class:open={isOpen}></div>
</button>
