import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const KINGDOM = ['Crossroads', 'Throne Room', 'Farmland', 'Tunnel', 'Village'];
const COPPERS = Array<string>(10).fill('Copper');

describe('Crossroads', () => {
  it('gives +3 Actions only on the first play when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Throne Room', 'Crossroads', 'Estate', 'Estate', 'Copper']);
    game.alice.setDeck(['Copper', 'Duchy', 'Silver', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Crossroads');

    // 1st play: 2 Victory cards → draws Copper, Duchy; +3 Actions
    // 2nd play: 3 Victory cards → draws Silver, Gold, Copper; no Actions
    expect(game.alice.actions).toBe(3);
    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Copper', 'Copper', 'Duchy', 'Silver', 'Gold', 'Copper']);
  });

  it('counts cards with the Victory type among other types, such as Tunnel', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Crossroads', 'Tunnel', 'Farmland', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Crossroads');

    expect(game.alice.hand).toEqual(['Tunnel', 'Farmland', 'Copper', 'Copper', 'Silver', 'Gold']);
    expect(game.alice.actions).toBe(3);
  });

  it('draws only what is left when there are more Victory cards than cards to draw', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Crossroads', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Silver']);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Crossroads');

    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Estate', 'Estate', 'Silver', 'Gold']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.actions).toBe(3);
  });

  it('gives +3 Actions again for the first Crossroads of a later turn', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Crossroads', 'Crossroads', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Crossroads', 'Copper', 'Copper', 'Copper', 'Copper', ...COPPERS]);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Crossroads');
    expect(game.alice.actions).toBe(3);
    await game.playAction('Crossroads');
    expect(game.alice.actions).toBe(2);
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Crossroads');
    expect(game.alice.actions).toBe(3);
  });

  it('gives no +3 Actions after a Crossroads that Band of Misfits played from the Supply', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Band Of Misfits'] });
    game.alice.setHand(['Band Of Misfits', 'Crossroads', 'Estate', 'Estate', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', 'Duchy', 'Copper', ...COPPERS]);
    const crossroads = game.pileSize('Crossroads');

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Crossroads');

    // The Crossroads played from the Supply is the first one this turn
    expect(game.alice.actions).toBe(3);
    expect(game.alice.hand).toEqual(['Crossroads', 'Estate', 'Estate', 'Copper', 'Silver', 'Gold']);
    expect(game.pileSize('Crossroads')).toBe(crossroads);

    await game.playAction('Crossroads');
    expect(game.alice.actions).toBe(2);
    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Copper', 'Silver', 'Gold', 'Duchy', 'Copper']);
  });

  it('gives +3 Actions again for the first Crossroads of an extra turn from Outpost', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Outpost'] });
    game.alice.setHand(['Outpost', 'Crossroads', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Crossroads', 'Estate', 'Copper', ...COPPERS]);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Crossroads');
    expect(game.alice.actions).toBe(3);
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(['Crossroads', 'Estate', 'Copper']);
    await game.playAction('Crossroads');
    expect(game.alice.actions).toBe(3);
  });

  it('counts every card with the Victory type (Mill, Farm, Dame Josephine, Overgrown Estate), but not Hovel or Curse', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Mill', 'Farm'] });
    game.alice.setHand([
      'Crossroads',
      'Mill',
      'Farm',
      'Dame Josephine',
      'Overgrown Estate',
      'Hovel',
      'Curse',
      'Copper',
    ]);
    game.alice.setDeck(['Silver', 'Silver', 'Silver', 'Silver', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Crossroads');

    expect(game.alice.hand).toEqual([
      'Mill',
      'Farm',
      'Dame Josephine',
      'Overgrown Estate',
      'Hovel',
      'Curse',
      'Copper',
      'Silver',
      'Silver',
      'Silver',
      'Silver',
    ]);
    expect(game.alice.deck[0]).toBe('Gold');
    expect(game.alice.actions).toBe(3);
  });

  it('draws nothing with an empty deck and discard pile, but still gives +3 Actions', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Crossroads', 'Estate', 'Estate', 'Village']);

    await game.start();
    await game.playAction('Crossroads');

    game.expectDecision('actionPhase', 'Alice');
    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Village']);
    expect(game.alice.actions).toBe(3);
  });
});
