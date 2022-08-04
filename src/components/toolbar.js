import React from 'react';
import './toolbar.css';

function NavBar(props) {
	return (
		<ul>
			{props.children.map((elem, i) => 
				<li key={i}>{elem}</li>
			)}
		</ul>
	);
}

export default NavBar;
