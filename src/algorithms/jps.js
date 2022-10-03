import { isBlocked, neighbors, h, c, coords, abs, dist} from './4-neighbor-graph-helper.js';
import { NodeType } from '../node.js';
import PriorityQueue from '../data-structures/priority-queue.js';

/**
 * Jump point search algorithm invented by Daniel Harabor.
 *
 * Specifically designed for uniform cost grids, jps lessens the amount of nodes that are added 
 * to the priority queue by jumping from a given node until a deadend is reached or a "forced neighbor"
 * is found. A node with forced neighbors means that it is a node of interest that must be investigated
 * further and therefore added to the queue.
 *
 * General rules taken from http://users.cecs.anu.edu.au/~dharabor/data/papers/harabor-grastien-aaai11.pdf:
 *
 * Defintion 1: A node n is a forced neighbor of node x if:
 * 	1. n is not a natural neighbor of x
 * 	2. length of the path from parent(x) thru x to n is < length of the path from parent(x) to n excluding x.
 * 	   (explained in detail above the function "prune()")
 *
 * Defintion 2: A node y is a jump point of x if:
 * 	1. node y is the goal node
 * 	2. node y has at least one neighbor that's forced according to definition 1
 * 	3. the movement is vertical and there exists a node z that is a jump point of y, therefore making
 * 	   y a jump point to x.
 *
 * @param {Array<Array<number>>} G - The array of nodes in the graph.
 * @param {number} s - The index of the starting node in the graph.
 * @param {number} d - The index of the destination in the graph.
 * @return {{path: Array<number>, visited: Array<number> }}
 */
function jps(G, s, d) {	
	const fringe = new PriorityQueue();
	const visited = new Map();
	const closed = new Set();
	const forcedNeighbors = new Map();

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
		//console.log("BEING EXLORED: " + v + " FROM " + vInfo.par);
		const succ = successors(G, v, vInfo.par, d, forcedNeighbors);
		//console.log("JUMP POINTS: " + JSON.stringify(succ));
		//console.log("-------------------------------------------");
		for (const w of succ) {
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

	// Our current path is only composed of jump point nodes. For each pair of jump points, we find
	// all of the nodes between them to build a continious path. "path" keeps track of the actual
	// path, while "jPath" is the path of jump points that jps computed. Jpath is needed to properly trace
	// back from dst to src as only jump points have a "par" value since they are the only real nodes.
	const path = [];
	const jPath = [];
	if (v === d) {
		path.push(d);
		jPath.push(d);
		let prev = v;
		for (let i = 1; (v = visited.get(jPath[i-1]).par) !== null; i++) {
			const v1 = coords(G, prev);
			const v2 = coords(G, v);
			const dir = direction(v1, v2);
			if (dir == 'U') {
				for (let row = v1.row - 1; row >= v2.row; row--) {
					path.push(abs(G, row, v1.col));	
				}
			} else if (dir == 'R') {
				for (let col = v1.col + 1; col <= v2.col; col++) {
					path.push(abs(G, v1.row, col));
				}
			} else if (dir == 'D') {
				for (let row = v1.row + 1; row <= v2.row; row++) {
					path.push(abs(G, row, v1.col));
				}
			} else if (dir == 'L') {
				for (let col = v1.col - 1; col >= v2.col; col--) {
					path.push(abs(G, v1.row, col));
				}
			}
			jPath.push(v);
			prev = v;
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
function successors(G, n, p, d, forcedNeighbors) {
	const jumpPoints = [];
	// check all immediate neighbors of n for forced neigbors. 
	let adj = prune(G, coords(G, n), coords(G, p));
	// if n had jump points found previously, we add those to its adjacent list. 
	if (forcedNeighbors.has(n)) {
		adj = adj.concat(forcedNeighbors.get(n));
	}
	//console.log(n + "'s pruned neighbors: " + JSON.stringify(adj));
	// for all pruned neighbors of n, jump in those directions to find more jump points.
	// any jump points found will be considered successors of n. 
	for (const w of adj) {
		const v = jump(G, n, direction(coords(G, n), coords(G, w.n)), d, forcedNeighbors);
		if (v != null) {
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
		if (col < G[0].length && col >= 0) {
			pruned.push({n: abs(G, n.row, col), type: 'N'});
		}

		// here, parent is considered the cell in the opposite direction of movement.
		// EX: if we're moving to the right, the cell to the left is n's parent.
		const pCol = dir === 'R' ? n.col - 1 : n.col + 1;
		if (pCol >= 0 && pCol < G[0].length) {
			// if adj cell above the parent is blocked, the cell above n is a forced neighbor as long
			// as it isn't blocked.
			if (n.row - 1 >= 0 && G[n.row - 1][pCol] === NodeType.BLOCKED &&
				G[n.row - 1][n.col] !== NodeType.BLOCKED) {
				pruned.push({n: abs(G, n.row - 1, n.col), type: 'F'});
			}
			// if adj cell below the parent is blocked, the cell below n is a forced neighbor as long
			// as it isn't blocked.
			if (n.row + 1 < G.length && G[n.row + 1][pCol] === NodeType.BLOCKED &&
				G[n.row + 1][n.col] !== NodeType.BLOCKED) {
				pruned.push({n: abs(G, n.row + 1, n.col), type: 'F'});
			}
		}
		
	} else {	
		// if in bounds, the cell in the direction of movement is a natural neighbor.
		const row = dir === 'U' ? n.row - 1 : n.row + 1;
		if (row < G.length && row >= 0) {
			pruned.push({n: abs(G, row, n.col), type: 'N'});		
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
 * @return {number} - Index of the jump point (null if none)
 */
function jump(G, n, dir, d, forcedNeighbors) {
	const v = step(G, n, dir);

	// v is out of bounds or blocked
	if (v == null) {
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
		const jumpRight = jump(G, v, 'R', d, forcedNeighbors);
		const jumpLeft = jump(G, v, 'L', d, forcedNeighbors);
		const jumpPoints = [];
		if (jumpRight != null) {
			jumpPoints.push({n: jumpRight, type: 'F'});
		}
		if (jumpLeft != null) {
			jumpPoints.push({n: jumpLeft, type: 'F'});
		}
		if (jumpPoints.length > 0) {
			forcedNeighbors.set(v, jumpPoints);
			return v;
		}
	}
	// all conditions failed; keep moving in the same direction looking for
	// a jump point.
	return jump(G, v, dir, d, forcedNeighbors);
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
