import React, { useState, useEffect, useReducer } from 'react';
import { NodeType } from '../node.js';
import './grid.css';

function Grid(props) {
	const [mouseState, setMouseState] = useState({isHeld: false});

	const updateCell = (i, j, e) => {
		props.updateGridCell(i, j, e, mouseState);
	}

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
						<Cell key={i * cols + j} value={{row: i, col: j, type}} 
						handleAction={updateCell}/>
					);
				})
			)}
		</div>
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
			onMouseUp={handleMouseEvent}
			onContextMenu={handleContext}>
		</button>
	);
}

export default Grid;
