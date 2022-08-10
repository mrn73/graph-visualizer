/** 
 * Queue data-structure implemented with a circular buffer.
 */
class Queue {
	/**
	 * @param {number} n - The preferred starting size of the queue.
	 */
	constructor(n = 10) {
		this.queue = Array(n).fill(null);
		this.head = 0;
		this.tail = -1;
		this.itemCount = 0;
	}

	/** 
	 * Adds an element to the queue.
	 * @param {*} data - The element to be added.
	 */
	enqueue(data) {
		this.itemCount++;
		let size = this.queue.length;

		//Double array size if it's full
		if (this.itemCount > size) {
			//The list is circling, so add space between tail and head.
			if (this.tail < this.head) {
				this.queue = [
					      ...this.queue.slice(0, this.tail + 1), 
					      ...Array(size).fill(null),
					      ...this.queue.slice(this.head)
					     ];
				this.head += size;
			//The head is the first element; just add space at the end.
			} else {
				this.queue = this.queue.concat(Array(size).fill(null));
			}
			size *= 2;
		}

		if (this.tail + 1 >= size) {
			this.tail = -1;
		}

		this.queue[this.tail + 1] = data;
		this.tail++;
	}

	/**
	 * Pops the head element of the queue.
	 * @return {*} - The removed element.
	 */
	dequeue() {
		if (this.itemCount == 0) {
			return;
		}
		
		const index = this.head;
		this.head++;
		if (this.head >= this.queue.length) {
			this.head = 0;
		}
		this.itemCount--;
		
		return this.queue[index];

	}
	
	/**
	 * Views the head of the queue without removing it.
	 * @return {*} - The head element of the queue.
	 */
	peek() {
		if (this.itemCount == 0) {
			return;
		}

		return this.queue[this.head];
	}

	/**
	 * Checks if the queue is empty.
	 * @return {boolean}
	 */
	isEmpty() {
		return this.itemCount == 0;
	}
}	
export default Queue;
