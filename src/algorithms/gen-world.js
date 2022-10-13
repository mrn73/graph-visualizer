import { createNoise2D } from 'simplex-noise';
import { NodeType } from '../node.js';

/**
 * Generates the world terrain using the simplex noise algorithm.
 * @param {number} width - the width of the world.
 * @param {number} height - the height of the world.
 * @return {Array<Array<number>>} - the 2D array of terrain values.
 */
export function generateWorld(width, height) {
	const noise = getNoiseMatrix(width, height);
	const world = getWorldTerrain(noise);	
	return world;
}

/**
 * Gets the world terrain given the noise matrix.
 * @param {Array<Array<number>>} noise - The noise matrix of the world.
 * @return {Array<Array<number>>} the terrain values of each cell.
 */
function getWorldTerrain(noise) {
	const world = [];
	for (let i = 0; i < noise.length; i++) {
		const row = [];
		for (let j = 0; j < noise[0].length; j++) {
			row.push(getCellTerrain(noise[i][j]));
		}
		world.push(row);
	}
	return world;
}

/**
 * Gets the terrain given a cell's noise value.
 * @param {number} cell - Noise value.
 * @return {number} type of terrain
 */
function getCellTerrain(cell) {
	if (cell < .2) {
		return NodeType.DEEPWATER;
	} else if (cell < .3) {
		return NodeType.WATER;
	} else if (cell < .35) {
		return NodeType.SAND;
	} else if (cell < .77) {
		return NodeType.GRASSLAND;
	} else if (cell < .8) {
		return NodeType.FOREST;
	} else if (cell < .9) {
		return NodeType.ROCK;
	} else {
		return NodeType.SNOW;
	}
}

/**
 * Gets the simplex noise of the given world size.
 * @param {number} height - height of the world (rows).
 * @param {number} width - width of the world (columns).
 * @return {Array<Array<number>>} 2D matrix of world noise.
 */
function getNoiseMatrix(height, width) {
	let noise = Array(height).fill().map(() => new Array(width).fill(0));
	const noise2D = createNoise2D();
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const nx = x/width - .5;
			const ny = y/height - .5;
			noise[y][x] = normalize(noise2D(nx, ny), -1, 1);
		}
	}
	return noise;
}

/**
 * Normalizes a number found in some range [lower, upper] to be in the range of [0, 1].
 * @param {number} x - The value being normalized.
 * @param {number} lower - lower bound of the original range.
 * @param {number} upper - upper bound of the original range.
 * @return {number} normalized value.
 */
function normalize(x, lower, upper) {
	return (x - lower) / (upper - lower);
}
