import React from 'react';
import './toolbar.css';

function NavBar(props) {
	return (
		<div className="navbar">
			<ul>
				{React.Children.map(props.children, (elem, i) => 
					<li key={i}>{elem}</li>
				)}
			</ul>
		</div>
	);
}

export default NavBar;
