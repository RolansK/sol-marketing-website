import { useState, useRef, useEffect } from 'react';
import { useIsStaticRenderer } from 'framer';
import { useMotionValue, animate } from 'framer-motion';
import { degToRad, parseColor } from './solWebglUtils';

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

function mapRange(value) {
	const t = (value - 1) / (10 - 1);
	return (1 - t) * 10 + t * 1;
}

const SYNC_GL = 'gl-sync';

export default function DotGrid({
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
}) {
	const canvasRef = useRef(null);
	const glRef = useRef(null);
	const gridSizeRef = useRef({ x: 0, y: 0 });
	const [isContextLost, setIsContextLost] = useState(false);
	const staticRender = useIsStaticRenderer();
	const fps = 60;

	useEffect(() => {
		render();
	}, [
		width,
		height,
		gap,
		offsetToggle,
		offsetPercent,
		offsetRow,
		state1,
		state2,
		hoverArea,
		falloff,
		steepness,
		transition,
		preview,
		magnet,
		magnetSmooth
	]);

	const mouseArea = useMotionValue(0);
	const magnetValue = useMotionValue(0);

	const handleMouseEnter = () => {
		animate(mouseArea, hoverArea, transition);
		animate(magnetValue, magnet, transition);
	};

	const handleMouseLeave = () => {
		animate(mouseArea, 0, transition);
		animate(magnetValue, 0, transition);
	};

	const initWebGL = () => {
		const gl = canvasRef.current?.getContext('webgl2');
		if (!gl) return null;
		glRef.current = gl;
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
	};

	const setUniforms = () => {
		if (!canvasRef.current || !glRef.current) return;

		const gl = glRef.current;
		const loc = gl.uniformLocations;
		const { clientWidth, clientHeight } = canvasRef.current;

		if (
			canvasRef.current.width !== clientWidth * 2 ||
			canvasRef.current.height !== clientHeight * 2
		) {
			canvasRef.current.width = clientWidth * 2;
			canvasRef.current.height = clientHeight * 2;
			gl.viewport(0, 0, clientWidth * 2, clientHeight * 2);
		}

		const magnetFactor = 0.5 + Math.abs(magnet / 4000);
		const cellSize = state1.size + gap;
		gridSizeRef.current = {
			x: Math.floor((magnetFactor * clientWidth) / cellSize) * 2,
			y: Math.floor((magnetFactor * clientHeight) / cellSize) * 2
		};

		const rowOffset = offsetToggle === 'row' ? 1 / offsetRow : offsetPercent / 100;

		gl.uniform2f(loc.uSize, state1.size, state2.size);
		gl.uniform1f(loc.uGap, gap);
		gl.uniform1f(loc.uRowOffset, rowOffset);
		gl.uniform2f(loc.uDisplaySize, clientWidth, clientHeight);
		gl.uniform2f(loc.uGridSize, gridSizeRef.current.x, gridSizeRef.current.y);
		gl.uniform2f(loc.uRadius, state1.radius, state2.radius);
		gl.uniform2f(loc.uRotateX, degToRad(state1.rotX), degToRad(state2.rotX));
		gl.uniform2f(loc.uRotateY, degToRad(state1.rotY), degToRad(state2.rotY));
		gl.uniform2f(loc.uRotateZ, degToRad(state1.rotZ), degToRad(state2.rotZ));
		gl.uniform4fv(loc.uColorA, parseColor(state1.color || '#0000'));
		gl.uniform4fv(loc.uColorB, parseColor(state2.color || '#0000'));
		gl.uniform1f(loc.uFalloff, falloff);
		gl.uniform1f(loc.uSteepness, steepness);

		if (staticRender) {
			const mouseAreaValue = preview === 0 ? hoverArea : 0;
			gl.uniform2f(loc.uMouse, clientWidth / 2, clientHeight / 2);
			gl.uniform1f(loc.uMouseArea, mouseAreaValue);
			gl.uniform2f(loc.uMagnet, magnet, mapRange(magnetSmooth));
		} else {
			gl.uniform1f(loc.uMouseArea, mouseArea.get());
			gl.uniform2f(loc.uMagnet, magnetValue.get(), mapRange(magnetSmooth));
		}
	};

	const render = () => {
		if (!glRef.current || isContextLost) return;

		setUniforms();
		glRef.current.drawArraysInstanced(
			glRef.current.TRIANGLE_FAN,
			0,
			4,
			gridSizeRef.current.x * gridSizeRef.current.y
		);
	};

	useEffect(() => {
		if (!initWebGL()) return;

		const canvas = canvasRef.current;
		const gl = glRef.current;
		const loseContextHandler = gl.loseContextHandler;

		const resizeObserver = new ResizeObserver(() => {
			if (!canvas || !gl) return;
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
			gl.viewport(0, 0, canvas.width, canvas.height);
			render();
		});

		const handleMouseMove = (e) => {
			const rect = canvas.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = rect.bottom - e.clientY;
			gl.uniform2f(gl.uniformLocations.uMouse, x, y);
		};

		const handlePointerDown = (e) => {
			handleMouseEnter();
			handleMouseMove(e);
		};

		const handleContextLost = (e) => {
			e.preventDefault();
			setIsContextLost(true);
		};

		const handleContextRestored = () => {
			setIsContextLost(false);
			initWebGL();
		};

		const handleSync = (e) => {
			if (e.data?.type === SYNC_GL) {
				loseContextHandler?.[e.data.action === 'restore' ? 'restoreContext' : 'loseContext']();
			}
		};

		const eventHandlers = [
			['pointermove', handleMouseMove],
			['pointerdown', handlePointerDown],
			['pointerup', handleMouseLeave],
			['pointercancel', handleMouseLeave],
			['mouseenter', handleMouseEnter],
			['mouseleave', handleMouseLeave],
			['touchstart', handleMouseEnter],
			['touchend', handleMouseLeave],
			['touchcancel', handleMouseLeave],
			['webglcontextlost', handleContextLost],
			['webglcontextrestored', handleContextRestored]
		];

		resizeObserver.observe(canvas);
		eventHandlers.forEach(([event, handler]) => canvas.addEventListener(event, handler));
		window.addEventListener('message', handleSync);

		const timeoutId = setInterval(() => {
			if (!staticRender) render();
		}, 1000 / fps);

		return () => {
			resizeObserver.disconnect();
			eventHandlers.forEach(([event, handler]) => canvas.removeEventListener(event, handler));
			window.removeEventListener('message', handleSync);
			clearInterval(timeoutId);
			gl.loseContextHandler?.loseContext();
			window.postMessage({ type: SYNC_GL, action: 'restore' }, '*');
		};
	}, []);

	return (
		<>
			{isContextLost && (
				<div
					style={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						textAlign: 'center',
						background: '#9595951A',
						border: '1px solid #95959526',
						borderRadius: 6,
						height: '100%',
						padding: 15,
						fontSize: 11,
						color: '#a5a5a5'
					}}
				>
					Too many WebGL components. <br />
					Please delete some of them
				</div>
			)}
			<canvas
				ref={canvasRef}
				style={{
					width: '100%',
					height: '100%',
					display: !isContextLost ? 'block' : 'none'
				}}
			/>
		</>
	);
}
