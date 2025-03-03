<script>
	import {
		parseColor,
		getTimestamp,
		setUniforms,
		initWebGL,
		setupWebGLComponent,
		render,
		renderGL
	} from './solWebglUtils';
	import { onMount, onDestroy } from 'svelte';

	const vertexShader = `#version 300 es
    in vec2 position;
    out vec2 vPixelCoord;
    uniform vec2 uResolution;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
        vPixelCoord = (vec2(position.x, -position.y) * 0.5 + 0.5) * uResolution;
    }`;

	const fragmentShader = `#version 300 es
        precision highp float;
        in vec2 vPixelCoord;
        out vec4 fragColor;
        uniform float uTime;
        uniform vec2 uResolution;

        uniform vec4 uColors[16];
        uniform float uPositions[16];
        uniform int uColorCount;

        uniform float uGrainScale;
        uniform float uGrainSpeed;
        uniform float uGrainStr;

        uniform float uWaveType;
        uniform float uWaveScale;
        uniform float uWaveSpeed;

        uniform float uPixelScale;

        vec4 colorRamp(float t) {
            if (uColorCount == 0) return vec4(0.0);
            if (t <= uPositions[0]) return uColors[0];
            for (int i = 1; i < uColorCount; i++) {
                if (t <= uPositions[i]) {
                    return mix(uColors[i-1], uColors[i], 
                        (t - uPositions[i-1]) / (uPositions[i] - uPositions[i-1]));
                }
            }
            return uColors[uColorCount - 1];
        }

        vec3 linearLight(vec3 base, vec3 blend, float factor) {
            vec3 result = base + 2.0 * (blend - 0.5);
            return mix(base, clamp(result, 0.0, 1.0), factor);
        }

        float degToRad(float degrees) {
            return degrees * 0.01745329251994329576923690768489;
        }

        float whiteNoise(vec2 coord, float scale, float seed) {
            float baseScale = 1.7 / scale;
            vec2 scaledCoord = coord * baseScale;
            vec2 blockCoord = floor(scaledCoord);
            vec2 wrappedCoord = vec2(mod(blockCoord.x, 16384.0), mod(blockCoord.y, 16384.0));
            
            vec3 p3 = fract(vec3(wrappedCoord.xyx) * vec3(0.1031, 0.1030, 0.0973));
            p3 += dot(p3, p3.yzx + 33.33);
            return fract((p3.x + p3.y) * p3.z + seed);
        }

        float wave(float x, float scale, float offset, float waveType) {
            float t = fract((x - offset) * scale) * 6.28318;
            if (waveType < 0.5) {
                return cos(t) * 0.5 + 0.5; 
            } else if (waveType < 1.5) {
                return abs(fract(t / 6.28318) * 2.0 - 1.0); 
            } else {
                return fract(t / 6.28318); 
            }
        }

        vec2 rotateCoord(vec2 coord, float angle, vec2 resolution) {
            vec2 center = resolution * 0.5;
            vec2 rotatedCoord = coord - center;
            float cosAngle = cos(angle);
            float sinAngle = sin(angle);
            rotatedCoord = vec2(
                rotatedCoord.x * cosAngle - rotatedCoord.y * sinAngle,
                rotatedCoord.x * sinAngle + rotatedCoord.y * cosAngle
            );
            return rotatedCoord + center;
        }

        vec2 cartesianToPolar(vec2 cartesian, vec2 center) {
            vec2 centered = cartesian - center;
            float r = length(centered) / length(uResolution) * 2.0;
            float theta = atan(centered.y, centered.x);
            return vec2(r, theta);
        }

        void main() {
            vec2 coord = uPixelScale == 1.0 ? floor(vPixelCoord / max(vec2(1.0), floor(uPixelScale))) * max(vec2(1.0), floor(uPixelScale)) + max(vec2(1.0), floor(uPixelScale)) * 0.5 : vPixelCoord;
            
            float normalizedX = cartesianToPolar(coord, uResolution * 0.5).x;
            
            float baseNoise = wave(normalizedX, 50.0 / uWaveScale, uTime * uWaveSpeed * 0.05, uWaveType);
            vec3 grain = vec3(whiteNoise(coord, uGrainScale / 2.0, uTime * uGrainSpeed * 0.02));
            
            fragColor = colorRamp(linearLight(vec3(baseNoise), grain, uGrainStr).r);
        }`;

	let {
		width = 100,
		height = 100,
		colors = [
			{ color: '#ffadd9', position: 0 },
			{ color: '#007061', position: 0.5 },
			{ color: '#000042', position: 1 }
		],
		grainScale = 15,
		grainSpeed = 50,
		grainStr = 0.12,
		waveType = 0,
		waveScale = 100,
		waveSpeed = 2,
		pixelScale = 20,
		dpi = 2,
		fps = 60
	} = $props();

	let canvas;
	let glRenderer = $state(null);

	const uniforms = {
		colors,
		grainScale,
		grainSpeed,
		grainStr,
		waveType,
		waveScale,
		waveSpeed,
		pixelScale,
		dpi
	};

	$effect(() => {
		if (glRenderer && canvas) {
			renderGL(glRenderer, canvas, uniforms);
		}
	});

	onMount(() => {
		glRenderer = setupWebGLComponent({
			canvas,
			vertexShader,
			fragmentShader,
			renderFunction: (gl, contextLost) => render(gl, canvas, contextLost, uniforms),
			fps
		});

		onDestroy(() => {
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
