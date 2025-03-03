<script>
	import {
		parseColor,
		degToRad,
		getTimestamp,
		mapRange,
		setUniforms,
		initWebGL,
		setupWebGLComponent,
		render,
		renderGL
	} from './solWebglUtils';
	import { onMount, onDestroy } from 'svelte';

	const vertexShader = `#version 300 es
    in vec2 position;

    out vec2 vPosition;
    out float vMouseInfluence;
    out float vCornerRadius;
    out float vSize;

    uniform vec2 uDisplaySize;
    uniform vec2 uGridSize;
    uniform vec2 uMouse;

    uniform float uGap;

    uniform vec2 uSize;

    uniform float uMouseArea;

    uniform vec2 uRadius;

    uniform float uRowOffset;

    uniform vec2 uRotateX;
    uniform vec2 uRotateY;
    uniform vec2 uRotateZ;

    uniform vec2 uMagnet;

    uniform float uFalloff;
    uniform float uSteepness;

    float easeInFalloff(float t, float steepness) {
        return clamp(pow(t, steepness), 0.0, 1.0);
    }

    float easeOutFalloff(float t, float steepness) {
        return 1.0 - pow(1.0 - t, steepness);
    }

    float easeInOutFalloff(float t, float steepness) {
        return t < 0.5 ? pow(2.0 * t, steepness) / 2.0 : 1.0 - pow(-2.0 * t + 2.0, steepness) / 2.0;
    }

    void main() {
        int row = gl_InstanceID / int(uGridSize.x);
        int col = gl_InstanceID % int(uGridSize.x);

        float rowOffset = fract(uRowOffset * float(row)) * (uSize.x * 2.0 + uGap);
        float mouseArea = max(0.0, uMouseArea);

        vec2 instanceCenter = vec2(
            float(col) * (uSize.x * 2.0 + uGap) + uSize.x + (uDisplaySize.x - (uGridSize.x * uSize.x * 2.0 + (uGridSize.x - 1.0) * uGap)) * 0.5 + rowOffset,
            float(row) * (uSize.x * 2.0 + uGap) + uSize.x + (uDisplaySize.y - (uGridSize.y * uSize.x * 2.0 + (uGridSize.y - 1.0) * uGap)) * 0.5
        );

        float mouseDist = length(uMouse - instanceCenter);
        float mouseInfluence = clamp(1.0 - mouseDist / mouseArea, 0.0, 1.0);

        if (uFalloff == 0.0) {
            mouseInfluence = clamp(1.0 - mouseDist / mouseArea, 0.0, 1.0);
        } else if (uFalloff == 1.0) {
            mouseInfluence = clamp(easeInFalloff(mouseInfluence, uSteepness), 0.0, 1.0);
        } else if (uFalloff == 2.0) {
            mouseInfluence = clamp(easeOutFalloff(mouseInfluence, uSteepness), 0.0, 1.0);
        } else if (uFalloff == 3.0) {
            mouseInfluence = clamp(easeInOutFalloff(mouseInfluence, uSteepness), 0.0, 1.0);
        }

        float attractionForce = mouseInfluence * (1.0 - exp(-pow(uMagnet.y, 2.0) * mouseDist / mouseArea)) * uMagnet.x;
        vec2 directionToMouse = normalize(uMouse - instanceCenter);
        vec2 attractedCenter = instanceCenter + directionToMouse * attractionForce;

        float instanceSize = mix(uSize.x, uSize.y, mouseInfluence);

        float rotationX = mix(uRotateX.x, uRotateX.y, mouseInfluence);
        float rotationY = mix(uRotateY.x, uRotateY.y, mouseInfluence);
        float rotationZ = mix(uRotateZ.x, uRotateZ.y, mouseInfluence);

        mat4 rotationMatrix = mat4(
            cos(rotationY) * cos(rotationZ), 
            cos(rotationY) * sin(rotationZ), 
            -sin(rotationY), 
            0.0,
            sin(rotationX) * sin(rotationY) * cos(rotationZ) - cos(rotationX) * sin(rotationZ),
            sin(rotationX) * sin(rotationY) * sin(rotationZ) + cos(rotationX) * cos(rotationZ),
            sin(rotationX) * cos(rotationY),
            0.0,
            cos(rotationX) * sin(rotationY) * cos(rotationZ) + sin(rotationX) * sin(rotationZ),
            cos(rotationX) * sin(rotationY) * sin(rotationZ) - sin(rotationX) * cos(rotationZ),
            cos(rotationX) * cos(rotationY),
            0.0,
            0.0, 0.0, 0.0, 1.0
        );

        vec4 rotatedPosition = rotationMatrix * vec4(position * instanceSize, 0.0, 1.0);

        vec2 clipSpace = (rotatedPosition.xy + attractedCenter) / uDisplaySize * 2.0 - 1.0;
        gl_Position = vec4(clipSpace, 0.0, 1.0);

        float radiusA = uRadius.x / 100.0;
        float radiusB = uRadius.y / 100.0;

        float cornerRadius = mix(radiusA, radiusB, mouseInfluence);
        
        vPosition = position;
        vMouseInfluence = mouseInfluence;
        vCornerRadius = cornerRadius;
        vSize = mix(uSize.x, uSize.y, mouseInfluence);
    }`;

	const fragmentShader = `#version 300 es
    precision mediump float;

    uniform vec4 uColorA;
    uniform vec4 uColorB;

    in vec2 vPosition;
    in float vMouseInfluence;
    in float vCornerRadius;
    in float vSize;

    out vec4 fragColor;

    float squareSDF(vec2 p, float size, float radius) {
        vec2 d = abs(p) - size + radius;
        return length(max(d, 0.0)) - radius;
    }

    void main() {
    vec4 insideColor = mix(uColorA, uColorB, vMouseInfluence);
    
    float smoothing = 1.0 / vSize;
    float dist = squareSDF(vPosition, 1.0 - smoothing, vCornerRadius * (1.0-smoothing));
    fragColor = mix(insideColor, vec4(0.0), smoothstep(0.0, smoothing, dist));
}`;

	let {
		width = 100,
		height = 100,
		gap = 3.5,
		offsetToggle = 'row',
		offsetPercent = 0,
		offsetRow = 2,
		state1 = {
			color: '#ffab94',
			size: 1.75,
			radius: 100,
			rotX: 0,
			rotY: 0,
			rotZ: 0
		},
		state2 = {
			color: '#de24ad',
			size: 3,
			radius: 100,
			rotX: 0,
			rotY: 0,
			rotZ: 0
		},
		hoverArea = 120,
		falloff = 3,
		steepness = 2,
		transition = { type: 'spring', stiffness: 300, damping: 30 },
		preview = 0,
		magnet = 10,
		magnetSmooth = 9,
		dpi = 2
	} = $props();

	let canvas;
	let glRenderer = $state(null);
	const fps = 60;
	let gridSize = { x: 0, y: 0 };
	let mouseArea = 0;
	let magnetValue = 0;
	let mousePosition = { x: 0, y: 0 };

	const uniforms = $state({
		gap,
		offsetToggle,
		offsetPercent,
		offsetRow,
		state1,
		state2,
		falloff,
		steepness,
		magnetSmooth,
		mouseArea: 0,
		magnetValue: 0,
		mousePosition: { x: 0, y: 0 },
		dpi,
		magnet
	});

	$effect(() => {
		if (glRenderer && canvas) {
			uniforms.mouseArea = mouseArea;
			uniforms.magnetValue = magnetValue;
			uniforms.mousePosition = mousePosition;

			gridSize = renderGL(glRenderer, canvas, uniforms) || gridSize;
		}
	});

	onMount(() => {
		glRenderer = setupWebGLComponent({
			canvas,
			vertexShader,
			fragmentShader,
			renderFunction: (gl, contextLost) => {
				uniforms.mouseArea = mouseArea;
				uniforms.magnetValue = magnetValue;
				uniforms.mousePosition = mousePosition;

				gridSize = render(gl, canvas, contextLost, uniforms) || gridSize;
			},
			fps
		});

		const handleMouseMove = (e) => {
			const rect = canvas.getBoundingClientRect();
			mousePosition = {
				x: e.clientX - rect.left,
				y: rect.bottom - e.clientY
			};
		};

		const handleMouseEnter = () => {
			mouseArea = hoverArea;
			magnetValue = magnet;
		};

		const handleMouseLeave = () => {
			mouseArea = 0;
			magnetValue = 0;
		};

		const handlePointerDown = (e) => {
			handleMouseEnter();
			handleMouseMove(e);
		};

		canvas.addEventListener('pointermove', handleMouseMove);
		canvas.addEventListener('pointerdown', handlePointerDown);
		canvas.addEventListener('pointerup', handleMouseLeave);
		canvas.addEventListener('pointercancel', handleMouseLeave);
		canvas.addEventListener('mouseenter', handleMouseEnter);
		canvas.addEventListener('mouseleave', handleMouseLeave);
		canvas.addEventListener('touchstart', handleMouseEnter);
		canvas.addEventListener('touchend', handleMouseLeave);
		canvas.addEventListener('touchcancel', handleMouseLeave);

		onDestroy(() => {
			canvas.removeEventListener('pointermove', handleMouseMove);
			canvas.removeEventListener('pointerdown', handlePointerDown);
			canvas.removeEventListener('pointerup', handleMouseLeave);
			canvas.removeEventListener('pointercancel', handleMouseLeave);
			canvas.removeEventListener('mouseenter', handleMouseEnter);
			canvas.removeEventListener('mouseleave', handleMouseLeave);
			canvas.removeEventListener('touchstart', handleMouseEnter);
			canvas.removeEventListener('touchend', handleMouseLeave);
			canvas.removeEventListener('touchcancel', handleMouseLeave);
			glRenderer?.cleanup();
		});
	});
</script>

{#if glRenderer?.isContextLost()}
	<div
		style="display: flex; justify-content: center; align-items: center; text-align: center; background: #9595951A; border: 1px solid #95959526; border-radius: 6px; height: 100%; padding: 15px; font-size: 11px; color: #a5a5a5"
	>
		Too many WebGL components. <br />
		Please delete some of them
	</div>
{/if}

<canvas
	bind:this={canvas}
	style="width: {width}px; height: {height}px; display: {!glRenderer?.isContextLost()
		? 'block'
		: 'none'};"
></canvas>
