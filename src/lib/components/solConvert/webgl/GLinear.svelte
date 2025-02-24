<script>
	import { parseColor, getTimestamp } from './solWebglUtils';
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
        uniform float uWaveAngle;

        uniform bool uPixelate;
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

        void main() {
            vec2 coord = uPixelate ? floor(vPixelCoord / max(vec2(1.0), floor(uPixelScale))) * max(vec2(1.0), floor(uPixelScale)) + max(vec2(1.0), floor(uPixelScale)) * 0.5 : vPixelCoord;

            float rotationAngle = degToRad(uWaveAngle);
            float newWidth = abs(uResolution.x * cos(rotationAngle)) + abs(uResolution.y * sin(rotationAngle));

            float normalizedX = (rotateCoord(coord, rotationAngle, uResolution).x - uResolution.x * 0.5) / newWidth + 0.5;

            float baseNoise = wave(normalizedX, 50.0 / uWaveScale, uTime * uWaveSpeed * 0.05, uWaveType);
            vec3 grain = vec3(whiteNoise(coord, uGrainScale / 2.0, uTime * uGrainSpeed * 0.02));

            fragColor = colorRamp(linearLight(vec3(baseNoise), grain, uGrainStr).r);
        }`;

	const SYNC_GL = 'gl-sync';

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
		waveAngle = 0,
		pixelate = 0,
		pixelScale = 20
	} = $props();

	let canvas;
	let gl;
	let isContextLost = $state(false);
	const fps = 60;

	function initWebGL() {
		gl = canvas?.getContext('webgl2');
		if (!gl) return null;
		gl.loseContextHandler = gl.getExtension('WEBGL_lose_context');
		const program = gl.createProgram();
		[gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].forEach((type, i) => {
			const shader = gl.createShader(type);
			gl.shaderSource(shader, i === 0 ? vertexShader : fragmentShader);
			gl.compileShader(shader);
			gl.attachShader(program, shader);
		});
		gl.linkProgram(program);
		gl.useProgram(program);

		const vertices = new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]);
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

		const position = gl.getAttribLocation(program, 'position');
		gl.enableVertexAttribArray(position);
		gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.uniformLocations = {
			uColors: gl.getUniformLocation(program, 'uColors'),
			uPositions: gl.getUniformLocation(program, 'uPositions'),
			uColorCount: gl.getUniformLocation(program, 'uColorCount'),
			uTime: gl.getUniformLocation(program, 'uTime'),
			uResolution: gl.getUniformLocation(program, 'uResolution'),
			uGrainScale: gl.getUniformLocation(program, 'uGrainScale'),
			uGrainSpeed: gl.getUniformLocation(program, 'uGrainSpeed'),
			uGrainStr: gl.getUniformLocation(program, 'uGrainStr'),
			uWaveType: gl.getUniformLocation(program, 'uWaveType'),
			uWaveScale: gl.getUniformLocation(program, 'uWaveScale'),
			uWaveSpeed: gl.getUniformLocation(program, 'uWaveSpeed'),
			uWaveAngle: gl.getUniformLocation(program, 'uWaveAngle'),
			uPixelate: gl.getUniformLocation(program, 'uPixelate'),
			uPixelScale: gl.getUniformLocation(program, 'uPixelScale')
		};
		return true;
	}

	function setUniforms() {
		if (!canvas || !gl) return;

		const loc = gl.uniformLocations;
		const { width: canvasWidth, height: canvasHeight } = canvas;

		const sortedColors = [...colors].sort((a, b) => a.position - b.position);
		const colorValues = sortedColors.map((c) => parseColor(c.color)).flat();
		const positions = sortedColors.map((c) => c.position);

		gl.uniform4fv(loc.uColors, new Float32Array(colorValues));
		gl.uniform1fv(loc.uPositions, new Float32Array(positions));
		gl.uniform1i(loc.uColorCount, sortedColors.length);
		gl.uniform1f(loc.uTime, getTimestamp());
		gl.uniform2f(loc.uResolution, canvasWidth, canvasHeight);
		gl.uniform1f(loc.uGrainScale, grainScale);
		gl.uniform1f(loc.uGrainSpeed, grainSpeed);
		gl.uniform1f(loc.uGrainStr, grainStr);
		gl.uniform1f(loc.uWaveType, waveType);
		gl.uniform1f(loc.uWaveScale, waveScale);
		gl.uniform1f(loc.uWaveSpeed, waveSpeed);
		gl.uniform1f(loc.uWaveAngle, waveAngle);
		gl.uniform1i(loc.uPixelate, pixelate);
		gl.uniform1f(loc.uPixelScale, pixelScale);
	}

	function render() {
		if (!gl || isContextLost) return;

		setUniforms();
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	}

	$effect(() => {
		render();
	});

	onMount(() => {
		if (!initWebGL()) return;

		const resizeObserver = new ResizeObserver(() => {
			if (!canvas || !gl) return;
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
			gl.viewport(0, 0, canvas.width, canvas.height);
			render();
		});

		const handleContextLost = (e) => {
			e.preventDefault();
			isContextLost = true;
		};

		const handleContextRestored = () => {
			isContextLost = false;
			initWebGL();
		};

		const handleSync = (e) => {
			if (e.data?.type === SYNC_GL) {
				gl.loseContextHandler?.[e.data.action === 'restore' ? 'restoreContext' : 'loseContext']();
			}
		};

		resizeObserver.observe(canvas);
		canvas.addEventListener('webglcontextlost', handleContextLost);
		canvas.addEventListener('webglcontextrestored', handleContextRestored);
		window.addEventListener('message', handleSync);

		const timeoutId = setInterval(() => {
			render();
		}, 1000 / fps);

		onDestroy(() => {
			resizeObserver.disconnect();
			canvas.removeEventListener('webglcontextlost', handleContextLost);
			canvas.removeEventListener('webglcontextrestored', handleContextRestored);
			window.removeEventListener('message', handleSync);
			clearInterval(timeoutId);
			gl?.loseContextHandler?.loseContext();
			window.postMessage({ type: SYNC_GL, action: 'restore' }, '*');
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
	style="width: 100%; height: 100%; display: {!isContextLost ? 'block' : 'none'};"
></canvas>
