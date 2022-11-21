import React from 'react';
import './rect-slider.css';

function RectSlider({onChange, checked=false, height=25, padding=3}) {
	const onCheck = () => {
		onChange(!checked);
	}

	return (
		<label style={{"--height": height + "px", "--padding": padding + "px"}} className={"switch"}>
			<input type={"checkbox"} onChange={onCheck} checked={checked ? true : false}/>
			<span className={"slider"} />
		</label>
	);
}

export default RectSlider;
