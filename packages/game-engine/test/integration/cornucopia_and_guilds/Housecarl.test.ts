import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Housecarl', () => {
  it('counts each differently named Action card in play once, including Coronet and itself', async () => {
    const game = createGame({ kingdom: ['Village'] });
    game.alice.setHand(['Village', 'Village', 'Coronet', 'Housecarl']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Village');
    await game.playAction('Coronet');
    // Coronet: no non-Reward Action in hand; decline playing a Copper
    if (game.pending.kind === 'chooseCard') {
      await game.chooseNone();
    }
    expect(game.alice.hand).toEqual(['Housecarl', 'Copper', 'Copper']);
    await game.playAction('Housecarl');

    // Village, Coronet and Housecarl
    expect(game.alice.hand).toEqual(coppers(5));
  });

  it('played twice by Throne Room, counts Throne Room and itself each time', async () => {
    const game = createGame({ kingdom: ['Throne Room'] });
    game.alice.setHand(['Throne Room', 'Housecarl']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Housecarl');

    expect(game.alice.hand).toEqual(coppers(4));
  });

  it('counts a Duration still in play from last turn and an Action–Victory card', async () => {
    const game = createGame({ kingdom: ['Wharf'] });
    game.alice.setHand(['Wharf', 'Copper', 'Copper', 'Copper', 'Copper']);
    // Wharf draws 2 now; the next hand is 5 cards; Wharf draws 2 more at the start of the next turn
    game.alice.setDeck([
      'Copper',
      'Copper',
      'Village',
      'Demesne',
      'Housecarl',
      'Estate',
      'Estate',
      'Estate',
      'Estate',
      ...coppers(10),
    ]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Wharf');
    await game.endTurn();
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Wharf']);
    expect(game.alice.hand).toHaveLength(7);
    await game.playAction('Village');
    await game.playAction('Demesne');
    await game.playAction('Housecarl');

    // Wharf, Village, Demesne and Housecarl
    expect(game.alice.hand).toHaveLength(7 - 1 + 1 - 1 - 1 + 4);
    expect(game.alice.deck).toHaveLength(10 - 1 - 4);
  });

  it('counts differently named Ruins and Shelters, and draws only what the deck and discard pile hold', async () => {
    const game = createGame({ kingdom: ['Village'] });
    game.alice.setHand(['Necropolis', 'Ruined Village', 'Abandoned Mine', 'Housecarl']);
    game.alice.setDeck(['Gold', 'Gold']);
    game.alice.setDiscard(['Silver']);

    await game.start();
    await game.playAction('Necropolis');
    await game.playAction('Ruined Village');
    await game.playAction('Abandoned Mine');
    await game.playAction('Housecarl');

    // Necropolis, Ruined Village, Abandoned Mine and Housecarl: +4 Cards, but only 3 are left
    expect(game.alice.hand).toEqual(['Gold', 'Gold', 'Silver']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
  });
});
