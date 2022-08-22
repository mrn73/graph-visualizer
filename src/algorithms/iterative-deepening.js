import { isBlocked, neighbors } from './4-neighbor-graph-helper.js';

/**
 * Depth Limited Search: runs DFS up to a specified depth
 * @param {Array<Array<number>>} G - The graph
 * @param {number} v - The start node
 * @param {number} d - The destination node.
 * @param {Map<number, number>} visited - Stores all the unique nodes visited across all iterations
 * @param {Map<number, number>} instanceVisited - Stores all the nodes visited in a single iteration.
 * @param {number} lim - The max depth to search up to.
 * @return {boolean} - Whether or not we found the destination.
 */
function dls(G, v, d, visited, instanceVisited, lim) {
	if (v === d) {
		return true;
	}

	if (lim <= 0) {
		return false;
	}
	
	for (const w of neighbors(G, v)) {
		if (!isBlocked(G, w)) {
			if (!visited.has(w)) {
				visited.set(w, v);
			}
			if (!instanceVisited.has(w)) {
				instanceVisited.set(w, v);
				if (dls(G, w, d, visited, instanceVisited, lim - 1)) {
					return true;
				}
			}
		}
	}

	return false;
}

/**
 * Iterative Deepening Depth First Search: uses DLS to continuously perform DFS at increasing
 * depths until the goal is found or we've hit the max depth we're willing to search.
 * @param {Array<Array<number>>} G - The graph
 * @param {number} v - The start node
 * @param {number} d - The destination node.
 * @param {number} max - The max depth to search up to.
 * @return {{path: Array<number>, visited: Array<number>, iterations: Array<Array<number>>}}
 */
function iddfs(G, s, d, max) {
	// Map of uniquely visited nodes across all iterations
	const visited = new Map([[s, null]]);
	// List of all iterations of DLS
	const iterations = [];
	for (let i = 0; i <= max; i++) {
		// Map of nodes that are visited each time DLS is ran.
		let instanceVisited = new Map([[s, null]]);
		if (dls(G, s, d, visited, instanceVisited, i)) {
			iterations.push([...instanceVisited.keys()]);
			break;
		}
		iterations.push([...instanceVisited.keys()]);
	}
	console.log(iterations);

	const path = [];
	if (visited.has(d)) {
		path.push(d);
		let v;
		for (let i = 1; (v = visited.get(path[i-1])) !== null; i++) {
			path.push(v);
		}
	}

	return {
		path: path.reverse(), 
		visited: [...visited.keys()],
		iterations
	}
}

export default iddfs;
