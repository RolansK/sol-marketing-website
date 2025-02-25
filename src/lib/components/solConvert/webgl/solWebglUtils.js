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

export function setUniforms(gl, canvas, props, options = {}) {
	if (!canvas || !gl || !gl.uniformLocations) return;

	const loc = gl.uniformLocations;
	const { clientWidth, clientHeight } = canvas;
	const dpi = options.dpi || 1;

	if (options.resizeCanvas !== false) {
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
			if (props.colors && loc.uPositions && loc.uColorCount) {
				const sortedColors = [...props.colors].sort((a, b) => a.position - b.position);
				const colorValues = sortedColors.map((c) => parseColor(c.color)).flat();
				const positions = sortedColors.map((c) => c.position);

				gl.uniform4fv(loc.uColors, new Float32Array(colorValues));
				gl.uniform1fv(loc.uPositions, new Float32Array(positions));
				gl.uniform1i(loc.uColorCount, sortedColors.length);
			}
		},

		// Grain properties
		uGrainScale: () =>
			props.grainScale !== undefined && gl.uniform1f(loc.uGrainScale, props.grainScale),
		uGrainSpeed: () =>
			props.grainSpeed !== undefined && gl.uniform1f(loc.uGrainSpeed, props.grainSpeed),
		uGrainStr: () => props.grainStr !== undefined && gl.uniform1f(loc.uGrainStr, props.grainStr),

		// Wave properties
		uWaveType: () => props.waveType !== undefined && gl.uniform1f(loc.uWaveType, props.waveType),
		uWaveScale: () =>
			props.waveScale !== undefined && gl.uniform1f(loc.uWaveScale, props.waveScale),
		uWaveSpeed: () =>
			props.waveSpeed !== undefined && gl.uniform1f(loc.uWaveSpeed, props.waveSpeed),
		uWaveAngle: () =>
			props.waveAngle !== undefined && gl.uniform1f(loc.uWaveAngle, props.waveAngle),

		// Noise properties
		uNoiseScale: () =>
			props.noiseScale !== undefined && gl.uniform1f(loc.uNoiseScale, props.noiseScale),
		uNoiseSpeed: () =>
			props.noiseSpeed !== undefined && gl.uniform1f(loc.uNoiseSpeed, props.noiseSpeed),
		uNoiseType: () =>
			props.noiseType !== undefined && gl.uniform1f(loc.uNoiseType, props.noiseType),

		// Pixelation
		uPixelate: () => props.pixelate !== undefined && gl.uniform1i(loc.uPixelate, props.pixelate),
		uPixelScale: () =>
			props.pixelScale !== undefined && gl.uniform1f(loc.uPixelScale, props.pixelScale),

		// State properties (for Tiles component)
		uSize: () =>
			props.state1 && props.state2 && gl.uniform2f(loc.uSize, props.state1.size, props.state2.size),
		uRadius: () =>
			props.state1 &&
			props.state2 &&
			gl.uniform2f(loc.uRadius, props.state1.radius, props.state2.radius),
		uRotateX: () =>
			props.state1 &&
			props.state2 &&
			gl.uniform2f(loc.uRotateX, degToRad(props.state1.rotX), degToRad(props.state2.rotX)),
		uRotateY: () =>
			props.state1 &&
			props.state2 &&
			gl.uniform2f(loc.uRotateY, degToRad(props.state1.rotY), degToRad(props.state2.rotY)),
		uRotateZ: () =>
			props.state1 &&
			props.state2 &&
			gl.uniform2f(loc.uRotateZ, degToRad(props.state1.rotZ), degToRad(props.state2.rotZ)),
		uColorA: () =>
			props.state1 && gl.uniform4fv(loc.uColorA, parseColor(props.state1.color || '#0000')),
		uColorB: () =>
			props.state2 && gl.uniform4fv(loc.uColorB, parseColor(props.state2.color || '#0000')),

		// DotGrid specific
		uGap: () => props.gap !== undefined && gl.uniform1f(loc.uGap, props.gap),
		uRowOffset: () => {
			if (props.offsetToggle !== undefined) {
				const rowOffset =
					props.offsetToggle === 'row' ? 1 / props.offsetRow : props.offsetPercent / 100;
				gl.uniform1f(loc.uRowOffset, rowOffset);
			}
		},
		uGridSize: () =>
			options.gridSize && gl.uniform2f(loc.uGridSize, options.gridSize.x, options.gridSize.y),

		// Other properties
		uFalloff: () => props.falloff !== undefined && gl.uniform1f(loc.uFalloff, props.falloff),
		uSteepness: () =>
			props.steepness !== undefined && gl.uniform1f(loc.uSteepness, props.steepness),
		uMagnet: () =>
			options.magnetValue !== undefined &&
			gl.uniform2f(loc.uMagnet, options.magnetValue, mapRange(props.magnetSmooth)),
		uMouseArea: () =>
			options.mouseArea !== undefined && gl.uniform1f(loc.uMouseArea, options.mouseArea),
		uMouse: () =>
			options.mousePosition &&
			gl.uniform2f(loc.uMouse, options.mousePosition.x, options.mousePosition.y)
	};

	// Set all available uniforms
	Object.keys(loc).forEach((uniform) => {
		if (uniformSetters[uniform]) {
			uniformSetters[uniform]();
		}
	});

	// Handle custom uniforms
	if (options.customUniforms) {
		Object.entries(options.customUniforms).forEach(([name, value]) => {
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
