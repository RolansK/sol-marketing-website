export function degToRad(degrees) {
	return degrees * (Math.PI / 180);
}

export function initWebGL(canvas, vertexShader, fragmentShader, uniformNames = []) {
	const gl = canvas?.getContext('webgl2');
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

	// Set up uniform locations
	gl.uniformLocations = {};
	uniformNames.forEach((name) => {
		gl.uniformLocations[name] = gl.getUniformLocation(program, name);
	});

	return gl;
}

export function parseColor(color) {
	const div = document.createElement('div');
	div.style.color = color;
	document.body.appendChild(div);
	const [r, g, b, a] = getComputedStyle(div)
		.color.match(/\d+(\.\d+)?/g)
		.map(Number);
	document.body.removeChild(div);
	return [r / 255, g / 255, b / 255, a ?? 1];
}

export function getTimestamp() {
	return performance.now() / 1000;
}

export function mapRange(value, min = 1, max = 10) {
	const t = (value - min) / (max - min);
	return (1 - t) * 10 + t * 1;
}

export function calculateGridSize(canvas, cellSize, magnet = 0) {
	if (!canvas) return { x: 0, y: 0 };

	const { clientWidth, clientHeight } = canvas;
	const magnetFactor = magnet !== 0 ? 0.5 + Math.abs(magnet / 4000) : 1;

	return {
		x: Math.floor((magnetFactor * clientWidth) / cellSize) * 2,
		y: Math.floor((magnetFactor * clientHeight) / cellSize) * 2
	};
}

export function setUniforms(gl, canvas, uniforms = {}) {
	if (!canvas || !gl || !gl.uniformLocations) return;

	const loc = gl.uniformLocations;
	const { clientWidth, clientHeight } = canvas;
	const dpi = uniforms.dpi || 1;

	// Handle canvas resizing
	if (uniforms.resizeCanvas !== false) {
		const [targetWidth, targetHeight] = [clientWidth * dpi, clientHeight * dpi];
		if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
			[canvas.width, canvas.height] = [targetWidth, targetHeight];
			gl.viewport(0, 0, targetWidth, targetHeight);
		}
	}

	// Unified uniform setter with safety checks
	const set = {
		float: (name, value) => value != null && gl.uniform1f(loc[name], value),
		int: (name, value) => value != null && gl.uniform1i(loc[name], value),
		vec2: (name, x, y) => gl.uniform2f(loc[name], x, y),
		vec4: (name, values) => gl.uniform4fv(loc[name], values)
	};

	// Core uniforms
	set.vec2('uResolution', canvas.width, canvas.height);
	set.float('uTime', getTimestamp());
	set.vec2('uDisplaySize', clientWidth, clientHeight);

	// Grid size calculation
	if (loc.uGridSize && uniforms.state1 && uniforms.gap !== undefined) {
		const cellSize = uniforms.state1.size + uniforms.gap;
		const magnet = uniforms.magnetValue ?? 0;
		uniforms.gridSize = calculateGridSize(canvas, cellSize, magnet);
		set.vec2('uGridSize', ...Object.values(uniforms.gridSize));
	}

	// Color gradient uniforms
	if (loc.uColors && loc.uPositions && loc.uColorCount && uniforms.colors) {
		const sortedColors = [...uniforms.colors].sort((a, b) => a.position - b.position);
		const colorValues = sortedColors.flatMap((c) => parseColor(c.color));
		const positions = sortedColors.map((c) => c.position);

		set.vec4('uColors', colorValues);
		gl.uniform1fv(loc.uPositions, new Float32Array(positions));
		set.int('uColorCount', sortedColors.length);
	}

	// Batch set simple float uniforms
	[
		['uGrainScale', 'grainScale'],
		['uGrainSpeed', 'grainSpeed'],
		['uGrainStr', 'grainStr'],
		['uWaveType', 'waveType'],
		['uWaveScale', 'waveScale'],
		['uWaveSpeed', 'waveSpeed'],
		['uWaveAngle', 'waveAngle'],
		['uNoiseScale', 'noiseScale'],
		['uNoiseSpeed', 'noiseSpeed'],
		['uNoiseType', 'noiseType'],
		['uFalloff', 'falloff'],
		['uSteepness', 'steepness'],
		['uMouseArea', 'mouseArea'],
		['uGap', 'gap'],
		['uPixelScale', 'pixelScale']
	].forEach(([u, p]) => set.float(u, uniforms[p]));

	// State properties
	if (uniforms.state1 && uniforms.state2) {
		['Size', 'Radius'].forEach((prop) =>
			set.vec2(`u${prop}`, uniforms.state1[prop.toLowerCase()], uniforms.state2[prop.toLowerCase()])
		);
		['X', 'Y', 'Z'].forEach((axis) =>
			set.vec2(
				`uRotate${axis}`,
				degToRad(uniforms.state1[`rot${axis}`]),
				degToRad(uniforms.state2[`rot${axis}`])
			)
		);
	}

	// Color states
	uniforms.state1 && set.vec4('uColorA', parseColor(uniforms.state1.color || '#0000'));
	uniforms.state2 && set.vec4('uColorB', parseColor(uniforms.state2.color || '#0000'));

	// DotGrid specific
	if (loc.uRowOffset && uniforms.offsetToggle !== undefined) {
		const rowOffset =
			uniforms.offsetToggle === 'row' ? 1 / uniforms.offsetRow : uniforms.offsetPercent / 100;
		set.float('uRowOffset', rowOffset);
	}

	// Interaction uniforms
	uniforms.magnetValue != null &&
		set.vec2('uMagnet', uniforms.magnetValue, mapRange(uniforms.magnetSmooth));
	uniforms.mousePosition && set.vec2('uMouse', ...Object.values(uniforms.mousePosition));

	// Custom uniforms handling
	uniforms.customUniforms &&
		Object.entries(uniforms.customUniforms).forEach(([name, value]) => {
			if (!loc[name]) return;
			if (Array.isArray(value)) {
				[, , , gl.uniform3f, gl.uniform4f][value.length - 2]?.(loc[name], ...value);
			} else if (typeof value === 'number') {
				set.float(name, value);
			} else if (typeof value === 'boolean') {
				set.int(name, value ? 1 : 0);
			}
		});
}
