import React, { useState, useEffect, useReducer, useRef } from 'react';
import './App.css';
import Grid from './components/grid.js';
import Toolbar from './components/toolbar.js';
import DropDown from './components/dropdown.js';
import FloatingButton from './components/floating-button.js';
import { NodeType } from './node.js';
import bfs from './algorithms/bfs.js';
import dfs from './algorithms/dfs.js';
import iddfs from './algorithms/iterative-deepening.js';
import bidirectionalSearch from './algorithms/bidirectional-bfs.js';
import gbfs from './algorithms/greedy-best-first.js';
import aStar from './algorithms/a-star.js';
import hpaStar from './algorithms/hpa-star.js';
import jps from './algorithms/jps.js';
import ucs from './algorithms/uniform-cost-search.js';

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
	const timeoutInfo = useRef({timeouts: new Map(), longest: 0});

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
		for (const timeout of timeoutInfo.current.timeouts.keys()) {
			clearTimeout(timeout);
		}
		timeoutInfo.current = {timeouts: new Map(), longest: 0};
	}

	/*
	useEffect(() => {
		if (search !== "none") {
			doSearch(false);
		}
	}, [gridState.src, gridState.dst]);
	*/

	const doSearch = (animate=true) => {
		clearSearch();
		let result;
		switch (search) {
			case "BFS":
				console.time('bfs');
				result = bfs(gridState.nodes, gridState.src, gridState.dst);
				console.timeEnd('bfs');
				visualizeNormal(result.visited, result.path, animate);
				break;
			case "DFS":
				result = dfs(gridState.nodes, gridState.src, gridState.dst, true);
				visualizeNormal(result.visited, result.path, animate);
				break;
			case "IDDFS":
				result = iddfs(gridState.nodes, gridState.src, gridState.dst, 100);
				visualizeIDDFS(result.iterations, result.visited, result.path, animate);
				break;
			case "BDS":
				console.time('bds');
				result = bidirectionalSearch(gridState.nodes, gridState.src, gridState.dst);
				console.timeEnd('bds');
				visualizeBidirectional(result.visited1, result.visited2, result.path, animate);
				break;
			case "GBFS":
				console.time('gbfs');
				result = gbfs(gridState.nodes, gridState.src, gridState.dst);
				console.timeEnd('gbfs');
				visualizeNormal(result.visited, result.path, animate);
				break;
			case "A*":
				console.time('astar');
				result = aStar(gridState.nodes, gridState.src, gridState.dst);
				console.timeEnd('astar');
				visualizeNormal(result.visited, result.path, animate);
				break;
			case "HPA":
				console.time('hpa');
				result = hpaStar(gridState.nodes, gridState.src, gridState.dst, 5);
				console.timeEnd('hpa');
				visualizeNormal(result.visited, result.path, animate);
				break;
			case "JPS":
				console.time('jps');
				result = jps(gridState.nodes, gridState.src, gridState.dst);
				console.timeEnd('jps');
				visualizeNormal(result.visited, result.path, false);
				break;
			case "UCS":
				console.time('ucs');
				result = ucs(gridState.nodes, gridState.src, gridState.dst);
				console.timeEnd('jps');
				visualizeNormal(result.visited, result.path, animate);
				break;

		}
		console.log(result.path);
		//visualize(result.visited, result.path, animate);
	}

	const visualizeNormal = (visited, path, animate=true) => {
		draw({type: "visited", list: visited}, 0, animate);
		drawAfter({type: "path", list: path}, 1000, animate);
	}

	const visualizeBidirectional = (visitedSrc, visitedDst, path, animate=true) => {
		draw({type: "visited", list: visitedSrc}, 0, animate);
		draw({type: "visited", list: visitedDst}, 0, animate);
		drawAfter({type: "path", list: path}, 1000, animate);
	}

	const visualizeIDDFS = (visitedIterations, visitedFinal, path, animate=true) => {
		let i = 0;
		for (const iteration of visitedIterations) { 
			const delay = i > 0 ? 1000 : 0;
			if (i > 0) {
				setTimeout(() => {
					gridState.nodes.flat().forEach((_, index) => {
						const {i, j} = coords(index);
						updateGridCell(i, j, {type: 'reset'});
					})	
				}, timeoutInfo.current.longest + delay);
			}
			drawAfter({type: "visited", list: iteration}, delay, animate);
			i++;
		}
		drawAfter({type: "visited", list: visitedFinal}, 1000, animate);
		drawAfter({type: "path", list: path}, 1000, animate);
	}
	
	/**
	 * Updates elements in the grid after the the queued timeout with the highest timeout value
	 * is complete.
	 * @param {Array<number>} elements - Array of indexes to be updated.
	 * @param {number} offset - The offset (in milliseconds) from the currently set longest timeout.
	 * @param {boolean} animate - Draws the elements one after another if true.
	 */
	const drawAfter = (elements, offset=0, animate=true) => {
		draw(elements, timeoutInfo.current.longest + offset, animate);
	}

	/**
	 * Updates elements in the grid.
	 * @param {Array<number>} elements - Array of indexes to be updated.
	 * @param {number} delay - The delay (in milliseconds) from this call to start the draw.
	 * @param {boolean} animate - Draws the elements one after another if true.
	 */
	const draw = (elements, delay=0, animate=true) => {
		for (const elem of elements.list) {
			const {i, j} = coords(elem);
			if (animate) {
				if (delay > timeoutInfo.current.longest) {
					timeoutInfo.current.longest = delay;
				}
				const id = setTimeout(() => {
					updateGridCell(i, j, {type: elements.type});
					timeoutInfo.current.timeouts.delete(id);
				}, delay);
				timeoutInfo.current.timeouts.set(id, delay);
			} else {
				updateGridCell(i, j, {type: elements.type});
			}
			delay += delayInc;
		}
	}


	/* 
	 * OLD WAY
	const visualize = (visited, path, animate=true) => {
		if (animate) {		
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
		} else {
			for (const elem of visited) {
				const {i, j} = coords(elem);
				updateGridCell(i, j, {type: 'visited'});
			}
			for (const elem of path) {
				const {i, j} = coords(elem);
				updateGridCell(i, j, {type: 'path'});
			}
		}
	}
	*/

	/* TODO: Navbar
	 * 	- Move all algorithm options under a dropdown menu
	 * 	- Add "clear current search" button (clears only "visited" nodes)
	 * 	- Add "reset grid" button (clears all except src and dst) 
	 * 	- Add "new grid" button (clears ALL)
	 */
	return (
		<div> 
			<Toolbar>
				<DropDown title={"Algorithms"}>
					<button onClick={() => setSearch("BFS")}>Breadth-First Search</button>
					<button onClick={() => setSearch("DFS")}>Depth-First Search</button>
					<button onClick={() => setSearch("GBFS")}>Greedy Best First</button>
					<button onClick={() => setSearch("A*")}>A*</button>
					<button onClick={() => setSearch("UCS")}>Uniform-cost Search</button>
					<button onClick={() => setSearch("HPA")}>HPA*</button>
					<button onClick={() => setSearch("BDS")}>Bidirectional BFS</button>
					<button onClick={() => setSearch("JPS")}>Jump Point Search</button>
				</DropDown>
			</Toolbar>
			<Grid grid={gridState.nodes} updateGridCell={updateGridCell} />
			<FloatingButton onClick={doSearch}>{"Run " + search}</FloatingButton>
		</div>
	);
}

export default App;
