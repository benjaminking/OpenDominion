import { CardLocation } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { CardFactory } from '../../src/card/CardFactory';
import { KingdomCard } from '../../src/card/KingdomCard';
import { KingdomChooser } from '../../src/setup/KingdomChooser';

const createKingdomCard = (name: string): KingdomCard => {
  const card = Object.create(KingdomCard.prototype) as KingdomCard;
  card.getName = () => name;
  return card;
};

const createNonKingdomCard = (name: string): Card => {
  const card = Object.create(Card.prototype) as Card;
  card.getName = () => name;
  return card;
};

describe('KingdomChooser', () => {
  it('sanitizes required card names, skips non-kingdom cards, and fills to ten unique kingdom cards', () => {
    const kingdomNames = [
      'Village',
      'Smithy',
      'Market',
      'Festival',
      'Laboratory',
      'Witch',
      'Moat',
      'Militia',
      'Cellar',
      'Workshop',
    ];
    const nonKingdomNames = new Set(['Curse']);
    const createCard = vi.fn((name: string, id: string, location: CardLocation) => {
      expect(location).toBe(CardLocation.PILE);

      if (nonKingdomNames.has(name)) {
        return createNonKingdomCard(name);
      }

      const card = createKingdomCard(name);
      card.getId = () => id;
      card.getLocation = () => location;
      return card;
    });
    const chooser = new KingdomChooser({ createCard } as unknown as CardFactory);
    const warningSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const randomSpy = vi
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(1 / 11)
      .mockReturnValueOnce(2 / 11)
      .mockReturnValueOnce(3 / 11)
      .mockReturnValueOnce(4 / 11)
      .mockReturnValueOnce(5 / 11)
      .mockReturnValueOnce(6 / 11)
      .mockReturnValueOnce(7 / 11)
      .mockReturnValueOnce(8 / 11)
      .mockReturnValueOnce(9 / 11);

    (chooser as unknown as { allCardNames: string[] }).allCardNames = [...kingdomNames, 'Curse'];

    const randomizers = chooser.selectRandomizers(['Village!', 'Curse', 'Smithy']);

    expect(randomizers.getCards().map((card) => card.getName())).toEqual([
      'Village',
      'Smithy',
      'Market',
      'Festival',
      'Laboratory',
      'Witch',
      'Moat',
      'Militia',
      'Cellar',
      'Workshop',
    ]);
    expect(new Set(randomizers.getCards().map((card) => card.getName())).size).toBe(10);
    expect(warningSpy).toHaveBeenCalledWith('Warning: the following required card is not a kingdom card: Curse');
    expect(createCard).toHaveBeenCalledWith('Village', '', CardLocation.PILE);
    expect(createCard).toHaveBeenCalledWith('Village', 'Village_randomizer', CardLocation.PILE);
    expect(createCard).toHaveBeenCalledWith('Smithy', 'Smithy_randomizer', CardLocation.PILE);

    randomSpy.mockRestore();
    warningSpy.mockRestore();
  });

  it('clears previously used card names before each selection', () => {
    const chooser = new KingdomChooser({
      createCard: vi.fn((name: string) => createKingdomCard(name)),
    } as unknown as CardFactory);

    (chooser as unknown as { allCardNames: string[] }).allCardNames = [
      'Village',
      'Smithy',
      'Market',
      'Festival',
      'Laboratory',
      'Witch',
      'Moat',
      'Militia',
      'Cellar',
      'Workshop',
    ];

    const firstSelection = chooser.selectRandomizers(['Village', 'Smithy', 'Market', 'Festival', 'Laboratory']);
    const secondSelection = chooser.selectRandomizers(['Village', 'Witch', 'Moat', 'Militia', 'Cellar']);

    expect(firstSelection.getCards()[0].getName()).toBe('Village');
    expect(secondSelection.getCards()[0].getName()).toBe('Village');
  });
});
