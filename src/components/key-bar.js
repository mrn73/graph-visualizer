import React, { useState, useEffect, useReducer } from 'react';
import './key-bar.css';
import { NodeType, getName } from '../node.js';
import FlexBox from './flex-box.js';

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
			<p>{getName(props.type)}</p>
		</div>
	);
}

export default KeyBar;
