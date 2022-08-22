import React from 'react';
import './floating-button.css';

function FloatingButton(props) {
	return (
		<button onClick={props.onClick} className={"floating-button"}>{props.children}</button>
	)
}

export default FloatingButton;
