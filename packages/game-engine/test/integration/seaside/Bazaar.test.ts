import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers } from './seasideHelpers';

describe('Bazaar', () => {
  it('gives +1 Card, +2 Actions and +$1', async () => {
    const game = createGame({ kingdom: ['Bazaar'] });
    game.alice.setHand(['Bazaar', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', ...coppers(10)]);

    await game.start();
    await game.playAction('Bazaar');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.coins).toBe(1);
  });

  it('still gives +2 Actions and +$1 when there is nothing to draw', async () => {
    const game = createGame({ kingdom: ['Bazaar'] });
    game.alice.setHand(['Bazaar', 'Copper']);

    await game.start();
    await game.playAction('Bazaar');

    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.coins).toBe(1);
  });

  it('shuffles the discard pile into the deck to draw', async () => {
    const game = createGame({ kingdom: ['Bazaar'] });
    game.alice.setHand(['Bazaar', 'Copper']);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Bazaar');

    expect(game.alice.hand).toEqual(['Copper', 'Gold']);
    expect(game.alice.discard).toEqual([]);
  });

  it('gives +2 Cards, +4 Actions and +$2 when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Bazaar', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Bazaar', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Bazaar');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Silver', 'Gold']);
    expect(game.alice.actions).toBe(4);
    expect(game.alice.coins).toBe(2);
  });
});
