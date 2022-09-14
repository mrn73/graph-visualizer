import { isBlocked, neighbors, h } from './4-neighbor-graph-helper.js';
import PriorityQueue from '../data-structures/priority-queue.js';

function gbfs(G, s, d) {
	const visited = new Map();
	const fringe = new PriorityQueue();

	fringe.push(s, h(G, s, d));
	visited.set(s, null);

	let v;
	while (!fringe.isEmpty()) {
		v = fringe.pop();
		if (v === d) {
			break;
		}

		for (const w of neighbors(G, v)) {
			if (!visited.has(w) && !isBlocked(G, w)) {
				fringe.push(w, h(G, w, d));
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

export default gbfs;
