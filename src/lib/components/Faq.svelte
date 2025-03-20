<script>
	import { slide } from 'svelte/transition';

	const faqs = [
		{
			question: 'Can I use Sol in commercial projects?',
			answer:
				'Yes, you can use Sol in unlimited personal and client projects. For template usage, please contact us.'
		},
		{
			question: 'Do you offer refunds?',
			answer:
				'Due to the digital nature of the product, we cannot offer refunds. Please reach out if you have any issues with your purchase.'
		},
		{
			question: 'How do I get support?',
			answer:
				'We offer priority email support for all customers. Just drop us a line at support@sol.com.'
		},
		{
			question: 'Will there be future updates?',
			answer: 'Yes, all future updates are included in your lifetime license.'
		}
	];

	let activeIndex = $state(-1);

	function toggleFaq(index) {
		activeIndex = activeIndex === index ? -1 : index;
	}
</script>

<div class="faq-container">
	<h1>FAQ</h1>
	<div class="faq-items">
		{#each faqs as faq, i}
			<div class="faq-item">
				<button class="faq-question" class:active={activeIndex === i} on:click={() => toggleFaq(i)}>
					{faq.question}
					<svg width="20" height="20" viewBox="0 0 20 20" class:rotated={activeIndex === i}>
						<path d="M7 10L10 13L13 10" stroke="currentColor" fill="none" stroke-width="1.5" />
					</svg>
				</button>
				{#if activeIndex === i}
					<div class="faq-answer">
						<p>{faq.answer}</p>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
