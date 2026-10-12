import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers } from './seasideHelpers';

describe('Warehouse', () => {
  it('discards the whole hand when fewer than 3 cards are in hand after drawing', async () => {
    const game = createGame({ kingdom: ['Warehouse'] });
    game.alice.setHand(['Warehouse']);
    game.alice.setDeck(['Copper', 'Estate']);

    await game.start();
    await game.playAction('Warehouse');
    if (game.pending.kind === 'chooseCards') {
      await game.chooseCards(['Copper', 'Estate']);
    }

    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard).toEqual(['Copper', 'Estate']);
  });

  it('shuffles the discard pile into the deck to finish drawing 3 cards', async () => {
    const game = createGame({ kingdom: ['Warehouse'] });
    game.alice.setHand(['Warehouse', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate']);
    game.alice.setDiscard(['Silver', 'Silver']);

    await game.start();
    await game.playAction('Warehouse');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Estate', 'Silver', 'Silver']);
    await game.chooseCards(['Estate', 'Copper', 'Copper']);

    expect(game.alice.hand).toEqual(['Silver', 'Silver']);
    expect(game.alice.actions).toBe(1);
  });

  it('lets a discarded Tunnel be revealed to gain a Gold', async () => {
    const game = createGame({ kingdom: ['Warehouse', 'Tunnel'] });
    game.alice.setHand(['Warehouse', 'Tunnel', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Estate', 'Silver', ...coppers(10)]);

    await game.start();
    await game.playAction('Warehouse');
    await game.chooseCards(['Tunnel', 'Estate', 'Estate']);
    await game.chooseEffect('Tunnel');

    expect(game.alice.discard).toEqual(expect.arrayContaining(['Tunnel', 'Estate', 'Estate', 'Gold']));
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Silver']);
  });

  it('discards the whole hand when the deck and discard pile together have fewer than 3 cards', async () => {
    const game = createGame({ kingdom: ['Warehouse'] });
    game.alice.setHand(['Warehouse', 'Copper']);
    game.alice.setDeck(['Estate']);
    game.alice.setDiscard(['Silver']);

    await game.start();
    await game.playAction('Warehouse');
    expect(game.alice.hand).toEqual(['Copper', 'Estate', 'Silver']);
    expect(game.expectDecision('chooseCards', 'Alice').numSelectedEligibility).toEqual([3]);
    await game.chooseCards(['Copper', 'Estate', 'Silver']);

    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard.sort()).toEqual(['Copper', 'Estate', 'Silver']);
  });
  it('draws 3 and discards 3 on each play when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Warehouse', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Warehouse', 'Copper']);
    game.alice.setDeck(['Estate', 'Estate', 'Silver', 'Curse', 'Duchy', 'Gold', ...coppers(5)]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Warehouse');
    await game.chooseCards(['Estate', 'Estate', 'Copper']);
    // The second play has drawn 3 more
    expect(game.alice.hand).toEqual(['Silver', 'Curse', 'Duchy', 'Gold']);
    await game.chooseCards(['Curse', 'Duchy', 'Silver']);

    expect(game.alice.hand).toEqual(['Gold']);
    expect(game.alice.discard).toHaveLength(6);
    expect(game.alice.actions).toBe(2);
  });
});
