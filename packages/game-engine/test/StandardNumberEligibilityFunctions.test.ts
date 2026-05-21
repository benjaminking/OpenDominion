import { describe, expect, it, vi } from 'vitest';

import { CardCollection } from '../src/card/CardCollection';
import { anyNumber, either, exactlyNChecked, upToNChecked } from '../src/StandardNumberEligibilityFunctions';

// Mock CardCollection
const createMockCardCollection = (size: number): CardCollection => {
  const mockCollection: Partial<CardCollection> = {
    size: vi.fn(() => size),
  };
  return mockCollection as CardCollection;
};

describe('StandardNumberEligibilityFunctions', () => {
  describe('anyNumber', () => {
    it('should match any number', () => {
      expect(anyNumber.isAllowed(0)).toBe(true);
      expect(anyNumber.isAllowed(1)).toBe(true);
      expect(anyNumber.isAllowed(5)).toBe(true);
      expect(anyNumber.isAllowed(100)).toBe(true);
    });

    it('should match zero', () => {
      expect(anyNumber.isAllowed(0)).toBe(true);
    });

    it('should match large numbers', () => {
      expect(anyNumber.isAllowed(1000)).toBe(true);
    });

    it('should work with matches method on CardCollection', () => {
      const collection = createMockCardCollection(5);
      expect(anyNumber.matches(collection)).toBe(true);
    });

    it('should return all numbers 0-19 in toAllowedNumbers', () => {
      const allowed = anyNumber.toAllowedNumbers();
      expect(allowed).toHaveLength(20);
      expect(allowed).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
    });
  });

  describe('upToNChecked', () => {
    it('should match numbers less than or equal to the limit', () => {
      const upTo3 = upToNChecked(3);
      expect(upTo3.isAllowed(0)).toBe(true);
      expect(upTo3.isAllowed(1)).toBe(true);
      expect(upTo3.isAllowed(2)).toBe(true);
      expect(upTo3.isAllowed(3)).toBe(true);
    });

    it('should not match numbers greater than the limit', () => {
      const upTo3 = upToNChecked(3);
      expect(upTo3.isAllowed(4)).toBe(false);
      expect(upTo3.isAllowed(5)).toBe(false);
      expect(upTo3.isAllowed(100)).toBe(false);
    });

    it('should match zero when limit is zero', () => {
      const upTo0 = upToNChecked(0);
      expect(upTo0.isAllowed(0)).toBe(true);
    });

    it('should not match any positive number when limit is zero', () => {
      const upTo0 = upToNChecked(0);
      expect(upTo0.isAllowed(1)).toBe(false);
      expect(upTo0.isAllowed(5)).toBe(false);
    });

    it('should handle large limits', () => {
      const upTo100 = upToNChecked(100);
      expect(upTo100.isAllowed(99)).toBe(true);
      expect(upTo100.isAllowed(100)).toBe(true);
      expect(upTo100.isAllowed(101)).toBe(false);
    });

    it('should work with matches method on CardCollection', () => {
      const upTo5 = upToNChecked(5);
      const collection3 = createMockCardCollection(3);
      const collection6 = createMockCardCollection(6);

      expect(upTo5.matches(collection3)).toBe(true);
      expect(upTo5.matches(collection6)).toBe(false);
    });

    it('should return correct allowed numbers in toAllowedNumbers', () => {
      const upTo3 = upToNChecked(3);
      const allowed = upTo3.toAllowedNumbers();
      expect(allowed).toEqual([0, 1, 2, 3]);
    });

    it('should return empty array if limit is negative (edge case)', () => {
      const upToNeg = upToNChecked(-1);
      const allowed = upToNeg.toAllowedNumbers();
      expect(allowed).toEqual([]);
    });
  });

  describe('exactlyNChecked', () => {
    it('should match only the exact number', () => {
      const exactly5 = exactlyNChecked(5);
      expect(exactly5.isAllowed(5)).toBe(true);
    });

    it('should not match numbers less than the target', () => {
      const exactly5 = exactlyNChecked(5);
      expect(exactly5.isAllowed(0)).toBe(false);
      expect(exactly5.isAllowed(1)).toBe(false);
      expect(exactly5.isAllowed(4)).toBe(false);
    });

    it('should not match numbers greater than the target', () => {
      const exactly5 = exactlyNChecked(5);
      expect(exactly5.isAllowed(6)).toBe(false);
      expect(exactly5.isAllowed(10)).toBe(false);
      expect(exactly5.isAllowed(100)).toBe(false);
    });

    it('should match exactly zero', () => {
      const exactly0 = exactlyNChecked(0);
      expect(exactly0.isAllowed(0)).toBe(true);
    });

    it('should not match any other number when targeting zero', () => {
      const exactly0 = exactlyNChecked(0);
      expect(exactly0.isAllowed(1)).toBe(false);
      expect(exactly0.isAllowed(5)).toBe(false);
    });

    it('should match exactly one', () => {
      const exactly1 = exactlyNChecked(1);
      expect(exactly1.isAllowed(1)).toBe(true);
      expect(exactly1.isAllowed(0)).toBe(false);
      expect(exactly1.isAllowed(2)).toBe(false);
    });

    it('should handle large exact numbers', () => {
      const exactly100 = exactlyNChecked(100);
      expect(exactly100.isAllowed(100)).toBe(true);
      expect(exactly100.isAllowed(99)).toBe(false);
      expect(exactly100.isAllowed(101)).toBe(false);
    });

    it('should work with matches method on CardCollection', () => {
      const exactly5 = exactlyNChecked(5);
      const collection5 = createMockCardCollection(5);
      const collection4 = createMockCardCollection(4);
      const collection6 = createMockCardCollection(6);

      expect(exactly5.matches(collection5)).toBe(true);
      expect(exactly5.matches(collection4)).toBe(false);
      expect(exactly5.matches(collection6)).toBe(false);
    });

    it('should return correct allowed numbers in toAllowedNumbers', () => {
      const exactly5 = exactlyNChecked(5);
      const allowed = exactly5.toAllowedNumbers();
      expect(allowed).toEqual([5]);
    });

    it('should return empty array when exact number is beyond range (20)', () => {
      const exactly50 = exactlyNChecked(50);
      const allowed = exactly50.toAllowedNumbers();
      expect(allowed).toEqual([]);
    });
  });

  describe('either', () => {
    it('should match if first condition is true', () => {
      const exactly3 = exactlyNChecked(3);
      const exactly5 = exactlyNChecked(5);
      const condition = either(exactly3, exactly5);

      expect(condition.isAllowed(3)).toBe(true); // First condition matches
      expect(condition.isAllowed(5)).toBe(true); // Second condition matches (either uses OR)
    });

    it('should match if second condition is true', () => {
      const exactly3 = exactlyNChecked(3);
      const exactly5 = exactlyNChecked(5);
      const condition = either(exactly3, exactly5);

      expect(condition.isAllowed(5)).toBe(true); // Matches second condition
      expect(condition.isAllowed(3)).toBe(true); // Matches first condition
    });

    it('should match if either condition is true', () => {
      const exactly3 = exactlyNChecked(3);
      const exactly5 = exactlyNChecked(5);
      const condition = either(exactly3, exactly5);

      expect(condition.isAllowed(3)).toBe(true);
      expect(condition.isAllowed(5)).toBe(true);
    });

    it('should not match if neither condition is true', () => {
      const exactly3 = exactlyNChecked(3);
      const exactly5 = exactlyNChecked(5);
      const condition = either(exactly3, exactly5);

      expect(condition.isAllowed(1)).toBe(false);
      expect(condition.isAllowed(2)).toBe(false);
      expect(condition.isAllowed(4)).toBe(false);
      expect(condition.isAllowed(6)).toBe(false);
    });

    it('should combine upToNChecked with exactlyNChecked', () => {
      const upTo2 = upToNChecked(2);
      const exactly5 = exactlyNChecked(5);
      const condition = either(upTo2, exactly5);

      expect(condition.isAllowed(0)).toBe(true); // matches upTo2
      expect(condition.isAllowed(1)).toBe(true); // matches upTo2
      expect(condition.isAllowed(2)).toBe(true); // matches upTo2
      expect(condition.isAllowed(3)).toBe(false); // matches neither
      expect(condition.isAllowed(4)).toBe(false); // matches neither
      expect(condition.isAllowed(5)).toBe(true); // matches exactly5
    });

    it('should work with matches method on CardCollection', () => {
      const exactly3 = exactlyNChecked(3);
      const exactly5 = exactlyNChecked(5);
      const condition = either(exactly3, exactly5);

      const collection3 = createMockCardCollection(3);
      const collection5 = createMockCardCollection(5);
      const collection4 = createMockCardCollection(4);

      expect(condition.matches(collection3)).toBe(true);
      expect(condition.matches(collection5)).toBe(true);
      expect(condition.matches(collection4)).toBe(false);
    });

    it('should chain multiple either conditions', () => {
      const exactly1 = exactlyNChecked(1);
      const exactly3 = exactlyNChecked(3);
      const exactly5 = exactlyNChecked(5);

      const condition = either(either(exactly1, exactly3), exactly5);

      expect(condition.isAllowed(1)).toBe(true);
      expect(condition.isAllowed(3)).toBe(true);
      expect(condition.isAllowed(5)).toBe(true);
      expect(condition.isAllowed(2)).toBe(false);
      expect(condition.isAllowed(4)).toBe(false);
    });

    it('should combine anyNumber with exactlyNChecked', () => {
      const condition = either(exactlyNChecked(3), anyNumber);

      // anyNumber matches everything, so either should always be true
      expect(condition.isAllowed(0)).toBe(true);
      expect(condition.isAllowed(1)).toBe(true);
      expect(condition.isAllowed(5)).toBe(true);
      expect(condition.isAllowed(100)).toBe(true);
    });

    it('should return correct allowed numbers in toAllowedNumbers', () => {
      const exactly2 = exactlyNChecked(2);
      const exactly5 = exactlyNChecked(5);
      const condition = either(exactly2, exactly5);

      const allowed = condition.toAllowedNumbers();
      expect(allowed).toEqual([2, 5]);
    });

    it('should return all numbers when combined with anyNumber', () => {
      const condition = either(exactlyNChecked(3), anyNumber);
      const allowed = condition.toAllowedNumbers();

      expect(allowed).toHaveLength(20);
      expect(allowed).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero selections', () => {
      const upTo0 = upToNChecked(0);
      const exactly0 = exactlyNChecked(0);

      expect(upTo0.isAllowed(0)).toBe(true);
      expect(exactly0.isAllowed(0)).toBe(true);
      expect(upTo0.isAllowed(1)).toBe(false);
      expect(exactly0.isAllowed(1)).toBe(false);
    });

    it('should handle negative limits gracefully', () => {
      const upToNeg = upToNChecked(-1);
      const exactlyNeg = exactlyNChecked(-1);

      expect(upToNeg.isAllowed(0)).toBe(false);
      expect(upToNeg.isAllowed(-1)).toBe(true); // -1 <= -1 is true
      expect(exactlyNeg.isAllowed(-1)).toBe(true); // -1 === -1
      expect(exactlyNeg.isAllowed(0)).toBe(false);
    });

    it('should handle very large numbers', () => {
      const upTo1000 = upToNChecked(1000);
      const exactly500 = exactlyNChecked(500);

      expect(upTo1000.isAllowed(999)).toBe(true);
      expect(upTo1000.isAllowed(1000)).toBe(true);
      expect(upTo1000.isAllowed(1001)).toBe(false);

      expect(exactly500.isAllowed(500)).toBe(true);
      expect(exactly500.isAllowed(501)).toBe(false);
    });

    it('should toAllowedNumbers cap at 20', () => {
      const upTo100 = upToNChecked(100);
      const allowed = upTo100.toAllowedNumbers();

      expect(allowed).toHaveLength(20);
      expect(allowed[allowed.length - 1]).toBe(19);
    });

    it('should handle either with same function twice', () => {
      const exactly3 = exactlyNChecked(3);
      const condition = either(exactly3, exactly3);

      expect(condition.isAllowed(3)).toBe(true);
      expect(condition.isAllowed(2)).toBe(false);
    });

    it('should handle either with opposite ranges', () => {
      const upTo5 = upToNChecked(5);
      const exactly10 = exactlyNChecked(10);
      const condition = either(upTo5, exactly10);

      expect(condition.isAllowed(0)).toBe(true); // upTo5
      expect(condition.isAllowed(5)).toBe(true); // upTo5
      expect(condition.isAllowed(6)).toBe(false); // neither
      expect(condition.isAllowed(10)).toBe(true); // exactly10
    });

    it('should work correctly with CardCollection of size 0', () => {
      const upTo10 = upToNChecked(10);
      const exactly0 = exactlyNChecked(0);
      const collection0 = createMockCardCollection(0);

      expect(upTo10.matches(collection0)).toBe(true);
      expect(exactly0.matches(collection0)).toBe(true);
    });

    it('should work correctly with CardCollection of size 1', () => {
      const exactly1 = exactlyNChecked(1);
      const upTo1 = upToNChecked(1);
      const collection1 = createMockCardCollection(1);

      expect(exactly1.matches(collection1)).toBe(true);
      expect(upTo1.matches(collection1)).toBe(true);
    });
  });

  describe('Combined Scenario Tests', () => {
    it('should filter selections for player choice scenarios', () => {
      // Scenario: Player can choose 1, 2, or 5 cards
      const exactly1 = exactlyNChecked(1);
      const exactly2 = exactlyNChecked(2);
      const exactly5 = exactlyNChecked(5);

      const allowedSelections = either(exactly1, either(exactly2, exactly5));

      const validSelections = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((num) => allowedSelections.isAllowed(num));

      expect(validSelections).toEqual([1, 2, 5]);
    });

    it('should handle up to N or exactly one of something', () => {
      const upTo3 = upToNChecked(3);
      const exactly10 = exactlyNChecked(10);
      const condition = either(upTo3, exactly10);

      const validNumbers = [0, 1, 2, 3, 4, 5, 10, 11];
      const results = validNumbers.map((num) => ({
        number: num,
        allowed: condition.isAllowed(num),
      }));

      expect(results).toEqual([
        { number: 0, allowed: true },
        { number: 1, allowed: true },
        { number: 2, allowed: true },
        { number: 3, allowed: true },
        { number: 4, allowed: false },
        { number: 5, allowed: false },
        { number: 10, allowed: true },
        { number: 11, allowed: false },
      ]);
    });
  });
});
