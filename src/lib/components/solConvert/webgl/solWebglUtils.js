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

	// Set resolution uniform if it exists
	if (loc.uResolution) {
		gl.uniform2f(loc.uResolution, canvas.width, canvas.height);
	}

	// Set time uniform if it exists
	if (loc.uTime) {
		gl.uniform1f(loc.uTime, getTimestamp());
	}

	// Set color uniforms if they exist and colors are provided
	if (loc.uColors && loc.uPositions && loc.uColorCount && props.colors) {
		const sortedColors = [...props.colors].sort((a, b) => a.position - b.position);
		const colorValues = sortedColors.map((c) => parseColor(c.color)).flat();
		const positions = sortedColors.map((c) => c.position);

		gl.uniform4fv(loc.uColors, new Float32Array(colorValues));
		gl.uniform1fv(loc.uPositions, new Float32Array(positions));
		gl.uniform1i(loc.uColorCount, sortedColors.length);
	}

	// Set grain uniforms if they exist
	if (loc.uGrainScale && props.grainScale !== undefined) {
		gl.uniform1f(loc.uGrainScale, props.grainScale);
	}
	if (loc.uGrainSpeed && props.grainSpeed !== undefined) {
		gl.uniform1f(loc.uGrainSpeed, props.grainSpeed);
	}
	if (loc.uGrainStr && props.grainStr !== undefined) {
		gl.uniform1f(loc.uGrainStr, props.grainStr);
	}

	// Set wave uniforms if they exist
	if (loc.uWaveType && props.waveType !== undefined) {
		gl.uniform1f(loc.uWaveType, props.waveType);
	}
	if (loc.uWaveScale && props.waveScale !== undefined) {
		gl.uniform1f(loc.uWaveScale, props.waveScale);
	}
	if (loc.uWaveSpeed && props.waveSpeed !== undefined) {
		gl.uniform1f(loc.uWaveSpeed, props.waveSpeed);
	}
	if (loc.uWaveAngle && props.waveAngle !== undefined) {
		gl.uniform1f(loc.uWaveAngle, props.waveAngle);
	}

	// Set noise uniforms if they exist
	if (loc.uNoiseScale && props.noiseScale !== undefined) {
		gl.uniform1f(loc.uNoiseScale, props.noiseScale);
	}
	if (loc.uNoiseSpeed && props.noiseSpeed !== undefined) {
		gl.uniform1f(loc.uNoiseSpeed, props.noiseSpeed);
	}
	if (loc.uNoiseType && props.noiseType !== undefined) {
		gl.uniform1f(loc.uNoiseType, props.noiseType);
	}

	// Set pixelate uniforms if they exist
	if (loc.uPixelate && props.pixelate !== undefined) {
		gl.uniform1i(loc.uPixelate, props.pixelate);
	}
	if (loc.uPixelScale && props.pixelScale !== undefined) {
		gl.uniform1f(loc.uPixelScale, props.pixelScale);
	}

	// Set state uniforms for components like DotGrid
	if (props.state1 && props.state2) {
		if (loc.uSize) {
			gl.uniform2f(loc.uSize, props.state1.size, props.state2.size);
		}
		if (loc.uRadius) {
			gl.uniform2f(loc.uRadius, props.state1.radius, props.state2.radius);
		}
		if (loc.uRotateX) {
			gl.uniform2f(loc.uRotateX, degToRad(props.state1.rotX), degToRad(props.state2.rotX));
		}
		if (loc.uRotateY) {
			gl.uniform2f(loc.uRotateY, degToRad(props.state1.rotY), degToRad(props.state2.rotY));
		}
		if (loc.uRotateZ) {
			gl.uniform2f(loc.uRotateZ, degToRad(props.state1.rotZ), degToRad(props.state2.rotZ));
		}
		if (loc.uColorA) {
			gl.uniform4fv(loc.uColorA, parseColor(props.state1.color || '#0000'));
		}
		if (loc.uColorB) {
			gl.uniform4fv(loc.uColorB, parseColor(props.state2.color || '#0000'));
		}
	}

	// Set grid-specific uniforms
	if (loc.uGap && props.gap !== undefined) {
		gl.uniform1f(loc.uGap, props.gap);
	}
	if (loc.uRowOffset && props.offsetToggle !== undefined) {
		const rowOffset =
			props.offsetToggle === 'row' ? 1 / props.offsetRow : props.offsetPercent / 100;
		gl.uniform1f(loc.uRowOffset, rowOffset);
	}
	if (loc.uGridSize && options.gridSize) {
		gl.uniform2f(loc.uGridSize, options.gridSize.x, options.gridSize.y);
	}
	if (loc.uDisplaySize) {
		gl.uniform2f(loc.uDisplaySize, clientWidth, clientHeight);
	}

	// Set falloff and steepness uniforms
	if (loc.uFalloff && props.falloff !== undefined) {
		gl.uniform1f(loc.uFalloff, props.falloff);
	}
	if (loc.uSteepness && props.steepness !== undefined) {
		gl.uniform1f(loc.uSteepness, props.steepness);
	}

	// Set magnet uniforms
	if (loc.uMagnet && options.magnetValue !== undefined) {
		gl.uniform2f(loc.uMagnet, options.magnetValue, mapRange(props.magnetSmooth));
	}

	// Set mouse area uniform
	if (loc.uMouseArea && options.mouseArea !== undefined) {
		gl.uniform1f(loc.uMouseArea, options.mouseArea);
	}

	// Set mouse position uniform
	if (loc.uMouse && options.mousePosition) {
		gl.uniform2f(loc.uMouse, options.mousePosition.x, options.mousePosition.y);
	}

	// Component-specific custom uniforms can be passed in options.customUniforms
	if (options.customUniforms) {
		for (const [name, value] of Object.entries(options.customUniforms)) {
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
		}
	}
}
