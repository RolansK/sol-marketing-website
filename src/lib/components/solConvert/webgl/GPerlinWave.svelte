<script>
	import {
		parseColor,
		getTimestamp,
		setUniforms,
		initWebGL,
		setupWebGLComponent
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

    uniform float uNoiseScale;
    uniform float uNoiseSpeed;

    uniform float uWaveScale;
    uniform float uWaveSpeed;
    uniform float uWaveType;

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

    float wave(float x, float scale, float offset, float waveType) {
        float t = (x - offset) * scale * 6.28318;
        if (waveType < 0.5) {
            return cos(t) * 0.5 + 0.5; 
        } else if (waveType < 1.5) {
            return abs(fract(t / 6.28318) * 2.0 - 1.0); 
        } else {
            return fract(t / 6.28318); 
        }
    }

    float white(vec2 coord, float scale, float seed) {
        float baseScale = 1.7 / scale;
        vec2 blockCoord = floor(coord * baseScale);
        vec2 wrappedCoord = vec2(mod(blockCoord.x, 16384.0), mod(blockCoord.y, 16384.0));
        
        vec3 p3 = fract(vec3(wrappedCoord.xyx) * vec3(0.1031, 0.1030, 0.0973));
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z + seed);
    }
    
    vec4 permute(vec4 x) {
        return mod((x * 34.0 + 1.0) * x, 289.0);
    }

    vec4 taylorInvSqrt(vec4 r) {
        return 1.79284291400159 - 0.85373472095314 * r;
    }

    float perlin(vec3 P) {
        vec3 Pi0 = floor(P);
        vec3 Pi1 = Pi0 + vec3(1.0);
        Pi0 = mod(Pi0, 289.0);
        Pi1 = mod(Pi1, 289.0);
        vec3 Pf0 = fract(P);
        vec3 Pf1 = Pf0 - vec3(1.0);
        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
        vec4 iy = vec4(Pi0.yy, Pi1.yy);
        vec4 iz0 = Pi0.zzzz;
        vec4 iz1 = Pi1.zzzz;

        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);

        vec4 gx0 = ixy0 / 7.0;
        vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);

        vec4 gx1 = ixy1 / 7.0;
        vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);

        vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
        vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
        vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
        vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
        vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
        vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
        vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
        vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

        vec4 norm = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
        g000 *= norm.x; g010 *= norm.y; g100 *= norm.z; g110 *= norm.w;
        norm = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
        g001 *= norm.x; g011 *= norm.y; g101 *= norm.z; g111 *= norm.w;

        float n000 = dot(g000, Pf0);
        float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
        float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
        float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
        float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
        float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
        float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
        float n111 = dot(g111, Pf1);

        vec3 fade_xyz = Pf0 * Pf0 * Pf0 * (Pf0 * (Pf0 * 6.0 - 15.0) + 10.0);
        vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
        vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
        float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
        return 2.2 * n_xyz;
    }

    void main() {
    vec2 coord = vPixelCoord;
        
    if (uPixelScale == 1.0) {
        vec2 pixelSize = vec2(max(1.0, floor(uPixelScale)));
        coord = floor(vPixelCoord / pixelSize) * pixelSize + pixelSize * 0.5;
    }

    float grainScale = uGrainScale * 0.5;
    float grainSpeed = uGrainSpeed * 0.02;

    float noiseScale = 0.002 / uNoiseScale;
    float noiseSpeed = uTime * uNoiseSpeed * 0.01;

    float waveScale = 100.0 / uWaveScale;
    float waveSpeed = uTime * uWaveSpeed * 0.1;
    
    float baseNoise = perlin(vec3(coord * noiseScale, noiseSpeed));
    vec3 grain = vec3(white(coord, grainScale, uTime * grainSpeed));

    vec3 waveNoise = vec3(wave(0.5 * waveScale * baseNoise, 1.0, mod(waveSpeed, 1.0), uWaveType));
    
    fragColor = colorRamp(linearLight(waveNoise, grain, uGrainStr).r);
}`;

	let {
		width = 100,
		height = 100,
		colors = [
			{ color: '#fae6e6', position: 0 },
			{ color: '#e03100', position: 0.35 },
			{ color: '#6e008a', position: 0.87 },
			{ color: '#0e0014', position: 1 }
		],
		grainScale = 1,
		grainSpeed = 50,
		grainStr = 0.1,
		noiseScale = 1,
		noiseSpeed = 10,
		waveType = 0,
		waveScale = 40,
		waveSpeed = 0,
		pixelScale = 20,
		dpi = 2
	} = $props();

	let canvas;
	let gl;
	let isContextLost = $state(false);
	const fps = 60;
	let webglComponent;

	function render(gl, contextLost) {
		if (!gl || contextLost) return;

		const uniforms = {
			colors,
			grainScale,
			grainSpeed,
			grainStr,
			noiseScale,
			noiseSpeed,
			waveType,
			waveScale,
			waveSpeed,
			pixelScale,
			dpi
		};

		setUniforms(gl, canvas, uniforms);

		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	}

	$effect(() => {
		if (webglComponent) {
			gl = webglComponent.getGL();
			isContextLost = webglComponent.isContextLost();
			render(gl, isContextLost);
		}
	});

	onMount(() => {
		const uniformNames = [
			'uColors',
			'uPositions',
			'uColorCount',
			'uTime',
			'uResolution',
			'uGrainScale',
			'uGrainSpeed',
			'uGrainStr',
			'uNoiseScale',
			'uNoiseSpeed',
			'uWaveScale',
			'uWaveSpeed',
			'uWaveType',
			'uPixelScale'
		];

		webglComponent = setupWebGLComponent({
			canvas,
			vertexShader,
			fragmentShader,
			uniformNames,
			renderFunction: render,
			fps
		});

		webglComponent.setup();
		gl = webglComponent.getGL();

		onDestroy(() => {
			webglComponent.cleanup();
		});
	});
</script>

{#if isContextLost}
	<div
		style="display: flex; justify-content: center; align-items: center; text-align: center; background: #9595951A; border: 1px solid #95959526; border-radius: 6px; height: 100%; padding: 15px; font-size: 11px; color: #a5a5a5"
	>
		Too many WebGL components. <br />
		Please delete some of them
	</div>
{/if}

<canvas
	bind:this={canvas}
	style="width: {width}px; height: {height}px; display: {!isContextLost ? 'block' : 'none'};"
></canvas>
