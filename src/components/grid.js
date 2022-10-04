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
			onMouseUp={handleMouseEvent}
			onContextMenu={handleContext}>
		{props.value.type === NodeType.PATH ? 
			(<svg width={40} height={10} padding={0} margin={0}>
				<line x1="0" y1="0" x2="25" y2="0" stroke="green" strokeWidth={20} />
			</svg>)
			: 
			null}
		</button>
	);
}

export default Grid;
