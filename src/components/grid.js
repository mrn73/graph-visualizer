import React, { useState, useEffect, useReducer, useCallback } from 'react';
import { NodeType } from '../node.js';
import './grid.css';

function Grid(props) {
	const [mouseState, setMouseState] = useState({isHeld: false});
	const [movingSrc, setMovingSrc] = useState(false);
	const [movingDst, setMovingDst] = useState(false);

	const updateCell = useCallback(
		(i, j, type, e) => {
			//console.log("SELECTED:" + i + ", " + j);
			switch (e.type) {
				case "mousedown":
					/* 
					 * LEFT CLICK:
					 * 	if SRC selected, we will begin moving SRC
					 * 	if DST selected, we will begin moving DST
					 * 	otherwise, draw a wall
					 */
					if (e.button == 0) {
						if (type == NodeType.SRC) {
							setMovingSrc(true);
						} else if (type == NodeType.DST) {
							setMovingDst(true);
						} else {
							props.dispatch({
								type: "setNode",
								payload: {row: i, col: j, nodeType: NodeType.BLOCKED}
							});
						}
					/*
					 * RIGHT CLICK:
					 * 	if not SRC or DST, erase (set unblocked)
					 */
					} else if (e.button == 2) {
						if (type != NodeType.SRC && type != NodeType.DST) {
							props.dispatch({
								type: "setNode",
								payload: {row: i, col: j, nodeType: NodeType.NORMAL}
							});
						}
					}
					break;
				case "mouseenter":
					/*
					 * LEFT CLICK (HOLD):
					 * 	if moving SRC and the current cell isn't blocked, set SRC to that cell.
					 * 	if moving DST and the current cell isn't blocked, set DST to that cell.
					 * 	otherwise, erase (set unblocked)
					 */
					if (mouseState.isHeld && mouseState.button == 0) {
						if (movingSrc && type != NodeType.BLOCKED) {
							props.dispatch({type: 'setSrc', payload: {row: i, col: j}});
						} else if (movingDst && type != NodeType.BLOCKED) {
							props.dispatch({type: 'setDst', payload: {row: i, col: j}});
						} else if (type != NodeType.SRC && type != NodeType.DST) {
							props.dispatch({
								type: "setNode",
								payload: {row: i, col: j, nodeType: NodeType.BLOCKED}
							});
						}
					/*
					 * RIGHT CLICK (HOLD):
					 * 	if not SRC or DST, erase (set unblocked)
					 */
					} else if (mouseState.isHeld && mouseState.button == 2) {
						if (type != NodeType.SRC && type != NodeType.DST) {
							props.dispatch({
								type: "setNode",
								payload: {row: i, col: j, nodeType: NodeType.NORMAL}
							});
						}
					}
					break;
				case "mouseup":
					/*
					 * LEFT CLICK (RELEASE):
					 * 	if moving SRC or DST, stop moving it
					 */
					if (movingSrc) {
						setMovingSrc(false);
					} else if (movingDst) {
						setMovingDst(false);
					}
					break;
			}
						
			//props.updateGridCell(i, j, e, mouseState);
		}, 
		[mouseState, movingSrc, movingDst]
	);

	const handleMouseDown = (e) => {
		setMouseState({isHeld: true, button: e.button});
	}

	const handleMouseUp = () => {
		setMouseState({isHeld: false});
	}	

	const cols = props.grid[0].length;

	return (
		<div className={"grid"} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}
		     style={{gridTemplateColumns: "repeat(" + cols + ", 1fr)"}}>
			{props.grid.map((row, i) => 
				row.map((_, j) => { 
					let type;
					if (props.start && i == props.start.i && j == props.start.j) {
						type = NodeType.SRC;
					} else if (props.end && i == props.end.i && j == props.end.j) {
						type = NodeType.DST;
					} else {
						type = props.grid[i][j];
					}
					return (
						<MemoCell 
							key={"row" + i + "col" + j} 
							value={{row: i, col: j, type}} 
							handleAction={updateCell}/>
					);
				})
			)}
		</div>
	);
}

function isEqual(prev, next) {
	return prev.value.type == next.value.type && prev.handleAction === next.handleAction;
}
const MemoCell = React.memo(Cell, isEqual);

function Cell(props) {
	const handleMouseEvent = (e) => {
		props.handleAction(props.value.row, props.value.col, props.value.type, e);
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
			onMouseUp={handleMouseEvent}
			onContextMenu={handleContext}>
		</button>
	);
}

export default Grid;
