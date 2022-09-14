import Queue from '../data-structures/queue.js';
import { isBlocked, neighbors } from './4-neighbor-graph-helper.js';
/**
 * breadth-first search algorithm.
 * @param {Array<Array<number>>} G - The array of nodes in the graph.
 * @param {number} s - The index of the starting node in the graph.
 * @param {number} d - The index of the destination in the graph.
 * @return {{path: Array<number>, visited: Array<number> }}
 */
function bfs(G, s, d) {
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
		for (const w of neighbors(G, v)) {
			if (!visited.has(w) && !isBlocked(G, w)) {
				fringe.enqueue(w);
				visited.set(w, v);
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

	return {path: path.reverse(), visited: [...visited.keys()]};
} 

export default bfs;
