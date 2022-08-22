import React, { useState, useEffect, useReducer } from 'react';
import './App.css';
import Grid from './components/grid.js';
import Toolbar from './components/toolbar.js';
import FloatingButton from './components/floating-button.js';
import { NodeType } from './node.js';
import bfs from './algorithms/bfs.js';
import dfs from './algorithms/dfs.js';
import iddfs from './algorithms/iterative-deepening.js';
import bidirectionalSearch from './algorithms/bidirectional-bfs.js';

const cellSize = 30;
const rows = 25;
const cols = 60;
const delayInc = 5;

function coords(index) {
	return {i: Math.floor(index / cols), j: index % cols}; 
}

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

/*
 * TODO: Somehow clean up this atrocity.
 * 	 (probably have cases determine what NodeType to set, then break
 * 	  and plug it in outside of the switch statement for resuse)
 */
function gridReducer(state, action) {
	let row, col;
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
		case 'setSrc':
			const newSrc = action.payload.row * cols + action.payload.col; 
			return {
				...state,
				src: newSrc,
				nodes: [
					...state.nodes.slice(0, action.payload.row),
					[
						...state.nodes[action.payload.row].slice(0, action.payload.col),
						NodeType.SRC,
						...state.nodes[action.payload.row].slice(action.payload.col + 1)
					],
					...state.nodes.slice(action.payload.row + 1)
				]
			};
		case 'unsetSrc':
			if (state.src === null) { return state; }
			row = Math.floor(state.src / cols);
			col = state.src % cols;
			return {
				...state,
				src: null,
				nodes: [
					...state.nodes.slice(0, row),
					[
						...state.nodes[row].slice(0, col),
						NodeType.NORMAL,
						...state.nodes[row].slice(col + 1)
					],
					...state.nodes.slice(row + 1)
				]
			};
		case 'setDst':
			const newDst = action.payload.row * cols + action.payload.col; 
			return {
				...state,
				dst: newDst,
				nodes: [
					...state.nodes.slice(0, action.payload.row),
					[
						...state.nodes[action.payload.row].slice(0, action.payload.col),
						NodeType.DST,
						...state.nodes[action.payload.row].slice(action.payload.col + 1)
					],
					...state.nodes.slice(action.payload.row + 1)
				]
			};
		case 'unsetDst':
			if (state.dst === null) { return state; }
			row = Math.floor(state.dst / cols);
			col = state.dst % cols;
			return {
				...state,
				dst: null,
				nodes: [
					...state.nodes.slice(0, row),
					[
						...state.nodes[row].slice(0, col),
						NodeType.NORMAL,
						...state.nodes[row].slice(col + 1)
					],
					...state.nodes.slice(row + 1)
				]
			};
		default:
			return state;
	}
}

function App() {	
	const [gridState, dispatch] = useReducer(gridReducer, {rows, cols}, initGrid);
	const [search, setSearch] = useState("none");
	const [movingSrc, setMovingSrc] = useState(false);
	const [movingDst, setMovingDst] = useState(false);

	const updateGridCell = (i, j, e, mouseState) => {
		if (e.type === 'mouseup' && movingSrc == true) {
			setMovingSrc(false);
		} else if (e.type === 'mouseup' && movingDst == true) {
			setMovingDst(false);
		} else if (gridState.nodes[i][j] === NodeType.SRC) {
			if (e.type === 'mousedown' && e.button == 0) {
				setMovingSrc(true);
			}
		} else if (gridState.nodes[i][j] === NodeType.DST) {
			if (e.type === 'mousedown' && e.button == 0) {
				setMovingDst(true);
			}
		} else if (gridState.nodes[i][j] === NodeType.BLOCKED) {
			if (e.type === "mousedown" && e.button == 2) {
				dispatch({type: 'setUnblocked', payload: {row: i, col: j}});	
			} else if (e.type === "mouseenter" && mouseState.isHeld == true && mouseState.button == 2) {
				dispatch({type: "setUnblocked", payload: {row: i, col: j}});
			} 
		} else {
			if (e.type === "mousedown" && e.button == 0) {
				dispatch({type: 'setBlocked', payload: {row: i, col: j}});	
			} else if (e.type === 'mouseenter' && movingSrc == true) {
				dispatch({type: 'unsetSrc'});
				dispatch({type: 'setSrc', payload: {row: i, col: j}});
			} else if (e.type === 'mouseenter' && movingDst == true) {
				dispatch({type: 'unsetDst'});
				dispatch({type: 'setDst', payload: {row: i, col: j}});
			} else if (e.type === "mouseenter" && mouseState.isHeld == true && mouseState.button == 0) {
				dispatch({type: 'setBlocked', payload: {row: i, col: j}});
			} else if (e.type === 'visited') {	
				dispatch({type: 'setVisited', payload: {row: i, col: j}});
			} else if (e.type === 'path') {
				dispatch({type: 'setPath', payload: {row: i, col: j}});
			} else if (e.type === 'reset') {
				dispatch({type: 'setUnblocked', payload: {row: i, col: j}});
			} else if (e.type === 'mouseenter' && movingSrc == true) {
				dispatch({type: 'unsetSrc'});
				dispatch({type: 'setSrc', payload: {row: i, col: j}});
			} else if (e.type === 'mouseenter' && movingDst == true) {
				dispatch({type: 'unsetDst'});
				dispatch({type: 'setDst', payload: {row: i, col: j}});
			}
		}
	}

	const clearSearch = () => {	
		gridState.nodes.flat().forEach((_, index) => {
			const {i, j} = coords(index);
			updateGridCell(i, j, {type: 'reset'});
		});	
	}

	const doSearch = () => {
		clearSearch();
		let result;
		switch (search) {
			case "BFS":
				result = bfs(gridState.nodes, gridState.src, gridState.dst);
				break;
			case "DFS":
				result = dfs(gridState.nodes, gridState.src, gridState.dst, true);
				break;
			case "IDDFS":
				result = iddfs(gridState.nodes, gridState.src, gridState.dst, 25);
				//visualizeIteration(result.iterations);
				break;
			case "BDS":
				//result = bidirectionalSearch(gridState.nodes, gridState.src, gridState.dst);
				break;

		}
		visualize(result.visited, result.path);
	}

	/* TODO: Generalize this function
	 * 	- "visited" should be an array of arrays, where each element of an array
	 * 	  is drawn with a delay and there's an additional delay between the arrays 
	 * 	  themselves.
	 * 	- Add an "animate" option -- enabled adds delays; disabled draws all at once.
	 */
	const visualize = (visited, path) => {
		let delay = 0;
		visited.forEach((elem) => 
			setTimeout(() => {
				const {i, j} = coords(elem);
				updateGridCell(i, j, {type: 'visited'});
			}, (delay += delayInc))
		);
		delay += 500;
		path.forEach((elem) =>
			setTimeout(() => {
				const {i, j} = coords(elem);
				updateGridCell(i, j, {type: 'path'});
			}, (delay += delayInc))
		);
	}

	/* TODO: Navbar
	 * 	- Move all algorithm options under a dropdown menu
	 * 	- Add "clear current search" button (clears only "visited" nodes)
	 * 	- Add "reset grid" button (clears all except src and dst) 
	 * 	- Add "new grid" button (clears ALL)
	 */
	return (
		<div> 
			<Toolbar>
				<button onClick={() => setSearch("BFS")}>BFS</button>
				<button onClick={() => setSearch("DFS")}>DFS</button>
				<button onClick={() => setSearch("IDDFS")}>IDDFS</button>
				<button onClick={() => setSearch("A*")}>A*</button>
				<button onClick={() => setSearch("Jump Point Search")}>Jump Point Search</button>
				<button onClick={() => setSearch("BDS")}>Bidirectional Search</button>
			</Toolbar>
			<Grid grid={gridState.nodes} updateGridCell={updateGridCell} />
			<FloatingButton onClick={doSearch}>{"Run " + search}</FloatingButton>
		</div>
	);
}

export default App;
