import { useState, useRef, useEffect } from 'react';
import { useIsStaticRenderer } from 'framer';
import { degToRad, parseColor } from './solWebglUtils';

const vertexShader = `#version 300 es
    in vec2 position;

    out vec2 vPosition;
    out float vNoiseInfluence;
    out float vCornerRadius;
    out float vSize;

    uniform vec2 uDisplaySize;
    uniform vec2 uGridSize;
    uniform float uTime;

    uniform float uGap;

    uniform vec2 uSize;

    uniform vec2 uRadius;

    uniform float uRowOffset;

    uniform vec2 uRotateX;
    uniform vec2 uRotateY;
    uniform vec2 uRotateZ;

    uniform float uNoiseScale;
    uniform float uNoiseSpeed;
    uniform float uNoiseType;

    vec3 linearLight(vec3 base, vec3 blend, float factor) {
       vec3 result = base + 2.0 * (blend - 0.5);
       return mix(base, clamp(result, 0.0, 1.0), factor);
    }

    float whiteNoise(vec2 coord, float scale, float seed) {
        vec2 scaledCoord = coord * scale;
        vec2 blockCoord = floor(scaledCoord);
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
        int row = gl_InstanceID / int(uGridSize.x);
        int col = gl_InstanceID % int(uGridSize.x);

        float rowOffset = fract(uRowOffset * float(row)) * (uSize.x * 2.0 + uGap);

        vec2 instanceCenter = vec2(
            float(col) * (uSize.x * 2.0 + uGap) + uSize.x + (uDisplaySize.x - (uGridSize.x * uSize.x * 2.0 + (uGridSize.x - 1.0) * uGap)) * 0.5 + rowOffset,
            float(row) * (uSize.x * 2.0 + uGap) + uSize.x + (uDisplaySize.y - (uGridSize.y * uSize.x * 2.0 + (uGridSize.y - 1.0) * uGap)) * 0.5
        );

        float combinedNoise = clamp(perlin(vec3(instanceCenter * (0.01 / uNoiseScale), uTime * uNoiseSpeed * 0.025)), 0.0, 1.0);
        if(uNoiseType == 1.0) {
            combinedNoise = clamp(whiteNoise(instanceCenter, 0.02 / uNoiseScale, uTime * uNoiseSpeed * 0.025), 0.0, 1.0);
        }

        float instanceSize = mix(uSize.x, uSize.y, combinedNoise);

        float rotationX = mix(uRotateX.x, uRotateX.y, combinedNoise);
        float rotationY = mix(uRotateY.x, uRotateY.y, combinedNoise);
        float rotationZ = mix(uRotateZ.x, uRotateZ.y, combinedNoise);

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

        vec2 clipSpace = (rotatedPosition.xy + instanceCenter) / uDisplaySize * 2.0 - 1.0;
        gl_Position = vec4(clipSpace, 0.0, 1.0);

        float radiusA = uRadius.x / 100.0;
        float radiusB = uRadius.y / 100.0;

        float cornerRadius = mix(radiusA, radiusB, combinedNoise);
        
        vPosition = position;
        vNoiseInfluence = combinedNoise;
        vCornerRadius = cornerRadius;
        vSize = mix(uSize.x, uSize.y, combinedNoise);
    }`;

const fragmentShader = `#version 300 es
    precision mediump float;

    uniform vec4 uColorA;
    uniform vec4 uColorB;

    in vec2 vPosition;
    in float vNoiseInfluence;
    in float vCornerRadius;
    in float vSize;

    out vec4 fragColor;

    float squareSDF(vec2 p, float size, float radius) {
        vec2 d = abs(p) - size + radius;
        return length(max(d, 0.0)) - radius;
    }

    void main() {
    vec4 insideColor = mix(uColorA, uColorB, vNoiseInfluence);
    
    float smoothing = 1.0 / vSize;
    float dist = squareSDF(vPosition, 1.0 - smoothing, vCornerRadius * (1.0-smoothing));
    fragColor = mix(insideColor, vec4(0.0), smoothstep(0.0, smoothing, dist));
}`;

const SYNC_GL = 'gl-sync';

export default function Tiles({
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
	noiseType = 0,
	noiseScale = 0.1,
	noiseSpeed = 0
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
		noiseType,
		noiseScale,
		noiseSpeed
	]);

	const getTimestamp = () => (staticRender ? 0 : performance.now() / 1000);

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
			uSize: gl.getUniformLocation(program, 'uSize'),
			uGap: gl.getUniformLocation(program, 'uGap'),
			uRowOffset: gl.getUniformLocation(program, 'uRowOffset'),
			uDisplaySize: gl.getUniformLocation(program, 'uDisplaySize'),
			uRadius: gl.getUniformLocation(program, 'uRadius'),
			uRotateX: gl.getUniformLocation(program, 'uRotateX'),
			uRotateY: gl.getUniformLocation(program, 'uRotateY'),
			uRotateZ: gl.getUniformLocation(program, 'uRotateZ'),
			uColorA: gl.getUniformLocation(program, 'uColorA'),
			uColorB: gl.getUniformLocation(program, 'uColorB'),
			uGridSize: gl.getUniformLocation(program, 'uGridSize'),
			uTime: gl.getUniformLocation(program, 'uTime'),
			uNoiseScale: gl.getUniformLocation(program, 'uNoiseScale'),
			uNoiseSpeed: gl.getUniformLocation(program, 'uNoiseSpeed'),
			uNoiseType: gl.getUniformLocation(program, 'uNoiseType')
		};
		return true;
	};

	const setUniforms = () => {
		if (!canvasRef.current || !glRef.current) return;

		const gl = glRef.current;
		const loc = gl.uniformLocations;
		const { clientWidth, clientHeight } = canvasRef.current;

		const cellSize = state1.size + gap;

		gridSizeRef.current = {
			x: Math.floor(clientWidth / cellSize) * 2,
			y: Math.floor(clientHeight / cellSize) * 2
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
		gl.uniform1f(loc.uTime, getTimestamp());
		gl.uniform1f(loc.uNoiseScale, noiseScale);
		gl.uniform1f(loc.uNoiseSpeed, noiseSpeed);
		gl.uniform1f(loc.uNoiseType, noiseType);
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
			canvas.width = canvas.clientWidth * 2;
			canvas.height = canvas.clientHeight * 2;
			gl.viewport(0, 0, canvas.width, canvas.height);
			setUniforms();
			render();
		});

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
