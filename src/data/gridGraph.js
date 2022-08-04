/* Immutable enum */
export const NodeType = Object.freeze({
	NORMAL: 1,
	BLOCKED: 2,
	SRC: 3,
	DST: 4
});

export function GridNode(row, col, type = NodeType.NORMAL) {
	this.row = row;
	this.col = col;
	this.type = type;
}

export function GridGraph(rows, cols) {
	this.rows = rows;
	this.cols = cols;
	this.nodes = initGridGraph();

	function initGridGraph() {
		let graph = [];
		for (let i = 0; i < rows * cols; i++) {
			graph.push(new GridNode(Math.floor(i / cols), i % cols));		
		}	
		return graph;
	}
}

export function setNodeType(graph, node, newType) {
	const index = node.row * graph.cols + node.col;
	return ({
		...graph,
		nodes: [
			...graph.nodes.slice(0, index),
			new GridNode(node.row, node.col, newType),
			...graph.nodes.slice(index + 1)
		]
	});
}

export default GridGraph;
