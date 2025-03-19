import { useEffect, useState, useRef } from 'react';
import { addPropertyControls, ControlType } from 'framer';
import { motion } from 'framer-motion';

export function SliderFixed1(props) {
	const [active, setActive] = useState(0);
	const [containerWidth, setContainerWidth] = useState(0);
	const containerRef = useRef(null);

	useEffect(() => {
		const measure = () => {
			if (!containerRef.current) return;
			setContainerWidth(containerRef.current.offsetWidth);
		};

		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(containerRef.current);

		return () => observer.disconnect();
	}, []);

	const activeWidth = Math.min(props.maxWidth, containerWidth - props.padding * 2);
	const inactiveWidth = activeWidth * 0.8;
	const gap = activeWidth * props.gap;
	const alignmentOffset = (containerWidth - props.itemWidth) / 2;

	const getPosition = (i) => ({
		left: i * (inactiveWidth + gap),
		top: '50%',
		transform: `translate(${
			-(active * (inactiveWidth + gap)) + alignmentOffset
		}px, ${'-50%'}) scale(${
			active === i ? activeWidth / props.itemWidth : inactiveWidth / props.itemWidth
		})`
	});

	return (
		<div
			ref={containerRef}
			style={{
				overflow: 'hidden'
			}}
		>
			{props.components.map((component, i) => (
				<motion.div
					key={i}
					style={{
						position: 'absolute',
						backgroundColor: '#fff',
						padding: 8,
						borderRadius: 6,
						boxShadow: '0px 0px 1px rgba(0, 0, 0, 0.05), 0px 8px 16px rgba(0, 0, 0, 0.1)',
						...getPosition(i)
					}}
					animate={getPosition(i)}
					transition={props.transition}
				>
					{component}
				</motion.div>
			))}
			<div
				style={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: `translate(-50%, calc(${activeWidth / 2 + 32}px))`,
					display: 'flex',
					gap: '16px'
				}}
			>
				{props.components.map((_, i) => (
					<motion.div
						key={i}
						onPointerEnter={() => setActive(i)}
						style={{
							width: '40px',
							height: '40px',
							borderRadius: '50%',
							background:
								active === i
									? `linear-gradient(to bottom, ${props.color1}, ${props.color2})`
									: 'linear-gradient(to bottom, #fff, #fff)',
							cursor: 'pointer',
							display: 'flex',
							paddingBottom: 1,
							alignItems: 'center',
							justifyContent: 'center',
							color: active === i ? '#fff' : '#000',
							fontFamily: props.font.fontFamily,
							fontSize: 18,
							fontWeight: props.font.fontWeight
						}}
						whileHover={{
							background: `linear-gradient(to bottom, ${props.color1}, ${props.color2})`,
							color: '#fff'
						}}
						transition={props.transition2}
					>
						{i + 1}
					</motion.div>
				))}
			</div>
		</div>
	);
}

addPropertyControls(SliderFixed1, {
	itemWidth: {
		type: ControlType.Number,
		title: 'Item Width',
		defaultValue: 240,
		min: 100,
		max: 1000,
		step: 1
	},
	font: {
		type: ControlType.Font,
		title: 'Font',
		controls: 'expanded',
		defaultValue: {
			family: 'Inter',
			fontWeight: 'regular'
		}
	},
	components: {
		type: ControlType.Array,
		title: 'Items',
		propertyControl: { type: ControlType.ComponentInstance }
	},
	transition: {
		type: ControlType.Transition,
		title: 'Transition'
	},
	transition2: {
		type: ControlType.Transition,
		title: 'Button transition'
	},
	gap: {
		type: ControlType.Number,
		title: 'Gap',
		defaultValue: 0.25,
		step: 0.05
	},
	padding: {
		type: ControlType.Number,
		title: 'Padding'
	},
	maxWidth: {
		type: ControlType.Number,
		title: 'Max width'
	},
	color1: {
		type: ControlType.Color,
		title: 'Color 1',
		defaultValue: '#000'
	},
	color2: {
		type: ControlType.Color,
		title: 'Color 2',
		defaultValue: '#000'
	}
});
