import { isBlocked, neighbors, h, c } from './4-neighbor-graph-helper.js';
import PriorityQueue from '../data-structures/priority-queue.js';

/**
 * A* search algorithm.
 * @param {Array<Array<number>>} G - The array of nodes in the graph.
 * @param {number} s - The index of the starting node in the graph.
 * @param {number} d - The index of the destination in the graph.
 * @return {{path: Array<number>, visited: Array<number> }}
 */
function aStar(G, s, d) {
	const fringe = new PriorityQueue();
	const visited = new Map();
	const closed = new Set();

	fringe.push(s, h(G, s, d));
	visited.set(s, {par: null, g: 0, h: h(G, s, d), f: h(G, s, d)});
	
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
				const hVal = h(G, w, d);
				const fVal = cost + hVal;
				visited.set(w, {par: v, g: cost, h: hVal, f: fVal});	
				fringe.push(w, fVal); 
			}

		}
	}		

	const path = [];
	let pathWeight;
	// If we found our destination, traceback the shortest path
	if (v === d) {
		path.push(d);
		pathWeight = visited.get(d).g;
		for (let i = 1; (v = visited.get(path[i-1]).par) !== null; i++) {
			path.push(v);
		}
	}

	return {path: path.reverse(), visited: [...visited.keys()], pathWeight};	
}

export default aStar;
