import { CardLocation } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { CardFactory } from '../../src/card/CardFactory';
import { KingdomChooser } from '../../src/setup/KingdomChooser';

describe('KingdomChooser', () => {
  it('sanitizes required card names and returns them first', () => {
    const createCard = vi.fn((name: string) => ({
      getPileName: () => name,
      getSetupRules: () => ({
        hasAnyGameStateSetupRules: () => false,
      }),
      isFromExpansion: () => false,
    }));
    const chooser = new KingdomChooser({ createCard } as unknown as CardFactory, ['Village!', 'Smithy']);

    const first = chooser.getNextKingdomRandomizer();
    const second = chooser.getNextKingdomRandomizer();

    expect(first?.getPileName()).toBe('Smithy');
    expect(second?.getPileName()).toBe('Village!');
    expect(createCard).toHaveBeenCalledWith('Village!', 'Village!_randomizer', CardLocation.PILE);
    expect(createCard).toHaveBeenCalledWith('Smithy', 'Smithy_randomizer', CardLocation.PILE);
  });

  it('returns undefined when no randomizer matches after max attempts', () => {
    const createCard = vi.fn((name: string) => ({
      getPileName: () => name,
      getSetupRules: () => ({
        hasAnyGameStateSetupRules: () => false,
      }),
      isFromExpansion: () => false,
    }));
    const chooser = new KingdomChooser({ createCard } as unknown as CardFactory, []);

    const result = chooser.selectMatchingRandomizer({ doesRandomizerMatch: () => false } as never);

    expect(result).toBeUndefined();
  });
});
