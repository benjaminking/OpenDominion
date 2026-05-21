import { describe, expect, it } from 'vitest';

import { ArrayIterator } from '../src/Iterator';

describe('ArrayIterator', () => {
  describe('next', () => {
    it('should return each element in order', () => {
      const iterator = new ArrayIterator([1, 2, 3]);

      expect(iterator.next()).toEqual({ done: false, value: 1 });
      expect(iterator.next()).toEqual({ done: false, value: 2 });
      expect(iterator.next()).toEqual({ done: false, value: 3 });
    });

    it('should return done: true after all elements are consumed', () => {
      const iterator = new ArrayIterator([1]);

      iterator.next();
      const result = iterator.next();

      expect(result.done).toBe(true);
    });

    it('should return undefined value when done', () => {
      const iterator = new ArrayIterator<number>([]);

      const result = iterator.next();

      expect(result.done).toBe(true);
      expect(result.value).toBeUndefined();
    });

    it('should return done: true immediately for an empty array', () => {
      const iterator = new ArrayIterator<string>([]);

      expect(iterator.next().done).toBe(true);
    });

    it('should return done: false for the first element of a single-element array', () => {
      const iterator = new ArrayIterator(['only']);

      const result = iterator.next();

      expect(result.done).toBe(false);
      expect(result.value).toBe('only');
    });

    it('should continue returning done: true after being exhausted', () => {
      const iterator = new ArrayIterator([1]);

      iterator.next(); // consume the one element
      const result1 = iterator.next();
      const result2 = iterator.next();

      expect(result1.done).toBe(true);
      expect(result2.done).toBe(true);
    });

    it('should work with string elements', () => {
      const iterator = new ArrayIterator(['a', 'b', 'c']);

      expect(iterator.next().value).toBe('a');
      expect(iterator.next().value).toBe('b');
      expect(iterator.next().value).toBe('c');
    });

    it('should work with object elements', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      const iterator = new ArrayIterator([obj1, obj2]);

      expect(iterator.next().value).toBe(obj1);
      expect(iterator.next().value).toBe(obj2);
    });

    it('should not advance past the end when called many times after exhaustion', () => {
      const iterator = new ArrayIterator([42]);

      iterator.next(); // 42
      for (let i = 0; i < 5; i++) {
        const result = iterator.next();
        expect(result.done).toBe(true);
        expect(result.value).toBeUndefined();
      }
    });

    it('should iterate all elements of a large array in order', () => {
      const items = Array.from({ length: 100 }, (_, i) => i);
      const iterator = new ArrayIterator(items);

      for (let i = 0; i < 100; i++) {
        const result = iterator.next();
        expect(result.done).toBe(false);
        expect(result.value).toBe(i);
      }
      expect(iterator.next().done).toBe(true);
    });
  });
});
