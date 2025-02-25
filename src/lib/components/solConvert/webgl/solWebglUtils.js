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

	const uniformSetters = {
		// Basic uniforms
		uResolution: () => gl.uniform2f(loc.uResolution, canvas.width, canvas.height),
		uTime: () => gl.uniform1f(loc.uTime, getTimestamp()),
		uDisplaySize: () => gl.uniform2f(loc.uDisplaySize, clientWidth, clientHeight),

		// Color uniforms
		uColors: () => {
			if (uniforms.colors && loc.uPositions && loc.uColorCount) {
				const sortedColors = [...uniforms.colors].sort((a, b) => a.position - b.position);
				const colorValues = sortedColors.map((c) => parseColor(c.color)).flat();
				const positions = sortedColors.map((c) => c.position);

				gl.uniform4fv(loc.uColors, new Float32Array(colorValues));
				gl.uniform1fv(loc.uPositions, new Float32Array(positions));
				gl.uniform1i(loc.uColorCount, sortedColors.length);
			}
		},

		// Grain properties
		uGrainScale: () =>
			uniforms.grainScale !== undefined && gl.uniform1f(loc.uGrainScale, uniforms.grainScale),
		uGrainSpeed: () =>
			uniforms.grainSpeed !== undefined && gl.uniform1f(loc.uGrainSpeed, uniforms.grainSpeed),
		uGrainStr: () =>
			uniforms.grainStr !== undefined && gl.uniform1f(loc.uGrainStr, uniforms.grainStr),

		// Wave properties
		uWaveType: () =>
			uniforms.waveType !== undefined && gl.uniform1f(loc.uWaveType, uniforms.waveType),
		uWaveScale: () =>
			uniforms.waveScale !== undefined && gl.uniform1f(loc.uWaveScale, uniforms.waveScale),
		uWaveSpeed: () =>
			uniforms.waveSpeed !== undefined && gl.uniform1f(loc.uWaveSpeed, uniforms.waveSpeed),
		uWaveAngle: () =>
			uniforms.waveAngle !== undefined && gl.uniform1f(loc.uWaveAngle, uniforms.waveAngle),

		// Noise properties
		uNoiseScale: () =>
			uniforms.noiseScale !== undefined && gl.uniform1f(loc.uNoiseScale, uniforms.noiseScale),
		uNoiseSpeed: () =>
			uniforms.noiseSpeed !== undefined && gl.uniform1f(loc.uNoiseSpeed, uniforms.noiseSpeed),
		uNoiseType: () =>
			uniforms.noiseType !== undefined && gl.uniform1f(loc.uNoiseType, uniforms.noiseType),

		// Pixelation
		uPixelate: () =>
			uniforms.pixelate !== undefined && gl.uniform1i(loc.uPixelate, uniforms.pixelate),
		uPixelScale: () =>
			uniforms.pixelScale !== undefined && gl.uniform1f(loc.uPixelScale, uniforms.pixelScale),

		// State properties (for Tiles component)
		uSize: () =>
			uniforms.state1 &&
			uniforms.state2 &&
			gl.uniform2f(loc.uSize, uniforms.state1.size, uniforms.state2.size),
		uRadius: () =>
			uniforms.state1 &&
			uniforms.state2 &&
			gl.uniform2f(loc.uRadius, uniforms.state1.radius, uniforms.state2.radius),
		uRotateX: () =>
			uniforms.state1 &&
			uniforms.state2 &&
			gl.uniform2f(loc.uRotateX, degToRad(uniforms.state1.rotX), degToRad(uniforms.state2.rotX)),
		uRotateY: () =>
			uniforms.state1 &&
			uniforms.state2 &&
			gl.uniform2f(loc.uRotateY, degToRad(uniforms.state1.rotY), degToRad(uniforms.state2.rotY)),
		uRotateZ: () =>
			uniforms.state1 &&
			uniforms.state2 &&
			gl.uniform2f(loc.uRotateZ, degToRad(uniforms.state1.rotZ), degToRad(uniforms.state2.rotZ)),
		uColorA: () =>
			uniforms.state1 && gl.uniform4fv(loc.uColorA, parseColor(uniforms.state1.color || '#0000')),
		uColorB: () =>
			uniforms.state2 && gl.uniform4fv(loc.uColorB, parseColor(uniforms.state2.color || '#0000')),

		// DotGrid specific
		uGap: () => uniforms.gap !== undefined && gl.uniform1f(loc.uGap, uniforms.gap),
		uRowOffset: () => {
			if (uniforms.offsetToggle !== undefined) {
				const rowOffset =
					uniforms.offsetToggle === 'row' ? 1 / uniforms.offsetRow : uniforms.offsetPercent / 100;
				gl.uniform1f(loc.uRowOffset, rowOffset);
			}
		},
		uGridSize: () =>
			uniforms.gridSize && gl.uniform2f(loc.uGridSize, uniforms.gridSize.x, uniforms.gridSize.y),

		// Other properties
		uFalloff: () => uniforms.falloff !== undefined && gl.uniform1f(loc.uFalloff, uniforms.falloff),
		uSteepness: () =>
			uniforms.steepness !== undefined && gl.uniform1f(loc.uSteepness, uniforms.steepness),
		uMagnet: () =>
			uniforms.magnetValue !== undefined &&
			gl.uniform2f(loc.uMagnet, uniforms.magnetValue, mapRange(uniforms.magnetSmooth)),
		uMouseArea: () =>
			uniforms.mouseArea !== undefined && gl.uniform1f(loc.uMouseArea, uniforms.mouseArea),
		uMouse: () =>
			uniforms.mousePosition &&
			gl.uniform2f(loc.uMouse, uniforms.mousePosition.x, uniforms.mousePosition.y)
	};

	// Set all available uniforms
	Object.keys(loc).forEach((uniform) => {
		if (uniformSetters[uniform]) {
			uniformSetters[uniform]();
		}
	});

	// Handle custom uniforms
	if (uniforms.customUniforms) {
		Object.entries(uniforms.customUniforms).forEach(([name, value]) => {
			if (loc[name]) {
				if (Array.isArray(value)) {
					if (value.length === 2) gl.uniform2f(loc[name], value[0], value[1]);
					else if (value.length === 3) gl.uniform3f(loc[name], value[0], value[1], value[2]);
					else if (value.length === 4)
						gl.uniform4f(loc[name], value[0], value[1], value[2], value[3]);
				} else if (typeof value === 'number') {
					gl.uniform1f(loc[name], value);
				} else if (typeof value === 'boolean') {
					gl.uniform1i(loc[name], value ? 1 : 0);
				}
			}
		});
	}
}
