/* Immutable enum 
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
*/

export const NodeType = Object.freeze({
	NORMAL: 1,
	DEEPWATER: 2,
	WATER: 3,
	SAND: 4,
	FOREST: 5,
	GRASSLAND: 6,
	ROCK: 7,
	SNOW: 8,
	BLOCKED: 9,
	SRC: 10,
	DST: 11,
	VISITED: 12,
	PATH: 13
});

export function getName(t) {
	switch (t) {
		case 1:
			return "Normal";
		case 2:
			return "Deep Water";
		case 3:
			return "Water";
		case 4:
			return "Sand";
		case 5:
			return "Forest";
		case 6:
			return "Grassland";
		case 7:
			return "Rock";
		case 8:
			return "Snow";
		case 9:
			return "Wall";
		case 10:
			return "Source";
		case 11:
			return "Destination";
		case 12:
			return "Visited";
		case 13:
			return "Path";
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

