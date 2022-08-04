import React, { useState, useEffect, useReducer } from 'react';
import GridGraph, { GridNode, NodeType, setNodeType } from './../data/gridGraph.js';
import './grid.css';

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
	}
}

function Grid(props) {
	const [state, dispatch] = useReducer(gridReducer, {rows: props.rows, cols: props.cols}, initGrid);
	const [mouseState, setMouseState] = useState({isHeld: false});

	const updateCell = (i, j, e) => {
		if (state.nodes[i][j] !== NodeType.SRC && state.nodes[i][j] !== NodeType.DST) {
			if (e.type === "mousedown" && e.button == 0) {
				dispatch({type: 'setBlocked', payload: {row: i, col: j}});	
			} else if (e.type === "mousedown" && e.button == 2) {
				dispatch({type: 'setUnblocked', payload: {row: i, col: j}});	
			} else if (e.type === "mouseenter" && mouseState.isHeld == true && mouseState.button == 0) {
				dispatch({type: 'setBlocked', payload: {row: i, col: j}});
			} else if (e.type === "mouseenter" && mouseState.isHeld == true && mouseState.button == 2) {
				dispatch({type: "setUnblocked", payload: {row: i, col: j}});
			}
		}
		console.log(i + ", " + j);
	}

	const handleMouseDown = (e) => {
		setMouseState({isHeld: true, button: e.button});
	}

	const handleMouseUp = () => {
		setMouseState({isHeld: false});
	}
	
	return (
		<table className={"gridGraph"} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
			<tbody>
				{state.nodes.map((row, i) => 
					<tr key={i}>
						{row.map((_, j) => 
							<td key={j} className={"gridGraphCell"}>
								<Cell value={{row: i, col: j, type: state.nodes[i][j]}} 
								handleAction={updateCell}/>
							</td>
						)}
					</tr>
				)}
			</tbody>
		</table>
	);
}

function Cell(props) {
	const handleMouseEvent = (e) => {
		props.handleAction(props.value.row, props.value.col, e);
	}

	/* Disable right-click context menu */
	const handleContext = (e) => {
		e.preventDefault();
	}

	return (
		<button 
			className={"cell type" + props.value.type}
			onMouseDown={handleMouseEvent}
			onMouseEnter={handleMouseEvent}
			onContextMenu={handleContext}>
		</button>
	);
}

export default Grid;
