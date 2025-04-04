<script>
	let { hamburgerClick, isOpen = false } = $props();

	function toggleMenu() {
		isOpen = !isOpen;
		if (hamburgerClick) hamburgerClick(isOpen);
	}
</script>

<button onclick={toggleMenu} class="hamburger" class:open={isOpen} aria-label="Toggle menu">
	<div class:open={isOpen}></div>
	<div class:open={isOpen}></div>
</button>
