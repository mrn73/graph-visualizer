import Stack from '../data-structures/stack.js';
import { isBlocked, neighbors } from './4-neighbor-graph-helper.js';

/**
 * @param {Array<Array<number>>} G - The graph being searched.
 * @param {number} s - The index of the source node.
 * @param {number} d - The index of the destination node.
 * @param {boolean} [recursive=true] - If true, use the recursive algorithm.
 * @return {{path: Array<number>, visited: Array<number>, ops: number}}
 */
function dfs(G, s, d, recursive=true) {
	return recursive ? dfsRecursive(G, s, d) : dfsIterative(G, s, d);
}

/**
 * @param {Array<Array<number>>} G - The graph being searched.
 * @param {number} s - The index of the source node.
 * @param {number} d - The index of the destination node.
 * @return {{path: Array<number>, visited: Array<number>}}
 * NOTE: This function doesn't give the same output as the recursive version.
 * 	 Prefer recursive over this.
 */
function dfsIterative(G, s, d) {
	const fringe = new Stack();	
	const visited = new Map();
	const exploreOrder = [];

	fringe.push(s);
	visited.set(s, null);

	let v;
	while (!fringe.isEmpty()) {
		v = fringe.pop();
		if (v === d) {
			break;
		}
		exploreOrder.push(v);

		for (const w of neighbors(G, v)) {
			if (!visited.has(w) && !isBlocked(G, w)) {
				fringe.push(w);
				visited.set(w, v);
			}
		}
	}

	const path = [];
	if (v === d) {
		path.push(d);
		for (let i = 1; (v = visited.get(path[i-1])) !== null; i++) {
			path.push(v);
		}
	}

	return {path: path.reverse(), visited: exploreOrder};
}

/**
 * @param {Array<Array<number>>} G - The graph being searched.
 * @param {number} s - The index of the source node.
 * @param {number} d - The index of the destination node.
 * @return {{path: Array<number>, visited: Array<number>}}
 */
function dfsRecursive(G, s, d) {
	const visited = new Map();
	visited.set(s, null);
	doDfsRecursive(G, s, d, visited);

	const path = [];
	if (visited.has(d)) {
		path.push(d);
		let v;
		for (let i = 1; (v = visited.get(path[i-1])) !== null; i++) {
			path.push(v);
		}
	}

	return {path: path.reverse(), visited: [...visited.keys()], ops: visited.size};
}

/**
 * @param {Array<Array<number>>} G - The graph being searched.
 * @param {number} v - The index of the node being explored.
 * @param {number} d - The index of the destination node.
 * @param {Map<number, number>} visited - The map of visited nodes and their predecessors.
 */
function doDfsRecursive(G, v, d, visited) {	
	for (const w of neighbors(G, v)) {
		if (!visited.has(d) && !visited.has(w) && !isBlocked(G, w)) {
			visited.set(w, v);
			doDfsRecursive(G, w, d, visited);
		}
	}
}

export default dfs;
