import React, { useState, useEffect, useRef }  from 'react';
import './settings-menu.css';
import FlexBox from './flex-box.js';
import RectSlider from './rect-slider.js';

/**
 * Expects an iterable object whose elements are key-val pairs
 * 	key {string} - the setting
 * 	value {Object} - the value of the setting
 * The value object of each setting must include:
 * 	1. boolean setting:
		- name (how it displays)
 * 		- default (value)
 * 		- value
 * 	2. numeric setting:
 * 		- name (how it displays)
 * 		- default (value)
 * 		- value
 * 		- minVal
 * 		- maxVal
 * 		- increment
 *
 * This menu keeps track of its own state and does not update the app
 * state until settings are applied.
 */
function SettingsMenu(props) {
	const [settings, setSettings] = useState(() => new Map(props.settings));
	const [applyDisabled, setApplyDisabled] = useState(true);
	const isChanged = useRef(false);
	
	const setSetting = (setting, val) => {
		setSettings(prevState => {
			const newSettings = new Map(prevState);
			newSettings.set(setting, {...prevState.get(setting), value: val});
			return newSettings;
		});
	}

	const setInputSetting = (setting, val, minVal, maxVal) => {
		if (val < minVal) {
			val = minVal;
		} else if (val > maxVal) {
			val = maxVal;
		}
		setSetting(setting, parseFloat(val));
	}

	const applyChanges = () => {
		console.log(settings);
		props.changeSettings(settings);
		setApplyDisabled(true);
	}

	const setDefault = () => {
		const defaults = new Map(settings);
		for (const setting of defaults.keys()) {
			defaults.set(setting, {...settings.get(setting), value: settings.get(setting).default});
		}
		setSettings(defaults);
	}

	// Ensures apply button is enabled only if settings are changed
	useEffect(() => {
		if (isChanged.current) {
			setApplyDisabled(false);
		}
		isChanged.current = true;
	}, [settings]);

	return (
		<div className={"settings-overlay"}>
			<FlexBox justifyContent={"space-between"}>
				<h1 style={{color: "white"}}>SETTINGS</h1>
			</FlexBox>
			<hr/>
			{[...settings.entries()].map((elem, i) => {
				const setting = <p>{elem[1].name}</p>;
				let val = <p>{elem[1].value}</p>;
				if (typeof elem[1].value === "boolean") {
					val = <RectSlider 
						onChange={(val) => setSetting(elem[0], val)}
						checked={elem[1].value ? true : false}/>;
				} else {
					val = <input 
						className={"num-input"}
						type="number" 
						value={elem[1].value} 
						step={elem[1].increment}
						min={elem[1].minVal} 
						max={elem[1].maxVal}
						onKeyDown={(e) => e.keyCode == 13 ? 
								setInputSetting(elem[0], e.target.value, elem[1].minVal, elem[1].maxVal)
								:
								null
						}
						onChange={(e) => setSetting(elem[0], e.target.value)}
						onBlur={(e) => setInputSetting(elem[0], e.target.value, elem[1].minVal, elem[1].maxVal)} />
				}
				return (
					<>
					<FlexBox key={setting} justifyContent={"space-between"}>
						{[setting, val]}
					</FlexBox>
					</>
				);
			})}
			<FlexBox margin={"10px 0 0 0"}>
				<button className={"settings-button"} onClick={props.closeSettings}>Cancel</button>
				<button className={"settings-button"} onClick={setDefault} style={{marginLeft: "auto"}}>Defaults</button>
				<button className={"settings-button"} onClick={applyChanges} disabled={applyDisabled}>Apply</button>
			</FlexBox>
		</div>
	)
}

export default SettingsMenu;
