export function degToRad(degrees) {
	return degrees * (Math.PI / 180);
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

export function setUniforms(gl, canvas, uniforms = {}) {
	if (!canvas || !gl || !gl.uniformLocations) return;

	const loc = gl.uniformLocations;
	const { clientWidth, clientHeight } = canvas;
	const dpi = uniforms.dpi || 1;

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
	const setters = {
		float: (name, value) => value !== undefined && gl.uniform1f(loc[name], value),
		int: (name, value) => value !== undefined && gl.uniform1i(loc[name], value),
		vec2: (name, x, y) => gl.uniform2f(loc[name], x, y),
		vec4: (name, values) => gl.uniform4fv(loc[name], values)
	};

	// Basic uniforms
	setters.vec2('uResolution', canvas.width, canvas.height);
	setters.float('uTime', getTimestamp());
	setters.vec2('uDisplaySize', clientWidth, clientHeight);

	// Color uniforms
	if (loc.uColors && uniforms.colors && loc.uPositions && loc.uColorCount) {
		const sortedColors = [...uniforms.colors].sort((a, b) => a.position - b.position);
		const colorValues = sortedColors.map((c) => parseColor(c.color)).flat();
		const positions = sortedColors.map((c) => c.position);

		gl.uniform4fv(loc.uColors, new Float32Array(colorValues));
		gl.uniform1fv(loc.uPositions, new Float32Array(positions));
		gl.uniform1i(loc.uColorCount, sortedColors.length);
	}

	// Simple property uniforms
	const simpleProps = [
		{ uniform: 'uGrainScale', prop: 'grainScale' },
		{ uniform: 'uGrainSpeed', prop: 'grainSpeed' },
		{ uniform: 'uGrainStr', prop: 'grainStr' },
		{ uniform: 'uWaveType', prop: 'waveType' },
		{ uniform: 'uWaveScale', prop: 'waveScale' },
		{ uniform: 'uWaveSpeed', prop: 'waveSpeed' },
		{ uniform: 'uWaveAngle', prop: 'waveAngle' },
		{ uniform: 'uNoiseScale', prop: 'noiseScale' },
		{ uniform: 'uNoiseSpeed', prop: 'noiseSpeed' },
		{ uniform: 'uNoiseType', prop: 'noiseType' },
		{ uniform: 'uFalloff', prop: 'falloff' },
		{ uniform: 'uSteepness', prop: 'steepness' },
		{ uniform: 'uMouseArea', prop: 'mouseArea' },
		{ uniform: 'uGap', prop: 'gap' }
	];

	simpleProps.forEach(({ uniform, prop }) => {
		if (loc[uniform]) setters.float(uniform, uniforms[prop]);
	});

	// Pixelation
	if (loc.uPixelate) setters.int('uPixelate', uniforms.pixelate);
	if (loc.uPixelScale) setters.float('uPixelScale', uniforms.pixelScale);

	// State properties (for Tiles component)
	if (uniforms.state1 && uniforms.state2) {
		if (loc.uSize) setters.vec2('uSize', uniforms.state1.size, uniforms.state2.size);
		if (loc.uRadius) setters.vec2('uRadius', uniforms.state1.radius, uniforms.state2.radius);

		if (loc.uRotateX)
			setters.vec2('uRotateX', degToRad(uniforms.state1.rotX), degToRad(uniforms.state2.rotX));
		if (loc.uRotateY)
			setters.vec2('uRotateY', degToRad(uniforms.state1.rotY), degToRad(uniforms.state2.rotY));
		if (loc.uRotateZ)
			setters.vec2('uRotateZ', degToRad(uniforms.state1.rotZ), degToRad(uniforms.state2.rotZ));
	}

	if (uniforms.state1 && loc.uColorA) {
		setters.vec4('uColorA', parseColor(uniforms.state1.color || '#0000'));
	}

	if (uniforms.state2 && loc.uColorB) {
		setters.vec4('uColorB', parseColor(uniforms.state2.color || '#0000'));
	}

	// DotGrid specific
	if (loc.uRowOffset && uniforms.offsetToggle !== undefined) {
		const rowOffset =
			uniforms.offsetToggle === 'row' ? 1 / uniforms.offsetRow : uniforms.offsetPercent / 100;
		setters.float('uRowOffset', rowOffset);
	}

	if (loc.uGridSize && uniforms.gridSize) {
		setters.vec2('uGridSize', uniforms.gridSize.x, uniforms.gridSize.y);
	}

	// Other properties
	if (loc.uMagnet && uniforms.magnetValue !== undefined) {
		setters.vec2('uMagnet', uniforms.magnetValue, mapRange(uniforms.magnetSmooth));
	}

	if (loc.uMouse && uniforms.mousePosition) {
		setters.vec2('uMouse', uniforms.mousePosition.x, uniforms.mousePosition.y);
	}

	// Handle custom uniforms
	if (uniforms.customUniforms) {
		Object.entries(uniforms.customUniforms).forEach(([name, value]) => {
			if (loc[name]) {
				if (Array.isArray(value)) {
					if (value.length === 2) setters.vec2(name, value[0], value[1]);
					else if (value.length === 3) gl.uniform3f(loc[name], value[0], value[1], value[2]);
					else if (value.length === 4)
						gl.uniform4f(loc[name], value[0], value[1], value[2], value[3]);
				} else if (typeof value === 'number') {
					setters.float(name, value);
				} else if (typeof value === 'boolean') {
					setters.int(name, value ? 1 : 0);
				}
			}
		});
	}
}
