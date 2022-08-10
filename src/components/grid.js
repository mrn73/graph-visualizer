import React, { useState, useEffect, useReducer } from 'react';
import GridGraph, { GridNode, NodeType, setNodeType } from './../data/gridGraph.js';
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
	
	return (
		<table className={"gridGraph"} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
			<tbody>
				{props.grid.map((row, i) => 
					<tr key={i}>
						{row.map((_, j) => 
							<td key={j} className={"gridGraphCell"}>
								<Cell value={{row: i, col: j, type: props.grid[i][j]}} 
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
