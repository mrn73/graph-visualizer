import React from 'react';
import './dropdown.css';

function DropDown(props) {	
	return (
		<div className="dropdown">
			<button className="dropdown-header">
				{props.title}
				<img/>
			</button>
			<div className="dropdown-content">
				{props.children}
			</div>
		</div>
	)
}

export default DropDown;
