export const RADIANS = Math.PI / 180;

export function seedRandom(seed) {
	const m = 4294967296;
	const a = 1664525;
	const c = 1013904223;
	let z = seed >>> 0;

	return function () {
		z = (a * z + c) % m;
		return z / m;
	};
}

export function solveQuadratic(a, b, c) {
	if (a === 0) return b !== 0 ? [-c / b] : [];

	const discriminant = b * b - 4 * a * c;
	if (discriminant < 0) return [];

	const discRoot = Math.sqrt(discriminant);
	return [(-b + discRoot) / (2 * a), (-b - discRoot) / (2 * a)].filter(
		(root) => root >= 0 && root <= 1
	);
}

export function bezierCoordinate(t, p0, p1, p2, p3) {
	const oneMinusT = 1 - t;
	return (
		oneMinusT * oneMinusT * oneMinusT * p0 +
		3 * oneMinusT * oneMinusT * t * p1 +
		3 * oneMinusT * t * t * p2 +
		t * t * t * p3
	);
}

export function bezierPoint(t, p0, p1, p2, p3) {
	const x = bezierCoordinate(t, p0.x, p1.x, p2.x, p3.x);
	const y = bezierCoordinate(t, p0.y, p1.y, p2.y, p3.y);
	return { x, y };
}

export function calculateSegmentBounds(start, cp1, cp2, end) {
	let minX = Math.min(start.x, end.x);
	let maxX = Math.max(start.x, end.x);
	let minY = Math.min(start.y, end.y);
	let maxY = Math.max(start.y, end.y);

	[0, 1].forEach((axis) => {
		const values = axis === 0 ? [start.x, cp1.x, cp2.x, end.x] : [start.y, cp1.y, cp2.y, end.y];

		const a = -values[0] + 3 * values[1] - 3 * values[2] + values[3];
		const b = 2 * values[0] - 4 * values[1] + 2 * values[2];
		const c = -values[0] + values[1];

		solveQuadratic(a, b, c).forEach((t) => {
			const point = bezierPoint(t, start, cp1, cp2, end);
			minX = Math.min(minX, point.x);
			maxX = Math.max(maxX, point.x);
			minY = Math.min(minY, point.y);
			maxY = Math.max(maxY, point.y);
		});
	});

	return { minX, minY, maxX, maxY };
}
