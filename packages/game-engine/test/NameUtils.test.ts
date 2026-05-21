import { describe, expect, it } from 'vitest';

import { convertToClassName, convertToFileName } from '../src/NameUtils';

describe('NameUtils', () => {
  describe('convertToFileName', () => {
    it('should lowercase the name', () => {
      expect(convertToFileName('Copper')).toBe('copper');
    });

    it('should replace spaces with underscores', () => {
      expect(convertToFileName('Market Square')).toBe('market_square');
    });

    it('should collapse multiple consecutive non-word characters to a single underscore', () => {
      expect(convertToFileName('Foo  Bar')).toBe('foo_bar');
    });

    it('should remove apostrophes', () => {
      expect(convertToFileName("Witch's Hut")).toBe('witchs_hut');
    });

    it('should handle names with no special characters', () => {
      expect(convertToFileName('Gold')).toBe('gold');
    });

    it('should handle names with hyphens', () => {
      expect(convertToFileName('Well-Wishers')).toBe('well_wishers');
    });

    it('should handle names with numbers', () => {
      expect(convertToFileName('Card 2')).toBe('card_2');
    });

    it('should handle names with mixed special characters and apostrophes', () => {
      expect(convertToFileName("King's Court")).toBe('kings_court');
    });

    it('should handle an empty string', () => {
      expect(convertToFileName('')).toBe('');
    });

    it('should handle a name that is already a valid filename', () => {
      expect(convertToFileName('already_valid')).toBe('already_valid');
    });

    it('should handle names with multiple apostrophes', () => {
      expect(convertToFileName("O'Brien's Tavern")).toBe('obriens_tavern');
    });
  });

  describe('convertToClassName', () => {
    it('should remove spaces', () => {
      expect(convertToClassName('Market Square')).toBe('MarketSquare');
    });

    it('should remove apostrophes', () => {
      expect(convertToClassName("Witch's Hut")).toBe('WitchsHut');
    });

    it('should preserve capitalization', () => {
      expect(convertToClassName('Copper')).toBe('Copper');
    });

    it('should handle names with no special characters', () => {
      expect(convertToClassName('Gold')).toBe('Gold');
    });

    it('should handle names with hyphens', () => {
      expect(convertToClassName('Well-Wishers')).toBe('WellWishers');
    });

    it('should handle names with numbers', () => {
      expect(convertToClassName('Card 2')).toBe('Card2');
    });

    it('should handle names with mixed special characters and apostrophes', () => {
      expect(convertToClassName("King's Court")).toBe('KingsCourt');
    });

    it('should handle an empty string', () => {
      expect(convertToClassName('')).toBe('');
    });

    it('should not lowercase anything', () => {
      expect(convertToClassName('ALLCAPS')).toBe('ALLCAPS');
    });

    it('should handle names with multiple apostrophes', () => {
      expect(convertToClassName("O'Brien's Tavern")).toBe('OBriensTavern');
    });

    it('should remove all non-word characters except those preserved by apostrophe removal', () => {
      expect(convertToClassName('A.B!C@D')).toBe('ABCD');
    });
  });
});
