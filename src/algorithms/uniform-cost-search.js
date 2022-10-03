import { isBlocked, neighbors, h, c } from './4-neighbor-graph-helper.js';
import PriorityQueue from '../data-structures/priority-queue.js';

/**
 * Uniform-cost search algorithm.
 * This code is essentially the same as A*, as UCS is A* without the
 * heuristic.
 * @param {Array<Array<number>>} G - The array of nodes in the graph.
 * @param {number} s - The index of the starting node in the graph.
 * @param {number} d - The index of the destination in the graph.
 * @return {{path: Array<number>, visited: Array<number> }}
 */
function ucs(G, s, d) {
	const fringe = new PriorityQueue();
	const visited = new Map();
	const closed = new Set();

	fringe.push(s, 0);
	visited.set(s, {par: null, g: 0});
	
	let v;
	while (!fringe.isEmpty()) {
		v = fringe.pop();
		if (v === d) {
			break;
		}
		// This happens if we added this node more than once to the queue, which happens
		// as a result of finding a better cost once it was already in the queue. The version
		// with the lowest cost is guranteed to be popped first with a consistent heurisitc.
		if (closed.has(v)) {
			continue;
		}
		closed.add(v);

		const vInfo = visited.get(v);
		for (const w of neighbors(G, v)) {
			const cost = vInfo.g + c(G, v, w);
			// If a node is closed, it can no longer be updated (this is fine since our 
			// heuristic is consistent).
			if (closed.has(w) || isBlocked(G, w)) {
				continue;
			}
			// Either we've never seen this node before, or we have seen it
			// but the new cost is better than its previous cost.
			if (!visited.has(w) || cost < visited.get(w).g) {
				visited.set(w, {par: v, g: cost});
				fringe.push(w, cost); 
			}

		}
	}		

	const path = [];
	// If we found our destination, traceback the shortest path
	if (v === d) {
		path.push(d);
		for (let i = 1; (v = visited.get(path[i-1]).par) !== null; i++) {
			path.push(v);
		}
	}

	return {path: path.reverse(), visited: [...visited.keys()]};	
}

export default ucs;
