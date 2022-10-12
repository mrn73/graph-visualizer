import React, { useState, useEffect, useReducer } from 'react';
import './key-bar.css';
import { NodeType } from '../node.js';
import FlexBox from './flex-box.js';

function getKeyName(type) {
	switch (type) {
		case 1:
			return "Traversible";
		case 2:
			return "Blocked";
		case 3:
			return "Source";
		case 4:
			return "Destination";
		case 5:
			return "Visited";
		case 6:
			return "Path";
		default:
			return "Undefined";
	}
}

function KeyBar(props) {
	return (
		<FlexBox gap={"20px"} margin={"10px"}>
			{React.Children.map(props.children, (val, i) =>
				<KeyItem key={i} type={val} />
			)}
		</FlexBox>
	);
}

function KeyItem(props) {
	return (
		<div className={"keyItem"}>
			<button className={"keyCell type" + props.type}/>
			<p>{getKeyName(props.type)}</p>
		</div>
	);
}

export default KeyBar;
