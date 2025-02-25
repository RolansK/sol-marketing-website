<script>
	import { parseColor, degToRad, getTimestamp, mapRange, setUniforms } from './solWebglUtils';
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

	const SYNC_GL = 'gl-sync';

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
		magnetSmooth = 9
	} = $props();

	let canvas;
	let gl;
	let isContextLost = $state(false);
	const fps = 60;

	let gridSize = { x: 0, y: 0 };
	let mouseArea = 0;
	let magnetValue = 0;
	let mousePosition = { x: 0, y: 0 };

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
			uMouse: gl.getUniformLocation(program, 'uMouse'),
			uSize: gl.getUniformLocation(program, 'uSize'),
			uGap: gl.getUniformLocation(program, 'uGap'),
			uRowOffset: gl.getUniformLocation(program, 'uRowOffset'),
			uDisplaySize: gl.getUniformLocation(program, 'uDisplaySize'),
			uRadius: gl.getUniformLocation(program, 'uRadius'),
			uRotateX: gl.getUniformLocation(program, 'uRotateX'),
			uRotateY: gl.getUniformLocation(program, 'uRotateY'),
			uRotateZ: gl.getUniformLocation(program, 'uRotateZ'),
			uMouseArea: gl.getUniformLocation(program, 'uMouseArea'),
			uColorA: gl.getUniformLocation(program, 'uColorA'),
			uColorB: gl.getUniformLocation(program, 'uColorB'),
			uGridSize: gl.getUniformLocation(program, 'uGridSize'),
			uMagnet: gl.getUniformLocation(program, 'uMagnet'),
			uFalloff: gl.getUniformLocation(program, 'uFalloff'),
			uSteepness: gl.getUniformLocation(program, 'uSteepness')
		};
		return true;
	}

	function render() {
		if (!gl || isContextLost) return;

		const { clientWidth, clientHeight } = canvas;

		if (canvas.width !== clientWidth * 2 || canvas.height !== clientHeight * 2) {
			canvas.width = clientWidth * 2;
			canvas.height = clientHeight * 2;
			gl.viewport(0, 0, clientWidth * 2, clientHeight * 2);
		}

		const magnetFactor = 0.5 + Math.abs(magnet / 4000);
		const cellSize = state1.size + gap;
		gridSize = {
			x: Math.floor((magnetFactor * clientWidth) / cellSize) * 2,
			y: Math.floor((magnetFactor * clientHeight) / cellSize) * 2
		};

		setUniforms(gl, canvas, {
			gap,
			offsetToggle,
			offsetPercent,
			offsetRow,
			state1,
			state2,
			falloff,
			steepness,
			magnetSmooth,
			resizeCanvas: false,
			gridSize,
			mouseArea,
			magnetValue,
			mousePosition
		});

		gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, 4, gridSize.x * gridSize.y);
	}

	$effect(() => {
		render();
	});

	onMount(() => {
		if (!initWebGL()) return;

		const resizeObserver = new ResizeObserver(() => {
			if (!canvas || !gl) return;
			canvas.width = canvas.clientWidth * 2;
			canvas.height = canvas.clientHeight * 2;
			gl.viewport(0, 0, canvas.width, canvas.height);
			render();
		});

		const handleMouseMove = (e) => {
			const rect = canvas.getBoundingClientRect();
			mousePosition = {
				x: e.clientX - rect.left,
				y: rect.bottom - e.clientY
			};
			gl.uniform2f(gl.uniformLocations.uMouse, mousePosition.x, mousePosition.y);
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
		canvas.addEventListener('pointermove', handleMouseMove);
		canvas.addEventListener('pointerdown', handlePointerDown);
		canvas.addEventListener('pointerup', handleMouseLeave);
		canvas.addEventListener('pointercancel', handleMouseLeave);
		canvas.addEventListener('mouseenter', handleMouseEnter);
		canvas.addEventListener('mouseleave', handleMouseLeave);
		canvas.addEventListener('touchstart', handleMouseEnter);
		canvas.addEventListener('touchend', handleMouseLeave);
		canvas.addEventListener('touchcancel', handleMouseLeave);
		canvas.addEventListener('webglcontextlost', handleContextLost);
		canvas.addEventListener('webglcontextrestored', handleContextRestored);
		window.addEventListener('message', handleSync);

		const timeoutId = setInterval(() => {
			render();
		}, 1000 / fps);

		onDestroy(() => {
			resizeObserver.disconnect();
			canvas.removeEventListener('pointermove', handleMouseMove);
			canvas.removeEventListener('pointerdown', handlePointerDown);
			canvas.removeEventListener('pointerup', handleMouseLeave);
			canvas.removeEventListener('pointercancel', handleMouseLeave);
			canvas.removeEventListener('mouseenter', handleMouseEnter);
			canvas.removeEventListener('mouseleave', handleMouseLeave);
			canvas.removeEventListener('touchstart', handleMouseEnter);
			canvas.removeEventListener('touchend', handleMouseLeave);
			canvas.removeEventListener('touchcancel', handleMouseLeave);
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
