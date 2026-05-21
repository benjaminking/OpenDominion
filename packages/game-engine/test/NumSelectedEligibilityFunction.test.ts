import { describe, expect, it, vi } from 'vitest';

import { CardCollection } from '../src/card/CardCollection';
import { NumSelectedEligibilityFunction } from '../src/NumSelectedEligibilityFunction';

const createMockCardCollection = (size: number): CardCollection => {
  return {
    size: vi.fn(() => size),
  } as unknown as CardCollection;
};

const alwaysAllowed = new NumSelectedEligibilityFunction(() => true);
const neverAllowed = new NumSelectedEligibilityFunction(() => false);

describe('NumSelectedEligibilityFunction', () => {
  describe('isAllowed', () => {
    it('should return true when the internal function returns true', () => {
      expect(alwaysAllowed.isAllowed(3)).toBe(true);
    });

    it('should return false when the internal function returns false', () => {
      expect(neverAllowed.isAllowed(3)).toBe(false);
    });

    it('should pass the size to the internal function', () => {
      const internalFn = vi.fn(() => true);
      const fn = new NumSelectedEligibilityFunction(internalFn);

      fn.isAllowed(5);

      expect(internalFn).toHaveBeenCalledWith(5);
    });

    it('should evaluate the internal function independently for each size', () => {
      const fn = new NumSelectedEligibilityFunction((size: number) => size % 2 === 0);

      expect(fn.isAllowed(2)).toBe(true);
      expect(fn.isAllowed(3)).toBe(false);
      expect(fn.isAllowed(4)).toBe(true);
    });
  });

  describe('matches', () => {
    it('should return true when the collection size is allowed', () => {
      const collection = createMockCardCollection(3);
      expect(alwaysAllowed.matches(collection)).toBe(true);
    });

    it('should return false when the collection size is not allowed', () => {
      const collection = createMockCardCollection(3);
      expect(neverAllowed.matches(collection)).toBe(false);
    });

    it('should use the collection size to evaluate the internal function', () => {
      const internalFn = vi.fn(() => true);
      const fn = new NumSelectedEligibilityFunction(internalFn);
      const collection = createMockCardCollection(7);

      fn.matches(collection);

      expect(internalFn).toHaveBeenCalledWith(7);
    });

    it('should call size() on the collection', () => {
      const collection = createMockCardCollection(4);
      alwaysAllowed.matches(collection);
      expect(collection.size).toHaveBeenCalled();
    });

    it('should match a collection of size zero', () => {
      const collection = createMockCardCollection(0);
      expect(alwaysAllowed.matches(collection)).toBe(true);
    });

    it('should not match a collection whose size is rejected', () => {
      const fn = new NumSelectedEligibilityFunction((size: number) => size === 5);
      const collection = createMockCardCollection(3);
      expect(fn.matches(collection)).toBe(false);
    });

    it('should match a collection whose size is accepted', () => {
      const fn = new NumSelectedEligibilityFunction((size: number) => size === 5);
      const collection = createMockCardCollection(5);
      expect(fn.matches(collection)).toBe(true);
    });
  });

  describe('toAllowedNumbers', () => {
    it('should return all numbers 0-19 when always allowed', () => {
      expect(alwaysAllowed.toAllowedNumbers()).toEqual([
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
      ]);
    });

    it('should return an empty array when never allowed', () => {
      expect(neverAllowed.toAllowedNumbers()).toEqual([]);
    });

    it('should return only numbers that satisfy the internal function', () => {
      const fn = new NumSelectedEligibilityFunction((size: number) => size === 3);
      expect(fn.toAllowedNumbers()).toEqual([3]);
    });

    it('should only include numbers in the range 0-19', () => {
      const fn = new NumSelectedEligibilityFunction((size: number) => size >= 10);
      expect(fn.toAllowedNumbers()).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
    });

    it('should not include numbers beyond 19 even when the function allows them', () => {
      const fn = new NumSelectedEligibilityFunction((size: number) => size >= 15);
      const allowed = fn.toAllowedNumbers();
      expect(allowed.every((n) => n <= 19)).toBe(true);
      expect(allowed).toEqual([15, 16, 17, 18, 19]);
    });

    it('should always start from 0', () => {
      const fn = new NumSelectedEligibilityFunction((size: number) => size >= 0);
      const allowed = fn.toAllowedNumbers();
      expect(allowed[0]).toBe(0);
    });

    it('should return even numbers only', () => {
      const fn = new NumSelectedEligibilityFunction((size: number) => size % 2 === 0);
      expect(fn.toAllowedNumbers()).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18]);
    });

    it('should return a range of consecutive numbers', () => {
      const fn = new NumSelectedEligibilityFunction((size: number) => size >= 3 && size <= 6);
      expect(fn.toAllowedNumbers()).toEqual([3, 4, 5, 6]);
    });
  });
});
