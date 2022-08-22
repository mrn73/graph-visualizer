import React from 'react';
import './toolbar.css';

function NavBar(props) {
	return (
		<div>
			<ul>
				{props.children.map((elem, i) => 
					<li key={i}>{elem}</li>
				)}
			</ul>
		</div>
	);
}

export default NavBar;
