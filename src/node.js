/* Immutable enum */
export const NodeType = Object.freeze({
	NORMAL: 1,
	BLOCKED: 2,
	SRC: 3,
	DST: 4,
	VISITED: 5,
	PATH: 6,
	DEEPWATER: 7,
	WATER: 8,
	SAND: 9,
	FOREST: 10,
	GRASSLAND: 11,
	ROCK: 12,
	SNOW: 13
});

export function getName(t) {
	switch (t) {
		case 1:
			return "Normal";
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
		case 7:
			return "Deep Water";
		case 8:
			return "Water";
		case 9:
			return "Sand";
		case 10:
			return "Forest";
		case 11:
			return "Grassland";
		case 12:
			return "Rock";
		case 13:
			return "Snow";
		default:
			return "Undefined";
	}
}

export function getDefaultWeights() {
	return {
		1: 1,
		3: 1,
		4: 1,
		7: 100,
		8: 25,
		9: 8,
		10: 10,
		11: 5,
		12: 15,
		13: 30
	}
}

