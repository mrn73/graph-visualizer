import { NodeType } from '../node.js';

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
	const rowSize = G[0].length;
	const colSize = G.length;
	const neighbors = [];
	const index = {row: Math.floor(v / rowSize), col: v % rowSize};

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
