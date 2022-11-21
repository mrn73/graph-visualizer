import { isBlocked, neighbors, h } from './4-neighbor-graph-helper.js';
import PriorityQueue from '../data-structures/priority-queue.js';

/**
 * Greedy best-first search algorithm. Only takes into account the 
 * approximated distance to the goal node -- h(n) -- when choosing the next
 * best node.
 * @param {Array<Array<number>>} G - The array of nodes in the graph.
 * @param {number} s - The index of the starting node in the graph.
 * @param {number} d - The index of the destination in the graph.
 * @return {{path: Array<number>, visited: Array<number>, ops: number}}
 */
function gbfs(G, s, d) {
	const visited = new Map();
	const fringe = new PriorityQueue();

	fringe.push(s, h(G, s, d));
	visited.set(s, null);

	let ops = 0;
	let v;
	while (!fringe.isEmpty()) {
		v = fringe.pop();
		ops++;
		if (v === d) {
			break;
		}

		for (const w of neighbors(G, v)) {
			if (!visited.has(w) && !isBlocked(G, w)) {
				fringe.push(w, h(G, w, d));
				visited.set(w, v);
				ops++;
			}
		}
	}

	const path = [];
	// If we found our destination, traceback the shortest path
	if (v === d) {
		path.push(d);
		for (let i = 1; (v = visited.get(path[i-1])) !== null; i++) {
			path.push(v);
		}
	}

	return {path: path.reverse(), visited: [...visited.keys()], ops};
}

export default gbfs;
