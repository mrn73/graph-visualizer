import React, { useState, useEffect, useReducer } from 'react';
import './App.css';
import Grid from './components/grid.js';
import Toolbar from './components/toolbar.js';
import { NodeType } from './data/gridGraph.js';
import { bfs } from './data/algorithms.js';

const cellSize = 30;
const rows = 25;
const cols = 60;
const delayInc = 5;

function initGrid(dim) {
	const size = dim.rows * dim.cols;
	let src = Math.floor(Math.random() * size);
	let dst;
	do {
		dst = Math.floor(Math.random() * size);
	} while (dst === src);

	return ({
		src,
		dst,
		nodes: Array(dim.rows).fill(null).map((_, i) => Array(dim.cols).fill(null).map((_, j) => {
				switch (i * dim.cols + j) {
					case src:
						return NodeType.SRC;
					case dst:
						return NodeType.DST;
					default:
						return NodeType.NORMAL;
				}
			})	
		)}
	);
}

function gridReducer(state, action) {
	switch (action.type) {
		case 'setBlocked':
			return {
				...state,
				nodes: [
					...state.nodes.slice(0, action.payload.row),
					[
						...state.nodes[action.payload.row].slice(0, action.payload.col),
						NodeType.BLOCKED,
						...state.nodes[action.payload.row].slice(action.payload.col + 1)
					],
					...state.nodes.slice(action.payload.row + 1)
				]
			};
		case 'setUnblocked':
			return {
				...state,
				nodes: [
					...state.nodes.slice(0, action.payload.row),
					[
						...state.nodes[action.payload.row].slice(0, action.payload.col),
						NodeType.NORMAL,
						...state.nodes[action.payload.row].slice(action.payload.col + 1)
					],
					...state.nodes.slice(action.payload.row + 1)
				]
			};
		case 'setVisited':
			return {
				...state,
				nodes: [
					...state.nodes.slice(0, action.payload.row),
					[
						...state.nodes[action.payload.row].slice(0, action.payload.col),
						NodeType.VISITED,
						...state.nodes[action.payload.row].slice(action.payload.col + 1)
					],
					...state.nodes.slice(action.payload.row + 1)
				]
			};
		case 'setPath':
			return {
				...state,
				nodes: [
					...state.nodes.slice(0, action.payload.row),
					[
						...state.nodes[action.payload.row].slice(0, action.payload.col),
						NodeType.PATH,
						...state.nodes[action.payload.row].slice(action.payload.col + 1)
					],
					...state.nodes.slice(action.payload.row + 1)
				]
			};
	}
}

function App() {	
	const [gridState, dispatch] = useReducer(gridReducer, {rows, cols}, initGrid);
	const [search, setSearch] = useState("none");

	const updateGridCell = (i, j, e, mouseState) => {
		if (gridState.nodes[i][j] !== NodeType.SRC && gridState.nodes[i][j] !== NodeType.DST) {
			if (e.type === "mousedown" && e.button == 0) {
				dispatch({type: 'setBlocked', payload: {row: i, col: j}});	
			} else if (e.type === "mousedown" && e.button == 2) {
				dispatch({type: 'setUnblocked', payload: {row: i, col: j}});	
			} else if (e.type === "mouseenter" && mouseState.isHeld == true && mouseState.button == 0) {
				dispatch({type: 'setBlocked', payload: {row: i, col: j}});
			} else if (e.type === "mouseenter" && mouseState.isHeld == true && mouseState.button == 2) {
				dispatch({type: "setUnblocked", payload: {row: i, col: j}});
			} else if (e.type === 'visited') {	
				dispatch({type: 'setVisited', payload: {row: i, col: j}});
			} else if (e.type === 'path') {
				dispatch({type: 'setPath', payload: {row: i, col: j}});
			}
		}
		//console.log(i + ", " + j);
	}

	const doBFS = () => {
		const result = bfs(gridState.nodes, gridState.src, gridState.dst);
		//console.log("path: " + result.path);
		//console.log("visited: " + result.visited);
		visualize(result.visited, result.path);
	}

	const visualize = (visited, path) => {
		let delay = 0;
		visited.forEach((elem) => 
			setTimeout(() => {
				const i = Math.floor(elem / cols);
				const j = elem % cols;
				updateGridCell(i, j, {type: 'visited'});
			}, (delay += delayInc))
		);
		path.forEach((elem) =>
			setTimeout(() => {
				const i = Math.floor(elem / cols);
				const j = elem % cols;
				updateGridCell(i, j, {type: 'path'});
			}, (delay += delayInc))
		);
	}

	return (
		<div> 
			<Toolbar>
				<button onClick={doBFS}>BFS</button>
				<button>DFS</button>
			</Toolbar>
			<Grid grid={gridState.nodes} updateGridCell={updateGridCell} />
		</div>
	);
}

export default App;
