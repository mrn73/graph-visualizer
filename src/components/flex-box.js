import React from 'react';
import './flex-box.css';

function FlexBox({children, flexDirection, justifyContent, alignItems, gap, margin}) {
	return (
		<div className={"flex-box"} style={{flexDirection, justifyContent, alignItems, gap, margin}}>
			{children}
		</div>
	);
}

export default FlexBox;
