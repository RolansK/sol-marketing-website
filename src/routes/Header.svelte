<script>
	import { page } from '$app/stores';
	import ButtonNav from '$lib/components/ButtonNav.svelte';
	import ButtonCta from '$lib/components/ButtonCta.svelte';
	import Hamburger from '$lib/components/Hamburger.svelte';

	import Play from '$lib/icons/play.svelte';
	import PuzzlePiece from '$lib/icons/puzzle-piece.svelte';
	import Star from '$lib/icons/star.svelte';
	import SealQuestion from '$lib/icons/seal-question.svelte';
	import Sparkle from '$lib/icons/sparkle.svelte';

	let { isOpen = false } = $props();

	function toggleMenu() {
		const event = new CustomEvent('togglenav', { detail: !isOpen });
		document.dispatchEvent(event);
	}

	function closeMenu() {
		const event = new CustomEvent('togglenav', { detail: false });
		document.dispatchEvent(event);
	}
</script>

<Hamburger hamburgerClick={toggleMenu} {isOpen} />

<nav class:open={isOpen}>
	<div class="mobile-mask"></div>
	<ButtonNav icon={Play} title="Demo" url="#demo" onclick={closeMenu} />
	<ButtonNav icon={PuzzlePiece} title="Components" url="#components" onclick={closeMenu} />
	<ButtonNav icon={Star} title="Features" url="#features" onclick={closeMenu} />
	<ButtonNav icon={SealQuestion} title="FAQ" url="#faq" onclick={closeMenu} />
	<ButtonCta
		icon={Sparkle}
		title="Get Sol"
		class="bottom"
		url="https://www.framer.com/marketplace/plugins/sol/"
		onclick={closeMenu}
	/>
</nav>
