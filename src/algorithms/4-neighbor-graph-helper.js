import { NodeType, getDefaultWeights } from '../node.js';

/**
 * Checks if a graph element is blocked.
 * @param {[]} G - The array of nodes in the graph.
 * @param {number} v - The index of the node in the graph.
 * @return {boolean}
 */
export function isBlocked(G, v) {
	const rowSize = G[0].length;
	const colSize = G.length;
	const index = {row: Math.floor(v / rowSize), col: v % rowSize};
	return G[index.row][index.col] === NodeType.BLOCKED;
}

/**
 * Makes a list of neighbors of a given node.
 * @param {[]} G - The array of nodes in the graph.
 * @param {number} v - The index of the node in the graph.
 * @return {[]} - The list of neighbors.
 */
export function neighbors(G, v) {
	const neighbors = [];
	const index = coords(G, v);
	const rowSize = G[0].length;
	const colSize = G.length;

	//Up
	let n = index.row - 1;
	if (n >= 0) {
		neighbors.push(n * rowSize + index.col);
	}

	//Right
	n = index.col + 1;
	if (n < rowSize) {
		neighbors.push(index.row * rowSize + n);
	}

	//Down
	n = index.row + 1;
	if (n < colSize) {
		neighbors.push(n * rowSize + index.col);
	}

	//Left
	n = index.col - 1;
	if (n >= 0) {
		neighbors.push(index.row * rowSize + n);
	}

	return neighbors;
}

/**
 * Given a grid and absolute index, gives the row and column of the index.
 * @param {Array<Array<number>>} G - The array of nodes in the graph.
 * @param {number} v - The index of the node.
 * @return {{row: <number>, col: <number>}} or null if v is null.
 */
export function coords(G, v) {	
	if (v == null) {
		return null;
	}
	const rowSize = G[0].length;
	const colSize = G.length;
	return {row: Math.floor(v / rowSize), col: v % rowSize};
}

/**
 * Given a grid, row, and column, returns the absolute position of an
 * element in the graph.
 * @param {Array<Array<number>>} G - The array of nodes in the graph.
 * @param {number} row
 * @param {number} col
 * @return {number} - The absolute position in the 2d array.
 */
export function abs(G, row, col) {
	return G[0].length * row + col;
}

/**
 * Returns the orthogonal distance between 2 nodes.
 * Created for more general readability (rather than use h function directly). 
 * @param {Array<Array<number>>} G - The array of nodes in the graph.
 * @param {number} s - The index of the first node.
 * @param {number} d - The index of the second node.
 * @return {number} - The distance.
 */
export function dist(G, v1, v2) {
	return h(G, v1, v2);
}

/*
 * Heuristic that uses the Manhattan Distance between 2 nodes.
 * @param {Array<Array<number>>} G - The array of nodes in the graph.
 * @param {number} s - The index of the first node.
 * @param {number} d - The index of the second node.
 * @return {number} - The evaluated heuristic.
 */
export function h(G, s, d) {	
	const rowSize = G[0].length;
	const colSize = G.length;
	const v1 = {row: Math.floor(s / rowSize), col: s % rowSize};
	const v2 = {row: Math.floor(d / rowSize), col: d % rowSize};
	return Math.abs(v1.row - v2.row) + Math.abs(v1.col - v2.col);
}

/**
 * cost function to go from one node to another, given they're neighbors.
 * TODO: can add other weights in the future
 */
export function c(G, v1, v2) {
	const weights = window.nodeWeights;
	const loc = coords(G, v2);
	//console.log(G[loc.row][loc.col]);
	//console.log(weights[G[loc.row][loc.col]]);
	return weights[G[loc.row][loc.col]];
}
