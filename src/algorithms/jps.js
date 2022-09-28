import { isBlocked, neighbors, h, c, coords, abs, dist} from './4-neighbor-graph-helper.js';
import { NodeType } from '../node.js';
import PriorityQueue from '../data-structures/priority-queue.js';

function jps(G, s, d) {	
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
		console.log("BEING EXLORED: " + v + " FROM " + vInfo.par);
		console.log(successors(G, v, vInfo.par, d));
		for (const w of successors(G, v, vInfo.par, d)) {
			const cost = vInfo.g + dist(G, v, w);
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
	// If we found our destination, traceback the shortest path
	if (v === d) {
		path.push(d);
		for (let i = 1; (v = visited.get(path[i-1]).par) !== null; i++) {
			path.push(v);
		}
	}

	return {path: path.reverse(), visited: [...visited.keys()]};	
}

/**
 * Finds the successors (jump points) of a node n in graph G
 * @param {Array<Array<number>>} G - The array of nodes in the graph.
 * @param {number} n - The index of the node being explored.
 * @param {number} p - The index of the parent of n.
 * @param {number} d - The index of the destination in the graph.
 * @return {Array<number>} - successors of n
 */ 
function successors(G, n, p, d) {
	const jumpPoints = [];
	const adj = prune(G, coords(G, n), coords(G, p));
	for (const w of adj) {
		const v = jump(G, n, direction(coords(G, n), coords(G, w.n)), d);
		if (v === d) {
			console.log("FOUND!");
		}
		if (v) {
			jumpPoints.push(v);
		}
	}
	return jumpPoints;
}

/**
 * Prunes the neighbors of n to include only its natural and forced neighbors.
 *
 * Natural Neighbor:			Forced Neighbor:
 * 	|   |   |   |				| X | F |   |
 * 	-------------				-------------
 * 	| p | n | N |				| p | n | N |
 * 	-------------				-------------
 * 	|   |   |   | 			        |   |   |   |
 * 
 * Since there are no blocked		Since the cell above p is
 * cells above or below p, there	blocked (X), we have to go through
 * are no forced neighbors of n.	n to get to the cell above n,
 * The only neighbor to check is	so that is a forced neighbor of n.
 * the one natural neighbor to its	n still has its natural neighbor to
 * right, N.				the right.
 *
 * @param {Array<Array<number>>} G - The array of nodes in the graph.
 * @param {{row: {number}, col: {number}}} n - coords of node being explored.
 * @param {{row: {number}, col: {number}}} p - coords of the parent of n
 * @return {Array<{n: {number}, type: {string}}>} - pruned neighbors of n.
 */
function prune(G, n, p) {
	const pruned = [];
	// if we don't have a direction we're coming from, return all unblocked neighbors.
	if (p == null) {
		const adj = neighbors(G, abs(G, n.row, n.col));
		for (const w of adj) {
			pruned.push({n: w, type: 'N'});
		}
		return pruned;
	}
	
	// direction from parent(n) to n
	const dir = direction(p, n);
	if (dir === 'R' || dir === 'L') {
		// if in bounds, the cell in the direction of movement is a natural neighbor.
		const col = dir === 'R' ? n.col + 1 : n.col - 1;
		if (col < G.length[0] && col >= 0) {
			pruned.push({n: abs(G, n.row, col), type: 'N'});
		}

		// this col is guranteed to be in bounds because we were able to jump from p to n going x units in 
		// direction d, so going <= x units in direction -d must be in bounds.
		const pCol = dir === 'R' ? n.col - 1 : n.col + 1;
		if (pCol >= 0 && pCol < G[0].length) {
			// if adj cell above the parent is blocked, we have to check the cell above n (forced neighbor)
			if (n.row - 1 >= 0 && G[n.row - 1][pCol] === NodeType.BLOCKED) {
				pruned.push({n: abs(G, n.row - 1, n.col), type: 'F'});
			}
			// if adj cell below the parent is blocked, we have to check the cell below n (forced neighbor)
			if (n.row + 1 < G.length && G[n.row + 1][pCol] === NodeType.BLOCKED) {
				pruned.push({n: abs(G, n.row + 1, n.col), type: 'F'});
			}
		}
		
	} else {	
		// if in bounds, the cell in the direction of movement is a natural neighbor.
		const row = dir === 'U' ? n.row - 1 : n.row + 1;
		if (row < G.length && row >= 0) {
			pruned.push({n: abs(G, row, n.col), type: 'N'});		
		}

		const pRow = dir === 'U' ? n.row + 1 : n.row - 1;
		if (pRow >= 0 && pRow < G.length) {
			// if adj cell left of the parent is blocked, we have to check the cell left of n (forced neighbor)
			if (n.col - 1 >= 0 && G[pRow][n.col - 1] === NodeType.BLOCKED) {
				pruned.push({n: abs(G, n.row, n.col - 1), type: 'F'});
			}
			// if adj cell right of the parent is blocked, we have to check the cell right of n (forced neighbor)
			if (n.col + 1 < G.length[0] && G[pRow][n.col + 1] === NodeType.BLOCKED) {
				pruned.push({n: abs(G, n.row, n.col + 1), type: 'F'});
			}
		}
		
	}
	return pruned;
}

/**
 * Returns the direction moving from v1 to v2.
 * dx (columns):
 * 	<0 = R
 * 	>0 = L
 * dy (rows):
 * 	<0 = D
 * 	>0 = U
 * @param {{row: {number}, col: {number}}} v1 - coords of first node.
 * @param {{row: {number}, col: {number}}} v2 - coords of second node.
 * @return {String}
 */
function direction(v1, v2) {
	const dx = v1.col - v2.col;
	const dy = v1.row - v2.row; 

	if (dx < 0 && dy == 0) {
		return 'R';
	} else if (dx > 0 && dy == 0) {
		return 'L';
	} else if (dx == 0 && dy < 0) {
		return 'D';
	} else if (dx == 0 && dy > 0) {
		return 'U';
	}
	return 'U';
}

/**
 * Recursively jumps until a jump point is found or we hit a dead-end.
 * @param {Array<Array<number>>} G - The array of nodes in the graph.
 * @param {number} n - Index of the node we're jumping from.
 * @param {string} dir - Direction of movement (U, D, L, R)
 * @param {number} d - Index of the destination node.
 */
function jump(G, n, dir, d) {
	const v = step(G, n, dir);
	// v is out of bounds or blocked
	if (v === null) {
		return null;
	}
	// v is the goal node
	if (v === d) {
		return v;
	}
	// v has a forced neighbor
	for (const adj of prune(G, coords(G, v), coords(G, n))) {
		if (adj.type === 'F') {
			//console.log("DIR: " + direction(coords(G, n), coords(G, v)));
			//console.log("FORCED: " + JSON.stringify(adj));
			return v;
		}
	}
	// if we're moving vertically, we need to jump horizontally at each step
	// looking for jump points.
	if (dir == 'U' || dir == 'D') {
		if (jump(G, v, 'R', d) != null || jump(G, v, 'L', d) != null) {
			return v;
		}
	}
	// all conditions failed; keep moving in the same direction looking for
	// a jump point.
	return jump(G, v, dir, d);
}

/**
 * Steps 1 cell in a given direction of L (left), R (right), U (up), or D (down)
 * @param {Array<Array<number>>} G - The array of nodes in the graph.
 * @param {number} n - The index of the node being explored.
 * @param {String} dir - The direction of movement: L, R, U, or D
 * @return {number} - index of neighboring node
 */
function step(G, n, dir) {
	let dx = 0;
	let dy = 0;
	switch (dir) {
		case 'U':
			dy = -1;
			break;
		case 'D':
			dy = 1;
			break;
		case 'R':
			dx = 1;
			break;
		case 'L':
			dx = -1;
			break;
		default:
			return null;
	}
	const coord = coords(G, n);
	const row = coord.row + dy;
	const col = coord.col + dx;
	if (row < G.length && row >= 0 && col < G[0].length && col >= 0) {
		const v = abs(G, row, col);
		if (!isBlocked(G, v)) {
			return v;
		}
	}
	return null;
}

export default jps;
