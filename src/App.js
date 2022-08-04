import React, { useState, useEffect } from 'react';
import './App.css';
import Grid from './components/grid.js';
import Toolbar from './components/toolbar.js';

const cellSize = 30;
const rows = 25;
const cols = 60;

function App() {	
	const [windowSize, setWindowSize] = useState({width: window.innerWidth, height: window.innerHeight});

	/* Runs only on mount and unmount */
	useEffect(() => {
		/* Runs on every window resize event */
		function handleWindowResize() {
			setWindowSize({width: window.innerWidth, height: window.innerHeight});
		}

		window.addEventListener('resize', handleWindowResize);

		return () => {
			window.removeEventListener('resize', handleWindowResize);
		};
	}, []);
	
	console.log(windowSize.width);
	return (
		<div> 
			<Toolbar>
				<button>BFS</button>
				<button>DFS</button>
			</Toolbar>
			<Grid rows={rows} cols={cols} />
		</div>
	);
}

export default App;
