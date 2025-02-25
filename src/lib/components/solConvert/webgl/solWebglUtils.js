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

	// Resize canvas if needed
	if (uniforms.resizeCanvas !== false) {
		const targetWidth = clientWidth * dpi;
		const targetHeight = clientHeight * dpi;

		if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
			canvas.width = targetWidth;
			canvas.height = targetHeight;
			gl.viewport(0, 0, targetWidth, targetHeight);
		}
	}

	// Helper functions for common uniform types
	const set = {
		float: (name, value) => value !== undefined && loc[name] && gl.uniform1f(loc[name], value),
		int: (name, value) => value !== undefined && loc[name] && gl.uniform1i(loc[name], value),
		vec2: (name, x, y) => loc[name] && gl.uniform2f(loc[name], x, y),
		vec4: (name, values) => loc[name] && gl.uniform4fv(loc[name], values)
	};

	// Set basic uniforms
	set.vec2('uResolution', canvas.width, canvas.height);
	set.float('uTime', getTimestamp());
	set.vec2('uDisplaySize', clientWidth, clientHeight);

	// Calculate and set grid size
	if (loc.uGridSize && uniforms.state1 && uniforms.gap !== undefined) {
		const cellSize = uniforms.state1.size + uniforms.gap;
		const magnet = uniforms.magnetValue !== undefined ? uniforms.magnet : 0;
		uniforms.gridSize = calculateGridSize(canvas, cellSize, magnet);
		set.vec2('uGridSize', uniforms.gridSize.x, uniforms.gridSize.y);
	}

	// Set color uniforms
	if (loc.uColors && uniforms.colors && loc.uPositions && loc.uColorCount) {
		const sortedColors = [...uniforms.colors].sort((a, b) => a.position - b.position);
		const colorValues = sortedColors.map((c) => parseColor(c.color)).flat();
		const positions = sortedColors.map((c) => c.position);

		gl.uniform4fv(loc.uColors, new Float32Array(colorValues));
		gl.uniform1fv(loc.uPositions, new Float32Array(positions));
		gl.uniform1i(loc.uColorCount, sortedColors.length);
	}

	// Set simple property uniforms
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
	].forEach(([uniform, prop]) => set.float(uniform, uniforms[prop]));

	// Set state properties (for Tiles component)
	if (uniforms.state1 && uniforms.state2) {
		set.vec2('uSize', uniforms.state1.size, uniforms.state2.size);
		set.vec2('uRadius', uniforms.state1.radius, uniforms.state2.radius);
		set.vec2('uRotateX', degToRad(uniforms.state1.rotX), degToRad(uniforms.state2.rotX));
		set.vec2('uRotateY', degToRad(uniforms.state1.rotY), degToRad(uniforms.state2.rotY));
		set.vec2('uRotateZ', degToRad(uniforms.state1.rotZ), degToRad(uniforms.state2.rotZ));
	}

	// Set color state uniforms
	uniforms.state1 && set.vec4('uColorA', parseColor(uniforms.state1.color || '#0000'));
	uniforms.state2 && set.vec4('uColorB', parseColor(uniforms.state2.color || '#0000'));

	// Set DotGrid specific uniforms
	if (loc.uRowOffset && uniforms.offsetToggle !== undefined) {
		const rowOffset =
			uniforms.offsetToggle === 'row' ? 1 / uniforms.offsetRow : uniforms.offsetPercent / 100;
		set.float('uRowOffset', rowOffset);
	}

	// Set grid size uniform if already calculated
	uniforms.gridSize && set.vec2('uGridSize', uniforms.gridSize.x, uniforms.gridSize.y);

	// Set magnet and mouse position uniforms
	uniforms.magnetValue !== undefined &&
		set.vec2('uMagnet', uniforms.magnetValue, mapRange(uniforms.magnetSmooth));
	uniforms.mousePosition && set.vec2('uMouse', uniforms.mousePosition.x, uniforms.mousePosition.y);

	// Handle custom uniforms
	if (uniforms.customUniforms) {
		Object.entries(uniforms.customUniforms).forEach(([name, value]) => {
			if (!loc[name]) return;

			if (Array.isArray(value)) {
				switch (value.length) {
					case 2:
						set.vec2(name, value[0], value[1]);
						break;
					case 3:
						loc[name] && gl.uniform3f(loc[name], value[0], value[1], value[2]);
						break;
					case 4:
						loc[name] && gl.uniform4f(loc[name], value[0], value[1], value[2], value[3]);
						break;
				}
			} else if (typeof value === 'number') {
				set.float(name, value);
			} else if (typeof value === 'boolean') {
				set.int(name, value ? 1 : 0);
			}
		});
	}
}
