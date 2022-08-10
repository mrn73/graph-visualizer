class PriorityQueue {
	constructor() {
		this.heap = Array(10).fill(null);
		this.size = 0;
	}

	/**
	 * Pushes data onto the heap.
	 * @param {number} data - The data to be added.
	 */
	push(data) {
		//Full array; double it.
		if (this.size == this.heap.length) {
			this.heap = this.heap.concat(Array(this.heap.length).fill(null));
		}

		this.heap[this.size] = data;
		this.size++;
		floatUp(this.heap, this.size);
	}

	/** Removes the minimum element off the heap.
	 * @return {number} - The smallest value.
	 */
	pop() {
		if (this.size <= 0) {
			return;
		}

		this.size--;
		const retVal = this.heap[0];
		this.heap[0] = this.heap[this.size];
		floatDown(this.heap, this.size);

		return retVal;
	}

	getTop() {
		if (this.size == 0) {
			return;
		}
		return this.heap[0];
	}

	isEmpty() {
		return this.size == 0;
	}

	size() {
		return this.size;
	}
}

/**
 * Restores the min-heap property when a new element is added.
 * @param {[]} heap - The heap array.
 * @param {number} size - The current number of elements in the heap.
 */
function floatUp(heap, size) {
	for (let n = size - 1; n > 0 && heap[n] < heap[parent(n)]; n = parent(n)) {
		const tmp = heap[n];
		heap[n] = heap[parent(n)];
		heap[parent(n)] = tmp;
	}
}

/**
 * Restores the min-heap property when the root element is popped.
 * NOTE: Mutates the heap argument.
 * @param {[]} heap - The heap array.
 * @param {number} size - The current number of elements in the heap.
 */
function floatDown(heap, size) {
	for (let p = 0; left(p) < size;) {
		//Start with left child as the swap candidate.
		let c = left(p);

		//If a right child exists and it's smaller than the left, 
		//then that's the element we want to swap with.
		if (c < (size - 1) && heap[c] > heap[c + 1]) {
			c++;
		}

		//If the child we want to swap with is greater, then we're
		//already following the min-heap property.
		if (heap[p] < heap[c]) {
			break;
		}

		//Swap parent and child.
		const tmp = heap[p];
		heap[p] = heap[c];
		heap[c] = tmp;

		//Move down the tree so that the child is now seen as the parent.
		p = c;	
	}
}

/**
 * Gets the parent of a node in the heap.
 * @param {number} n - Index of the node.
 */
function parent(n) {
	return Math.floor((n - 1) / 2);
}

/**
 * Gets the left child of a node in the heap.
 * @param {number} n - Index of the node.
 */
function left(n) {
	return 2 * n + 1;
}

export default PriorityQueue;
