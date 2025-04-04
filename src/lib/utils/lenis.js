import Lenis from 'lenis';

export function initLenis() {
	const lenis = new Lenis({
		duration: 2,
		easing: (t) => Math.min(1, 1.001 - Math.pow(2, -12 * t)),
		normalizeWheel: true,
		smoothTouch: false,
		autoResize: true
	});

	window.lenis = lenis;

	function raf(time) {
		lenis.raf(time);
		requestAnimationFrame(raf);
	}

	requestAnimationFrame(raf);
}
