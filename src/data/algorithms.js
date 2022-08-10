import Queue from './queue.js';
import { NodeType } from './gridGraph.js';

/**
 * breadth-first search algorithm.
 * @param {[]} G - The array of nodes in the graph.
 * @param {number} s - The index of the starting node in the graph.
 *			NOTE: give index as absolute position in 2D array.
 * @return {{}} - The final path and all explored nodes, in order. 
 */
export function bfs(G, s, d) {
	const fringe = new Queue();		
	const visited = new Map();

	fringe.enqueue(s);
	visited.set(s, null);

	let v;
	while (!fringe.isEmpty()) {
		v = fringe.dequeue();
		if (v === d) {
			break;
		}

		// Add all unvisited elements that are unblocked to the queue.
		neighbors(G, v).forEach(w => {
			if (!visited.has(w) && !isBlocked(G, w)) {
				fringe.enqueue(w);
				visited.set(w, v);
			}
		});
	}		

	const path = [];
	// If we found our destination, traceback the shortest path
	if (v === d) {
		path.push(d);
		for (let i = 1; (v = visited.get(path[i-1])) !== null; i++) {
			path.push(v);
		}
	}

	return {path: path.reverse(), visited: [...visited.keys()]};
} 

/**
 * Checks if a graph element is blocked.
 * @param {[]} G - The array of nodes in the graph.
 * @param {number} v - The index of the node in the graph.
 * @return {boolean}
 */
function isBlocked(G, v) {
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
function neighbors(G, v) {
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

