import React, { useState, useEffect, useReducer, useRef } from 'react';
import './App.css';
import Grid from './components/grid.js';
import Toolbar from './components/toolbar.js';
import DropDown from './components/dropdown.js';
import KeyBar from './components/key-bar.js';
import FlexBox from './components/flex-box.js';
import { NodeType } from './node.js';
import bfs from './algorithms/bfs.js';
import dfs from './algorithms/dfs.js';
import bidirectionalSearch from './algorithms/bidirectional-bfs.js';
import gbfs from './algorithms/greedy-best-first.js';
import aStar from './algorithms/a-star.js';
import hpaStar from './algorithms/hpa-star.js';
import jps from './algorithms/jps.js';
import ucs from './algorithms/uniform-cost-search.js';
import SearchData from './data/searchesInfo.json';
import { generateWorld } from './algorithms/gen-world.js';
import SettingsMenu from './components/settings-menu.js';
import settingsData from './data/settings.json';

const cellSize = 25;
const rows = Math.floor(window.innerHeight / cellSize); //25
const cols = Math.floor(window.innerWidth / cellSize); //60 

function coords(index, cols) {
	return {i: Math.floor(index / cols), j: index % cols}; 
}

function absolute(i, j, cols) {
	return i * cols + j;
}

function initGrid(dim, simplex=false) {
	let nodes;
	if (simplex) {		
		nodes = generateWorld(dim.rows, dim.cols);		
	} else {
		nodes = Array(dim.rows).fill().map(() => new Array(dim.cols).fill(NodeType.NORMAL));
	}

	//subtract 1 since our grid goes slightly over the edge of window.
	const size = (dim.rows - 1) * (dim.cols - 1);
	let src = Math.floor(Math.random() * size);
	let dst;
	do {
		dst = Math.floor(Math.random() * size);
	} while (dst === src);

	return ({
		src,
		dst,
		rows: dim.rows,
		cols: dim.cols,
		nodes,
		terrain: structuredClone(nodes)
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
		const nCoords = coords(n, dim.cols);
		if (newGrid.nodes[nCoords.i][nCoords.j] === NodeType.NORMAL) {
			newGrid.nodes[nCoords.i][nCoords.j] = NodeType.BLOCKED;
			numBlocked++;
		}
	}
	const srcCoords = coords(newGrid.src, dim.cols);
	newGrid.nodes[srcCoords.i][srcCoords.j] = NodeType.NORMAL;
	const dstCoords = coords(newGrid.dst, dim.cols);
	newGrid.nodes[dstCoords.i][dstCoords.j] = NodeType.NORMAL;

	return newGrid;
}

function setDefaultSettings() {
	const settings = new Map();
	for (const setting in settingsData) {
		settings.set(setting, settingsData[setting]);
	}
	return settings;
}

/*
 * TODO: Somehow clean up this atrocity.
 * 	 (probably have cases determine what NodeType to set, then break
 * 	  and plug it in outside of the switch statement for resuse)
 */
function gridReducer(state, action) {
	switch (action.type) {
		case 'setNode':
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
				],
			};
		case 'setSrc':
			const newSrc = action.payload.row * state.cols + action.payload.col; 
			return {
				...state,
				src: newSrc
			};
		case 'setDst':
			const newDst = action.payload.row * state.cols + action.payload.col; 
			return {
				...state,
				dst: newDst
			};
		case 'randomize':
			return randomizeGrid({rows: state.rows, cols: state.cols}, action.payload);
		case 'simplex':
			return simplexWorld({rows: state.rows, cols: state.cols});
		case 'empty':
			return {
				...state,
				nodes: Array(state.rows).fill().map(() => new Array(state.cols).fill(NodeType.NORMAL)),
				terrain: Array(state.rows).fill().map(() => new Array(state.cols).fill(NodeType.NORMAL))	
			}
		case 'setGrid':
			return action.payload;
		case 'resize':
			const prevRows = state.rows;
			const prevCols = state.cols;
			const newState = structuredClone(state.nodes);
			const newTerrain = structuredClone(state.terrain);

			/* Shrink the grid down to fit the window. If the window wasn't shrunk, this won't do anything */
			newState.splice(action.payload.rows);
			newState.map((row) => row.splice(action.payload.cols));
			newTerrain.splice(action.payload.rows);
			newTerrain.map((row) => row.splice(action.payload.cols));

			/* If src is now out of bounds, move it in bounds */
			const srcCoords = coords(state.src, prevCols);
			if (srcCoords.i >= action.payload.rows) {
				srcCoords.i = action.payload.rows - 2;
			}
			if (srcCoords.j >= action.payload.cols) {
				srcCoords.j = action.payload.cols - 2;
			}

			/* If dst is now out of bounds, move it in bounds */
			const dstCoords = coords(state.dst, prevCols);
			if (dstCoords.i >= action.payload.rows) {
				dstCoords.i = action.payload.rows - 2;
			}
			if (dstCoords.j >= action.payload.cols) {
				dstCoords.j = action.payload.cols - 2;
			}

			/* If our window is longer (more rows), add the rows to fit the height */
			if (action.payload.rows > prevRows) {
				const rowDif = action.payload.rows - prevRows;
				for (let i = 0; i < rowDif; i++) {
					newState.push(new Array(state.cols).fill(NodeType.NORMAL));
					newTerrain.push(new Array(state.cols).fill(NodeType.NORMAL));
				}
			}
			/* If our window is wider (more columns), add the columns to fit the width */
			if (action.payload.cols > prevCols) {
				const colDif = action.payload.cols - prevCols;
				for (let j = 0; j < colDif; j++) {
					newState.map((row) => row.push(NodeType.NORMAL));
					newTerrain.map((row) => row.push(NodeType.NORMAL));
				}
			}
			return {
				src: absolute(srcCoords.i, srcCoords.j, action.payload.cols),
				dst: absolute(dstCoords.i, dstCoords.j, action.payload.cols),
				rows: action.payload.rows,
				cols: action.payload.cols,
				nodes: newState,
				terrain: newTerrain
			}
		default:
			return state;
	}
}

function App() {	
	const [gridState, dispatch] = useReducer(gridReducer, {rows, cols}, initGrid);
	const [search, setSearch] = useState("none");
	const [prevSearchInfo, setPrevSearchInfo] = useState(null);
	const [hpa, setHpa] = useState(null);
	const timeoutInfo = useRef({timeouts: new Map(), longest: 0});
	const searchState = useRef({isSearching: false, animate: true});
	const container = useRef(null);
	const [settings, setSettings] = useState(() => setDefaultSettings());
	const [showSettings, setShowSettings] = useState(false);

	useEffect(() => {
		const weights = {};
		weights[NodeType.NORMAL] = settings.get("weightNormal").value;
		weights[NodeType.DEEPWATER] = settings.get("weightDeepWater").value;
		weights[NodeType.WATER] = settings.get("weightWater").value;
		weights[NodeType.SAND] = settings.get("weightSand").value;
		weights[NodeType.FOREST] = settings.get("weightForest").value;
		weights[NodeType.GRASSLAND] = settings.get("weightGrassland").value;
		weights[NodeType.ROCK] = settings.get("weightRock").value;
		weights[NodeType.SNOW] = settings.get("weightSnow").value;
		window.nodeWeights = weights;
	}, [settings]);

	const changeSettings = (settings) => {
		setSettings(settings);
	}

	const updateGridCell = (i, j, type) => {
		dispatch({type: 'setNode', payload: {row: i, col: j, nodeType: type}});	
	}

	const setGrid = (t) => {
		switch (t) {
			case "empty":
				dispatch({type: "empty"});
				break;
			case "randomize":
				dispatch({type: "randomize", payload: settings.get("blockedPercent").value});
				break;
			case "simplex":
				dispatch({type: "simplex"});
				break;
		}
	}
	
	useEffect(() => {
		if (search === "HPA") {
			const grid = getClearedSearch(true, true);
			const hpa = hpaStar(grid.nodes, 
					grid.src, 
					grid.dst, 
					settings.get("hpaClusterSize").value);
			const entrances = Array(grid.rows).fill().map(() => new Array(grid.cols).fill(null));
			for (const n of hpa.absGraph.getNodes()) {
				entrances[n.row][n.col] = 'ENTRANCE';
			}
			setHpa({hpaObject: hpa, entrances});
		} else if (search !== "HPA") {
			setHpa(null);
		}
	}, [search, gridState, settings]);


	/**
	 * Cancels all pending animations.
	 */
	const cancelSearch = () => {
		for (const timeout of timeoutInfo.current.timeouts.keys()) {
			clearTimeout(timeout);
		}
		timeoutInfo.current = {timeouts: new Map(), longest: 0};
	}

	/**
	 * Makes a copy of the grid's state with the visited and/or path nodes cleared.
	 * NOTE: DOES NOT visibly show changes (see clearSearch function).
	 * @param {boolean} clearVisited
	 * @param {boolean} clearPath
	 * @return {Object} new grid state.
	 */
	const getClearedSearch = (clearVisited, clearPath) => {
		const newGrid = structuredClone(gridState);
		newGrid.nodes.flat().forEach((_, index) => {
			const {i, j} = coords(index, gridState.cols);
			if ((clearVisited && newGrid.nodes[i][j] === NodeType.VISITED)
				|| (clearPath && newGrid.nodes[i][j] === NodeType.PATH)) {
				newGrid.nodes[i][j] = gridState.terrain[i][j];
			}
		});	
		return newGrid;
	}

	/**
	 * Cancels any pending draws and clears all existing visited and/or path nodes.
	 * @param {boolean} clearVisited
	 * @param {boolean} clearPath
	 * @return {Object} new grid state.
	 */
	const clearSearch = (clearVisited, clearPath) => {	
		cancelSearch();
		const newGrid = getClearedSearch(clearVisited, clearPath);
		dispatch({type: "setGrid", payload: newGrid});
		return newGrid;
	}

	/**
	 * Clears the entire board, leaving only the src and dst nodes.
	 */
	const clearAll = () => {
		dispatch({type: "empty"});
		cancelSearch();
	}


	/**
	 * Starts the search.
	 * Clears the previous search which will trigger a rerender, where the search
	 * will begin on the next render inside the useEffect below.
	 */
	const startSearch = () => {
		const clearedGrid = clearSearch(true, true);
		doSearch(settings.get("animate").value, clearedGrid);
	}

	const doSearch = (animate=true, grid=gridState) => {
		let result;
		const optLen = aStar(grid.nodes, grid.src, grid.dst).path.length - 1;
		switch (search) {
			case "BFS":
				console.time('bfs');
				result = bfs(grid.nodes, grid.src, grid.dst);
				console.timeEnd('bfs');
				visualizeNormal(result.visited, result.path, animate);
				break;
			case "DFS":
				result = dfs(grid.nodes, grid.src, grid.dst, true);
				visualizeNormal(result.visited, result.path, animate);
				break;
			case "BDS":
				console.time('bds');
				result = bidirectionalSearch(grid.nodes, grid.src, grid.dst);
				console.timeEnd('bds');
				visualizeBidirectional(result.visited1, result.visited2, result.path, animate);
				break;
			case "GBFS":
				console.time('gbfs');
				result = gbfs(grid.nodes, grid.src, grid.dst);
				console.timeEnd('gbfs');
				visualizeNormal(result.visited, result.path, animate);
				break;
			case "A*":
				console.time('astar');
				result = aStar(grid.nodes, grid.src, grid.dst);
				console.timeEnd('astar');
				visualizeNormal(result.visited, result.path, animate);
				break;
			case "HPA":
				console.time('hpa');
				result = hpa.hpaObject.run();
				console.timeEnd('hpa');
				visualizeNormal(result.visited, result.path, animate);
				break;
			case "JPS":
				console.time('jps');
				result = jps(grid.nodes, grid.src, grid.dst);
				console.timeEnd('jps');
				visualizeNormal(result.visited, result.path, false);
				break;
			case "UCS":
				console.time('ucs');
				result = ucs(grid.nodes, grid.src, grid.dst);
				console.timeEnd('jps');
				visualizeNormal(result.visited, result.path, animate);
				break;

		}
		if (search == "HPA") {
			setPrevSearchInfo({
				Search: search,
				"Operations (Abstract Graph)": result.absPathOps,
				"Operations (Real Graph)": result.realPathOps,
				"Total Operations": result.ops, 
				Length: result.path.length - 1, 
				"True shortest length": optLen
			});
		} else {
			setPrevSearchInfo({
				Search: search,
				Operations: result.ops, 
				Length: result.path.length - 1, 
				"True shortest length": optLen
			});
		}
		//console.log(result.path);
		//visualize(result.visited, result.path, animate);
	}

	const visualizeNormal = (visited, path, animate=true) => {
		draw({type: NodeType.VISITED, list: visited}, 0, animate);
		drawAfter({type: NodeType.PATH, list: path}, 1000, animate);
	}

	const visualizeBidirectional = (visitedSrc, visitedDst, path, animate=true) => {
		draw({type: NodeType.VISITED, list: visitedSrc}, 0, animate);
		draw({type: NodeType.VISITED, list: visitedDst}, 0, animate);
		drawAfter({type: NodeType.PATH, list: path}, 1000, animate);
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
		const animationSpeed = settings.get("animationSpeed");
		const scalar = 5; //scales default setting to not be too fast
		const delayInc = (scalar * animationSpeed.default) / animationSpeed.value;
		for (const elem of elements.list) {
			const {i, j} = coords(elem, gridState.cols);
			if (animate) {
				if (delay > timeoutInfo.current.longest) {
					timeoutInfo.current.longest = delay;
				}
				const id = setTimeout(() => {
					updateGridCell(i, j, elements.type);
					timeoutInfo.current.timeouts.delete(id);
				}, delay);
				timeoutInfo.current.timeouts.set(id, delay);
			} else {
				updateGridCell(i, j, elements.type);
			}
			delay += delayInc;
		}
	}

	useEffect(() => {
		function setSize() {
			const dim = container.current.getBoundingClientRect();
			/*
			 * -1 on cellSize because margin-right/bottom = -1, so every cell is shifted left/up 1. Add 1
			 * to the rows/cols so it goes 1 extra row/col out of bounds for a full appearance.
			 */
			const rows = Math.floor(dim.height / (cellSize - 1)) + 1;
			const cols = Math.floor(dim.width / (cellSize - 1)) + 1;
			//console.log(dim.width);
			//console.log("Rows: " + rows + " | Cols: " + cols);
			dispatch({type: "resize", payload: {rows, cols}});
		}
		setSize();
		window.addEventListener("resize", setSize);
		return () => {
		    window.removeEventListener("resize", setSize);
		}
	}, []);	

	const searchProps = SearchData[search].properties;
	return (
		<div className={"appBody"} style={{position: "relative"}}> 
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
					<p><b>New</b></p>
					<hr/>
					<button onClick={() => setGrid("randomize")}>Random Grid</button>
					<button onClick={() => setGrid("simplex")}>Simplex World</button>
					<p><b>Edit</b></p>
					<hr/>
					<button onClick={() => clearSearch(true, true)}>Clear Search</button>
					<button onClick={() => clearSearch(true, false)}>Clear Visited</button>
					<button onClick={clearAll}>Clear All</button>
				</DropDown>
				{search != "none" ? <button onClick={startSearch}>{"Run " + search}</button> : null}
				<button onClick={() => setShowSettings(prev => !prev)} className={"settings"}></button>
			</Toolbar>
			<div className={"header"}>
				<KeyBar>{Object.values(NodeType)}</KeyBar>
				<h3>{SearchData[search].title}</h3>
				{searchProps ? 
				<FlexBox>
					<p>Weighted: <span style={{color: searchProps.weighted ? 'green' : 'red'}}><b>{searchProps.weighted ? "YES" : "NO"}</b></span></p>
					<p>Shortest Path: <span style={{color: searchProps.shortestPath ? 'green' : 'red'}}><b>{searchProps.shortestPath ? "YES" : "NO"}</b></span></p>
				</FlexBox> : null}
			</div>
			<div ref={container} className={"gridContainer"}>
				<Grid 
					grid={gridState.nodes} 
					start={coords(gridState.src, gridState.cols)}
					end={coords(gridState.dst, gridState.cols)}
					rowBorderInterval={search == "HPA" ? settings.get("hpaClusterSize").value : null}
					colBorderInterval={search == "HPA" ? settings.get("hpaClusterSize").value : null}
					specialCells={hpa && settings.get("hpaShowEntrances").value ? hpa.entrances : null}
					dispatch={dispatch}
				/>
			</div>
			<div className={"results"}>
				{prevSearchInfo ? 
					Object.keys(prevSearchInfo).map((key, i) =>
						<p key={key}>{key + ": " + prevSearchInfo[key]}</p>
					) 
					: 
					null
				}
			</div>		
			{showSettings ? 
				<SettingsMenu 
					settings={[...settings.entries()]} 
					changeSettings={changeSettings} 
					closeSettings={() => setShowSettings(false)}
				/> 
				: 
				null
			}
		</div>
	);	
}

export default App;
