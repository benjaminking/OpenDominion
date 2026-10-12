import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('JunkDealer', () => {
  it('must trash a card, which can be the card it just drew', async () => {
    const game = createGame({ kingdom: ['Junk Dealer'] });
    game.alice.setHand(['Junk Dealer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Curse', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Junk Dealer');

    game.expectDecision('chooseCard', 'Alice');
    expect(game.pending.noneAllowed).toBe(false);
    await game.chooseCard('Curse');

    expect(game.trash).toEqual(['Curse']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper']);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.coins).toBe(1);
  });
});

describe('JunkDealer: interactions', () => {
  it('played twice by Throne Room can trash the same Fortress twice, as it returns to hand each time', async () => {
    const game = createGame({ kingdom: ['Junk Dealer', 'Throne Room', 'Fortress'] });
    game.alice.setHand(['Throne Room', 'Junk Dealer', 'Fortress', 'Estate', 'Estate']);
    game.alice.setDeck(['Copper', 'Copper', ...Array<string>(20).fill('Copper')]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Junk Dealer');
    await game.chooseCard('Fortress');
    expect(game.alice.hand).toContain('Fortress');
    await game.chooseCard('Fortress');

    expect(game.trash).toEqual([]);
    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Copper', 'Copper', 'Fortress']);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(2);
    // Fortress can now be played
    await game.playAction('Fortress');
    expect(game.alice.actions).toBe(3);
  });

  it('with an empty deck and discard pile draws nothing, but still gives +1 Action, +$1 and must trash a card', async () => {
    const game = createGame({ kingdom: ['Junk Dealer'] });
    game.alice.setHand(['Junk Dealer', 'Estate', 'Copper']);

    await game.start();
    await game.playAction('Junk Dealer');

    game.expectDecision('chooseCard', 'Alice');
    expect(game.pending.noneAllowed).toBe(false);
    await game.chooseCard('Estate');

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.coins).toBe(1);
  });

  it('can trash any card type, e.g. an Action-Treasure (Coronet) or a Spoils, which stays in the trash', async () => {
    const game = createGame({ kingdom: ['Junk Dealer', 'Marauder'] });
    game.alice.setHand(['Junk Dealer', 'Coronet', 'Spoils', 'Estate']);
    game.alice.setDeck(['Copper', ...Array<string>(20).fill('Copper')]);
    const spoils = game.pileSize('Spoils');

    await game.start();
    await game.playAction('Junk Dealer');
    expect(game.pending.cardChoices.map((choice) => choice.card.name).sort()).toEqual([
      'Copper',
      'Coronet',
      'Estate',
      'Spoils',
    ]);
    await game.chooseCard('Spoils');

    expect(game.trash).toEqual(['Spoils']);
    expect(game.pileSize('Spoils')).toBe(spoils);
  });
});
