<script>
	import Plus from '$lib/icons/plus.svelte';
	import { slide } from 'svelte/transition';

	const faqs = [
		{
			question: 'How do I request a feature?',
			answer: 'Use the contact form in the plugin settings or simply email us.'
		},
		{
			question: 'How do I report a bug?',
			answer:
				'Same as requesting a feature - use the contact form in the plugin settings or simply email us.'
		},
		{
			question: 'How fast do you reply to emails?',
			answer: 'Typically, within 48 hours or less.'
		},
		{
			question: 'Can I use Sol in my Framer template?',
			answer:
				'If you are planning to use it in templates, please email us. Use in templates without our permission is not allowed.'
		},
		{
			question: 'Are animations gifs or videos?',
			answer:
				'Neither, actually! Everything is a code snippet that browser renders real-time. In practice, it means super tiny size and fast performance.'
		},
		{
			question: 'Can I get notified about updates?',
			answer:
				'Yes! We will let you know via email once a new update is out. You can also check our X/Twitter account.'
		}
	];

	let activeIndex = $state(-1);

	function toggleFaq(index) {
		activeIndex = activeIndex === index ? -1 : index;
	}
</script>

<div class="faq-container">
	<h1>FAQ</h1>
	{#each faqs as faq, i}
		<div class="faq-item">
			<button class="faq-question" class:active={activeIndex === i} on:click={() => toggleFaq(i)}>
				<Plus />
				{faq.question}
			</button>
			{#if activeIndex === i}
				<div class="faq-answer">
					<p>{faq.answer}</p>
				</div>
			{/if}
		</div>
	{/each}
</div>
