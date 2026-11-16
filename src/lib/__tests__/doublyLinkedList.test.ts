import { describe, it, expect } from 'vitest';
import { DoublyLinkedList, DoublyLinkedListNode } from '../doublyLinkedList';

describe('DoublyLinkedList & DoublyLinkedListNode', () => {
  it('should initialize an empty linked list', () => {
    const list = new DoublyLinkedList<number>();
    expect(list.head).toBeNull();
    expect(list.tail).toBeNull();
    expect(list.size).toBe(0);
    expect(list.toArray()).toEqual([]);
  });

  it('should append nodes and correctly link prev and next pointers', () => {
    const list = new DoublyLinkedList<string>();
    const nodeA = list.append('Song A');
    expect(list.head).toBe(nodeA);
    expect(list.tail).toBe(nodeA);
    expect(nodeA.prev).toBeNull();
    expect(nodeA.next).toBeNull();
    expect(list.size).toBe(1);

    const nodeB = list.append('Song B');
    expect(list.head).toBe(nodeA);
    expect(list.tail).toBe(nodeB);
    expect(nodeA.next).toBe(nodeB);
    expect(nodeB.prev).toBe(nodeA);
    expect(nodeB.next).toBeNull();
    expect(list.size).toBe(2);

    const nodeC = list.append('Song C');
    expect(list.tail).toBe(nodeC);
    expect(nodeB.next).toBe(nodeC);
    expect(nodeC.prev).toBe(nodeB);
    expect(nodeC.next).toBeNull();
    expect(list.size).toBe(3);
    expect(list.toArray()).toEqual(['Song A', 'Song B', 'Song C']);
  });

  it('should prepend nodes correctly', () => {
    const list = new DoublyLinkedList<number>();
    list.append(2);
    list.prepend(1);
    expect(list.head?.value).toBe(1);
    expect(list.head?.next?.value).toBe(2);
    expect(list.tail?.value).toBe(2);
    expect(list.tail?.prev?.value).toBe(1);
    expect(list.size).toBe(2);
  });

  it('should find nodes matching a predicate', () => {
    const list = DoublyLinkedList.fromArray([
      { id: 101, name: 'Track 1' },
      { id: 102, name: 'Track 2' },
      { id: 103, name: 'Track 3' },
    ]);

    const found = list.find((item) => item.id === 102);
    expect(found).not.toBeNull();
    expect(found?.value.name).toBe('Track 2');
    expect(found?.prev?.value.name).toBe('Track 1');
    expect(found?.next?.value.name).toBe('Track 3');

    const notFound = list.find((item) => item.id === 999);
    expect(notFound).toBeNull();
  });

  it('should clear list completely', () => {
    const list = DoublyLinkedList.fromArray([1, 2, 3]);
    list.clear();
    expect(list.head).toBeNull();
    expect(list.tail).toBeNull();
    expect(list.size).toBe(0);
    expect(list.toArray()).toEqual([]);
  });

  it('should simulate playlist end-of-queue boundary detection', () => {
    const songs = ['First Song', 'Second Song', 'Last Song'];
    const playlist = DoublyLinkedList.fromArray(songs);

    let currentNode: DoublyLinkedListNode<string> | null = playlist.head;
    expect(currentNode?.value).toBe('First Song');

    // Advance to second song
    currentNode = currentNode?.next ?? null;
    expect(currentNode?.value).toBe('Second Song');

    // Advance to last song
    currentNode = currentNode?.next ?? null;
    expect(currentNode?.value).toBe('Last Song');

    // Advance past last song -> next is null (end of playlist!)
    const nextNode = currentNode?.next;
    expect(nextNode).toBeNull();
  });
});
