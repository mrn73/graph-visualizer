import { NodeType } from '../node.js';
import aStar from './a-star.js';
import PriorityQueue from '../data-structures/priority-queue.js';
import { coords, abs } from './4-neighbor-graph-helper.js';

function hpaStar(G, s, d, cSize=5) {
	const absGraph = new AbstractGraph(G, cSize);
	const rows = G.length;
	const cols = G[0].length;
	let sNode = new Node(Math.floor(s / cols), s % cols);
	let dNode = new Node(Math.floor(d / cols), d % cols);

	sNode = absGraph.insertNode(sNode);
	dNode = absGraph.insertNode(dNode);

	if (!sNode || !dNode) {
		console.log("source or destination cluster is blocked");
		return;
	}
	const absPath = search(sNode, dNode);
	//console.log(absPath);
	const realPath = refinePath(G, absGraph, absPath.path);
	//console.log(realPath);
	return {path: realPath.path, visited: realPath.visited};
}

/**
 * Takes a path found on the abstract graph and turns it into a path on the original grid.
 */
function refinePath(G, absGraph, absPath) {
	const path = [];
	const visited = [];
	for (let i = 1; i < absPath.length; i++) {
		const c1 = absGraph.getCluster(absPath[i - 1]);
		const c2 = absGraph.getCluster(absPath[i]);
		const s1 = globalToLocal(absPath[i - 1], c1);
		const d1 = globalToLocal(absPath[i], c1);
		if (c1 === c2) {
			// graph of the cluster
			const g = graphFromCluster(G, c1);
			// do A* on the cluster to get a path of node indices (relative to top-left of g)
			const cPath = aStar(g, abs(g, s1.row, s1.col), abs(g, d1.row, d1.col));
			// for each node of the path found in the cluster, convert local cluster coords
			// to global coords.
			for (const n of cPath.path) {
				const nCoords = localToGlobal(coords(g, n), c1);
				path.push(abs(G, nCoords.row, nCoords.col));
			}
			const cVisited = [];
			for (const n of cPath.visited) {
				const nCoords = localToGlobal(coords(g, n), c1);
				//cVisited.push(abs(G, nCoords.row, nCoords.col));
				visited.push(abs(G, nCoords.row, nCoords.col));
			}
			//visited.push(cVisited);
		}
	}
	return {path, visited};
}

function graphFromCluster(G, c) {
	return G.slice(c.top, c.bottom + 1).map(row => row.slice(c.left, c.right + 1));
}

/**
 * Maps a node from a local graph within a cluster into the global graph.
 * @param {Node} v - The node to be mapped from global to local space
 * @param {Cluster} c - The cluster that is considered local space.
 * @return {{row: {number}, col: {number}}}
 */
function localToGlobal(v, c) {
	const row = v.row + c.top;
	const col = v.col + c.left;
	return {row, col};
}

/**
 * Maps a node from the original graph into a graph of the cluster, with (0, 0) 
 * being relative to the top left of the cluster.
 * @param {Node} v - The node to be mapped from global to local space
 * @param {Cluster} c - The cluster that is considered local space.
 * @return {{row: {number}, col: {number}}}
 */
function globalToLocal(v, c) {
	const row = v.row - c.top;
	const col = v.col - c.left;
	return {row, col};
}

class AbstractGraph {
	constructor(G, cSize) {
		this.llGraph = G;
		this.cSize = cSize;
		this.clusters = buildClusters(G, cSize);
		this.entrances = buildEntrances(G, this.clusters);
		this.graph = buildGraph(G, this.clusters, this.entrances);
	}

	/**
	 * inserts a node into the abstract graph
	 * @param {{row: {number}, col: {number}}} n - node to be inserted
	 * @return {{row: {number}, col: {number}}} - node that was inserted. Returns
	 * 					      an existing node if one already exists
	 * 					      at the given row and col. Otherwise
	 * 					      returns the argument.
	 */
	insertNode(n) {
		const c = this.getCluster(n);
		const nodes = this.graph.get(c);

		// inserting into a cluster with no entrances
		if (nodes === undefined) {
			return null;
		}

		// a node already exists at this position, so return the
		// existing one.
		for (const w of nodes) {
			if (w.row == n.row && w.col == n.col) {
				return w;
			}
		}

		// insert new node into the graph
		for (const w of nodes) {
			const d = distance(this.llGraph, c, n, w);
			if (d > 0) {
				connect(n, w, d);
			}	
		}
		nodes.push(n);

		return n;
	}	

	getCluster(n) {
		const row = Math.floor(n.row / this.cSize);
		const col = Math.floor(n.col / this.cSize);
		return this.clusters[row][col];
	}
}

function buildGraph(G, clusters, entrances) {
	// build the INTER edges (edges between clusters)
	// map of cluster -> nodes
	const graph = new Map();
	for (const e of entrances) {
		// create 2 nodes: one each side of entrance
		const [n1, n2] = createNodes(e);

		// connect the two nodes
		connect(n1, n2, 1);

		// add the nodes to the graph, listed under their respective cluster.
		if (!graph.has(e.c1)) {
			graph.set(e.c1, [n1]);
		} else {
			graph.get(e.c1).push(n1);
		}
		if (!graph.has(e.c2)) {
			graph.set(e.c2, [n2]);
		} else {
			graph.get(e.c2).push(n2);
		}	
	}

	// build the INTRA edges (edges within a cluster)
	for (const row of clusters) {
		for (const c of row) {
			const nodes = graph.get(c);

			// in case an entire cluster was blocked and therefore not in the graph
			if (nodes == undefined) { 
				continue;
			}
			// iterate over all possible pairs and find shortest distances between them
			for (let i = 0; i < nodes.length - 1; i++) {
				for (let j = i + 1; j < nodes.length; j++) {
					const d = distance(G, c, nodes[i], nodes[j]);
					if (d > 0) {
						connect(nodes[i], nodes[j], d);
					}
				}
			}
		}
	}
	return graph;
	//console.log(graph);
}

function distance(G, c, n1, n2) {
	const cGraph = makeClusterGraph(G, c);
	const s = (n1.row - c.top) * cGraph.cols + (n1.col - c.left);
	const d = (n2.row - c.top) * cGraph.cols + (n2.col - c.left);
	const result = aStar(cGraph.nodes, s, d); 
	//console.log(n1.row + ", " + n1.col + " --> " + n2.row + ", " + n2.col + " : " + result.path.length);

	// substract 1 since path includes both src and dest. The real length shouldn't
	// include dest.
	return result.path.length - 1;
}

function makeClusterGraph(G, c) {
	const cGraph = G.slice(c.top, c.bottom + 1).map((row) =>
		row.slice(c.left, c.right + 1)
	);
	return {nodes: cGraph, rows: cGraph.length, cols: cGraph[0].length};
}

function connect(n1, n2, w) {
	n1.addNeighbor(n2, w);
	n2.addNeighbor(n1, w);
}

/**
 * Takes an entrance and adds 2 nodes on either side, bridging two clusters
 */
function createNodes(e) {
	//dx respective to c1
	const dx = e.c1.index.col - e.c2.index.col;
	//dy respective to c1
	const dy = e.c1.index.row - e.c2.index.row;
	let row1, col1;
	let row2, col2;
	
	if (dy == 1) {
		//up
		row1 = e.c1.top;
		col1 = e.start + Math.floor((e.end - e.start) / 2);
		row2 = e.c2.bottom;
		col2 = e.start + Math.floor((e.end - e.start) / 2);
	} else if (dy == -1) {
		//down
		row1 = e.c1.bottom;
		col1 = e.start + Math.floor((e.end - e.start) / 2);
		row2 = e.c2.top;
		col2 = e.start + Math.floor((e.end - e.start) / 2);
	} else if (dx == 1) {
		//left
		row1 = e.start + Math.floor((e.end - e.start) / 2);
		col1 = e.c1.left;
		row2 = e.start + Math.floor((e.end - e.start) / 2);
		col2 = e.c2.right;
	} else if (dx == -1) {
		//right
		row1 = e.start + Math.floor((e.end - e.start) / 2);
		col1 = e.c1.right;
		row2 = e.start + Math.floor((e.end - e.start) / 2);
		col2 = e.c2.left;
	}	
	return [new Node(row1, col1), new Node(row2, col2)];
}

function buildClusters(G, cSize) {
	const cols = G[0].length;
	const rows = G.length;
	const clusters = [];

	// NOTE: as of now, doesn't work if row and col size is not divisible by cSize
	for (let i = 0; i < rows; i += cSize) {
		const row = []
		for (let j = 0; j < cols; j += cSize) {
			row.push(new Cluster(cSize, i / cSize, j / cSize, i, j));
		}
		clusters.push(row);
	}	
	return clusters;
}

function buildEntrances(G, clusters) {
	const built = new Set();
	const E = new Set();
	for (const row of clusters) {
		for (const c of row) {
			built.add(c);

			for (const adjCluster of adjacent(clusters, c)) {
				if (!built.has(adjCluster)) {
					doBuildEntrance(G, E, c, adjCluster);
				}
			}
		}
	}
	return E;
}

function doBuildEntrance(G, E, c1, c2) {
	//dx respective to c1
	const dx = c1.index.col - c2.index.col;
	//dy respective to c1
	const dy = c1.index.row - c2.index.row;

	if (dy == 1) {
		//up
		let i = c1.top;
		for (let j = c1.left; j <= c1.right; j++) {
			let start = j;
			while (j <= c1.right && !isBlocked(G[i][j]) && !isBlocked(G[i - 1][j])) {
				j++;
			}
			if (start != j) {
				const end = start + (j - start);
				E.add(new Entrance(c1, c2, start, end));
			}
		}
	} else if (dy == -1) {
		//down
		let i = c1.bottom;
		for (let j = c1.left; j <= c1.right; j++) {
			let start = j;
			while (j <= c1.right && !isBlocked(G[i][j]) && !isBlocked(G[i + 1][j])) {
				j++;
			}
			if (start != j) {
				const end = start + (j - start);
				E.add(new Entrance(c1, c2, start, end));
			}
		}
	} else if (dx == 1) {
		//left
		let j = c1.left;
		for (let i = c1.top; i <= c1.bottom; i++) {
			let start = i;
			while (i <= c1.bottom && !isBlocked(G[i][j]) && !isBlocked(G[i][j - 1])) {
				i++;
			}
			if (start != i) {
				const end = start + (i - start);
				E.add(new Entrance(c1, c2, start, end));
			}
		}
	} else if (dx == -1) {
		//right
		let j = c1.right;
		for (let i = c1.top; i <= c1.bottom; i++) {
			let start = i;
			while (i <= c1.bottom && !isBlocked(G[i][j]) && !isBlocked(G[i][j + 1]))  {
				i++;
			}
			if (start != i) {
				const end = start + (i - start);
				E.add(new Entrance(c1, c2, start, end));
			}
		}
	}	
}

function adjacent(clusters, c) {
	const neighbors = [];
	//up
	if (c.index.row > 0) {
		neighbors.push(clusters[c.index.row - 1][c.index.col]);
	}
	//right
	if (c.index.col < clusters[0].length - 1) {
		neighbors.push(clusters[c.index.row][c.index.col + 1]);
	}
	//down
	if (c.index.row < clusters.length - 1) {
		neighbors.push(clusters[c.index.row + 1][c.index.col]);
	}
	//left
	if (c.index.col > 0) {
		neighbors.push(clusters[c.index.row][c.index.col - 1]);
	}
	return neighbors;
}

function isBlocked(node) {
	return node === NodeType.BLOCKED;
}

class Entrance {
	/**
	 * @param {Cluster} c1 - first cluster
	 * @param {Cluster} c2 - second cluster
	 * @param {number} start - the start pos of the edge (inclusive)
	 * @param {number} end - the end pos of the edge (not inclusive)
	 */
	constructor(c1, c2, start, end) {
		this.c1 = c1;
		this.c2 = c2;
		this.start = start;
		this.end = end;
	}
}

class Cluster {
	constructor(size, i, j, rowStart, colStart) {
		//index in the clusters array
		this.index = {row: i, col: j};
		//side lengths of cluster square
		this.size = size;
		this.left = colStart;
		this.right = colStart + size - 1;
		this.top = rowStart;
		this.bottom = rowStart + size - 1;
	}
}

class Node {
	constructor(row, col) {
		this.row = row;
		this.col = col;
		this.neighbors = [];
	}

	addNeighbor(n, w) {
		this.neighbors.push({n, w});
	}
}

function search(s, d) {
	const fringe = new PriorityQueue();
	const visited = new Map();
	const closed = new Set();

	fringe.push(s, h(s, d));
	visited.set(s, {par: null, g: 0, h: h(s, d), f: h(s, d)});
	
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
		for (const neighbor of v.neighbors) {
			const w = neighbor.n;
			const c = neighbor.w;
			const cost = vInfo.g + c;
			// If a node is closed, it can no longer be updated (this is fine since our 
			// heuristic is consistent).
			if (closed.has(w)) {
				continue;
			}
			// Either we've never seen this node before, or we have seen it
			// but the new cost is better than its previous cost.
			if (!visited.has(w) || cost < visited.get(w).g) {
				const hVal = h(w, d);
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

function h(v1, v2) {	
	return Math.abs(v1.row - v2.row) + Math.abs(v1.col - v2.col);
}

export default hpaStar;
