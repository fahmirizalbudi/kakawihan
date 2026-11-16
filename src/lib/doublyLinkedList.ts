/**
 * Doubly Linked List Node representing an item in the audio queue.
 */
export class DoublyLinkedListNode<T> {
  value: T;
  prev: DoublyLinkedListNode<T> | null = null;
  next: DoublyLinkedListNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

/**
 * Doubly Linked List implementation for managing sequential track navigation.
 * Allows O(1) traversal to previous/next track and strict terminal boundary checking.
 */
export class DoublyLinkedList<T> {
  head: DoublyLinkedListNode<T> | null = null;
  tail: DoublyLinkedListNode<T> | null = null;
  size: number = 0;

  append(value: T): DoublyLinkedListNode<T> {
    const node = new DoublyLinkedListNode(value);
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else if (this.tail) {
      this.tail.next = node;
      node.prev = this.tail;
      this.tail = node;
    }
    this.size++;
    return node;
  }

  prepend(value: T): DoublyLinkedListNode<T> {
    const node = new DoublyLinkedListNode(value);
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      node.next = this.head;
      this.head.prev = node;
      this.head = node;
    }
    this.size++;
    return node;
  }

  find(predicate: (value: T) => boolean): DoublyLinkedListNode<T> | null {
    let curr = this.head;
    while (curr) {
      if (predicate(curr.value)) {
        return curr;
      }
      curr = curr.next;
    }
    return null;
  }

  clear(): void {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  toArray(): T[] {
    const arr: T[] = [];
    let curr = this.head;
    while (curr) {
      arr.push(curr.value);
      curr = curr.next;
    }
    return arr;
  }

  static fromArray<T>(items: T[]): DoublyLinkedList<T> {
    const list = new DoublyLinkedList<T>();
    for (const item of items) {
      list.append(item);
    }
    return list;
  }
}
