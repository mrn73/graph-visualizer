import React, { useState, useEffect, useReducer, useRef } from 'react';
import './App.css';
import Grid from './components/grid.js';
import Toolbar from './components/toolbar.js';
import DropDown from './components/dropdown.js';
import FloatingButton from './components/floating-button.js';
import KeyBar from './components/key-bar.js';
import FlexBox from './components/flex-box.js';
import { NodeType, getDefaultWeights } from './node.js';
import bfs from './algorithms/bfs.js';
import dfs from './algorithms/dfs.js';
import iddfs from './algorithms/iterative-deepening.js';
import bidirectionalSearch from './algorithms/bidirectional-bfs.js';
import gbfs from './algorithms/greedy-best-first.js';
import aStar from './algorithms/a-star.js';
import hpaStar from './algorithms/hpa-star.js';
import jps from './algorithms/jps.js';
import ucs from './algorithms/uniform-cost-search.js';
import SearchData from './data/searchesInfo.json';
import { generateWorld } from './algorithms/gen-world.js';

const cellSize = 30;
const rows = 25; //25
const cols = 60; //60 
const delayInc = 5;

function coords(index) {
	return {i: Math.floor(index / cols), j: index % cols}; 
}

function absolute(i, j) {
	return i * cols + j;
}

function initGrid(dim, simplex=false) {
	let nodes;
	if (simplex) {		
		nodes = generateWorld(dim.rows, dim.cols);		
	} else {
		nodes = Array(dim.rows).fill().map(() => new Array(dim.cols).fill(NodeType.NORMAL));
	}

	const size = dim.rows * dim.cols;
	let src = Math.floor(Math.random() * size);
	let dst;
	do {
		dst = Math.floor(Math.random() * size);
	} while (dst === src);

	return ({
		src,
		dst,
		nodes
	});
}

function simplexWorld(dim) {
	return initGrid(dim, true);
}

function randomizeGrid(dim, blockedThresh=.1, grid=null) {
	const size = dim.rows * dim.cols;
	const newGrid = grid ? structuredClone(grid) : initGrid(dim);
	let numBlocked = 0;
	while ((numBlocked / size) < blockedThresh) {
		const n = Math.floor(Math.random() * size);	
		const nCoords = coords(n);
		if (newGrid.nodes[nCoords.i][nCoords.j] === NodeType.NORMAL) {
			newGrid.nodes[nCoords.i][nCoords.j] = NodeType.BLOCKED;
			numBlocked++;
		}
	}
	return newGrid;
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
						action.payload.nodeType,
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
				src: newSrc
			};
		case 'setDst':
			const newDst = action.payload.row * cols + action.payload.col; 
			return {
				...state,
				dst: newDst
			};
		case 'randomize':
			//return randomizeGrid({rows, cols});
			return randomizeGrid(action.payload.dim, action.payload.blocked, action.payload.grid);
		case 'simplex':
			//return simplexWorld({rows, cols});
			return action.payload;
		case 'reset':
			return action.payload;
		default:
			return state;
	}
}

function App() {	
	// Unorthodox way of having a lazy useRef, since initGrid would run every time with useRef.
	const gridRef = useState(() => ({current: initGrid({rows, cols})}))[0];
	const [gridState, dispatch] = useReducer(gridReducer, gridRef.current);
	const [search, setSearch] = useState("none");
	const [movingSrc, setMovingSrc] = useState(false);
	const [movingDst, setMovingDst] = useState(false);
	const timeoutInfo = useRef({timeouts: new Map(), longest: 0});
	const nodeWeight = useRef(getDefaultWeights());
	const searchState = useRef({isSearching: false, animate: true});

	const updateGridCell = (i, j, e, mouseState) => {
		if (e.type === 'mouseup' && movingSrc == true) {
			setMovingSrc(false);
		} else if (e.type === 'mouseup' && movingDst == true) {
			setMovingDst(false);
		} else if (absolute(i, j) == gridState.src) {
			if (e.type === 'mousedown' && e.button == 0) {
				setMovingSrc(true);
			}
		} else if (absolute(i, j) == gridState.dst) {
			if (e.type === 'mousedown' && e.button == 0) {
				setMovingDst(true);
			}
		} else if (gridState.nodes[i][j] === NodeType.BLOCKED) {
			if (e.type === "mousedown" && e.button == 2
				|| e.type === "mouseenter" && mouseState.isHeld == true && mouseState.button == 2
				|| e.type === "clearall") {
				dispatch({type: 'setUnblocked', payload: {row: i, col: j, nodeType: gridRef.current.nodes[i][j]}});
			}
		} else {
			if (e.type === "mousedown" && e.button == 0) {
				dispatch({type: 'setBlocked', payload: {row: i, col: j}});	
			} else if (e.type === 'mouseenter' && movingSrc == true) {
				dispatch({type: 'setSrc', payload: {row: i, col: j}});
			} else if (e.type === 'mouseenter' && movingDst == true) {
				dispatch({type: 'setDst', payload: {row: i, col: j}});
			} else if (e.type === "mouseenter" && mouseState.isHeld == true && mouseState.button == 0) {
				dispatch({type: 'setBlocked', payload: {row: i, col: j}});
			} else if (e.type === 'visited') {	
				dispatch({type: 'setVisited', payload: {row: i, col: j}});
			} else if (e.type === 'path') {
				dispatch({type: 'setPath', payload: {row: i, col: j}});
			} else if (e.type === 'clearsearch' || e.type === 'clearall') {
				dispatch({type: 'setUnblocked', payload: {row: i, col: j, nodeType: gridRef.current.nodes[i][j]}});
			} else if (e.type === 'mouseenter' && movingSrc == true) {
				dispatch({type: 'unsetSrc'});
				dispatch({type: 'setSrc', payload: {row: i, col: j}});
			} else if (e.type === 'mouseenter' && movingDst == true) {
				dispatch({type: 'unsetDst'});
				dispatch({type: 'setDst', payload: {row: i, col: j}});
			}
		}
	}

	const setGrid = (t) => {
		switch (t) {
			case "empty":
				gridRef.current = initGrid({rows, cols});
				dispatch({type: "empty", payload: gridRef.current});
				break;
			case "randomize":
				gridRef.current = initGrid({rows, cols});
				console.log(gridRef.current);
				dispatch({type: "randomize", payload: {dim: {rows, cols}, blocked: .1, grid: gridRef.current}});
				break;
			case "simplex":
				gridRef.current = simplexWorld({rows, cols});
				dispatch({type: "simplex", payload: gridRef.current});
				break;
		}
		console.log(gridRef.current);
	}

	/**
	 * Cancels all pending animations.
	 */
	const cancelSearch = () => {
		for (const timeout of timeoutInfo.current.timeouts.keys()) {
			clearTimeout(timeout);
		}
		timeoutInfo.current = {timeouts: new Map(), longest: 0};
	}

	const clearSearch = (clearVisited, clearPath) => {	
		cancelSearch();
		const newGrid = structuredClone(gridState);
		newGrid.nodes.flat().forEach((_, index) => {
			const {i, j} = coords(index);
			if ((clearVisited && newGrid.nodes[i][j] == NodeType.VISITED)
				|| (clearPath && newGrid.nodes[i][j] == NodeType.PATH)) {
				newGrid.nodes[i][j] = gridRef.current.nodes[i][j];
			}
		});	
		dispatch({type: "reset", payload: newGrid});
	}

	const clearAll = () => {
		dispatch({type: "reset", payload: gridRef.current});
		cancelSearch();
	}

	/**
	 * Updates the underlying grid whenever the source or destination are changed
	 * on the visible grid.
	 */
	useEffect(() => {
		gridRef.current.src = gridState.src;
		gridRef.current.dst = gridState.dst;
	}, [gridState.src, gridState.dst]);


	/**
	 * Starts the search.
	 * Clears the previous search which will trigger a rerender, where the search
	 * will begin on the next render inside the useEffect below.
	 * @param {boolean} animate - Whether or not we animate the search.
	 */
	const startSearch = (animate=true) => {
		clearSearch(true, true);
		searchState.current = {isSearching: true, animate};
	}

	/**
	 * Performs the search trigged by startSearch.
	 * Ensures that the search begins once the grid is cleared of the previous search.
	 */
	useEffect(() => {
		if (searchState.current.isSearching) {
			console.log(gridState.nodes);
			doSearch(searchState.current.animate);
			searchState.current.isSearching = false;
		}
	}, [gridState]);

	const doSearch = (animate=true) => {
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
				console.log(result.pathWeight);
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

	const searchProps = SearchData[search].properties;
	return (
		<div> 
			<Toolbar>
				<DropDown title={"Algorithms"}>
					<p><b>Uninformed Searches</b></p>
					<hr/>
					<button onClick={() => setSearch("BFS")}>Breadth-First Search</button>
					<button onClick={() => setSearch("DFS")}>Depth-First Search</button>
					<button onClick={() => setSearch("UCS")}>Uniform-Cost Search</button>
					<button onClick={() => setSearch("BDS")}>Bidirectional BFS</button>
					<p><b>Informed Searches</b></p>
					<hr/>
					<button onClick={() => setSearch("GBFS")}>Greedy Best-First Search</button>
					<button onClick={() => setSearch("A*")}>A*</button>
					<button onClick={() => setSearch("HPA")}>Hierarchical Pathfinding A*</button>
					<button onClick={() => setSearch("JPS")}>Jump Point Search</button>
				</DropDown>
				<DropDown title={"Grid"}>	
					<button onClick={() => setGrid("randomize")}>Randomize</button>
					<button onClick={() => setGrid("simplex")}>Simplex World</button>
					<hr/>
					<button onClick={() => clearSearch(true, true)}>Clear Search</button>
					<button onClick={() => clearSearch(true, false)}>Clear Visited</button>
					<button onClick={clearAll}>Clear All</button>
				</DropDown>
				<button onClick={startSearch}>{"Run " + search}</button>
			</Toolbar>
			<div className="appBody">
				<KeyBar>{Object.values(NodeType)}</KeyBar>
				<h3>{SearchData[search].title}</h3>
				{searchProps ? 
				<FlexBox>
					<p>Weighted: <span style={{color: searchProps.weighted ? 'green' : 'red'}}><b>{searchProps.weighted ? "YES" : "NO"}</b></span></p>
					<p>Shortest Path: <span style={{color: searchProps.shortestPath ? 'green' : 'red'}}><b>{searchProps.shortestPath ? "YES" : "NO"}</b></span></p>
				</FlexBox> : null}
				<Grid 
					grid={gridState.nodes} 
					start={coords(gridState.src)}
					end={coords(gridState.dst)}
					updateGridCell={updateGridCell}
				/>
			</div>
		</div>
	);
	
	//<FloatingButton onClick={doSearch}>{"Run " + search}</FloatingButton>
}

export default App;
