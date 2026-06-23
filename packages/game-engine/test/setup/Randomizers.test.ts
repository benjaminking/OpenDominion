import { CardLocation } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { CardFactory } from '../../src/card/CardFactory';
import { KingdomChooser } from '../../src/setup/KingdomChooser';

describe('KingdomChooser required cards', () => {
  it('returns required randomizers first and tracks remaining kingdom slots', () => {
    const createCard = vi.fn((name: string) => ({
      getPileName: () => name,
      getSetupRules: () => ({
        hasAnyGameStateSetupRules: () => false,
      }),
      isFromExpansion: () => false,
    }));
    const chooser = new KingdomChooser({ createCard } as unknown as CardFactory, ['Village']);

    const first = chooser.getNextKingdomRandomizer();

    expect(first?.getPileName()).toBe('Village');
    expect(chooser.hasMoreKingdomCards()).toBe(true);
    expect(createCard).toHaveBeenCalledWith('Village', 'Village_randomizer', CardLocation.PILE);
  });
});
