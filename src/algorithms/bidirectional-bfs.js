import Queue from '../data-structures/queue.js';
import { isBlocked, neighbors } from './4-neighbor-graph-helper.js';

/**
 * Runs BFS from both the source and destination.
 * @param {Array<Array<number>>} G - The graph being searched
 * @param {number} s - The source node
 * @param {number} d - The destination node
 * @return {{
 * 		path: Array<number>, 
 * 		visited1: Array<number>, 
 * 		visited2: Array<number>
 * 	   }}
 */
function bidirectionalSearch(G, s, d) {
	const fringe1 = new Queue();
	const visited1 = new Map();
	const fringe2 = new Queue();
	const visited2 = new Map();

	fringe1.enqueue(s);
	visited1.set(s, null);
	fringe2.enqueue(d);
	visited2.set(d, null);

	let v;
	while (!fringe1.isEmpty() && !fringe2.isEmpty()) {
		// ----BFS from source----
		v = fringe1.dequeue();
		if (visited2.has(v)) {
			break;
		}

		for (const w of neighbors(G, v)) {
			if (!visited1.has(w) && !isBlocked(G, w)) {
				fringe1.enqueue(w);
				visited1.set(w, v);
			}
		}

		// ----BFS from destination-----
		v = fringe2.dequeue();
		if (visited1.has(v)) {
			break;
		}

		for (const w of neighbors(G, v)) {
			if (!visited2.has(w) && !isBlocked(G, w)) {
				fringe2.enqueue(w);
				visited2.set(w, v);
			}
		}
	}		

	let path = [];
	// An intersection between both searches means there's a path
	if (visited1.has(v) && visited2.has(v)) {	
		let intersect = v;
		const path1 = [intersect];
		for (let i = 1; (v = visited1.get(path1[i-1])) !== null; i++) {
			path1.push(v);
		}
		const path2 = [intersect];
		for (let i = 1; (v = visited2.get(path2[i-1])) !== null; i++) {
			path2.push(v);
		}
		// Makes a complete path from source to destination. Slice removes the 
		// duplicate intersect vertex found in both BFS paths.
		path = path1.reverse().slice(0, -1).concat(path2);
	}

	return {
		path, 
		visited1: [...visited1.keys()],
		visited2: [...visited2.keys()]
	}
}

export default bidirectionalSearch;
