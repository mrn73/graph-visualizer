class Stack {
	constructor() {
		this.stack = [];
	}

	push(data) {
		this.stack.push(data);
	}
	
	pop() {
		if (this.isEmpty()) {
			return null;
		}
		return this.stack.pop(this.stack.length - 1);
	}

	peek() {
		if (this.isEmpty()) {
			return null;
		}
		return this.stack[this.stack.length - 1];
	}

	isEmpty() {
		return this.stack.length == 0;
	}
}

export default Stack;
