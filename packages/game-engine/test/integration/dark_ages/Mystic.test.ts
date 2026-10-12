import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Mystic', () => {
  it('shuffles the discard pile to reveal when the deck is empty, and takes the named card', async () => {
    const game = createGame({ kingdom: ['Mystic'] });
    game.alice.setHand(['Mystic', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Mystic');
    await game.chooseCard('Gold');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Gold']);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(1);
  });

  it('only gives +1 Action and +$2 when there is no card to reveal', async () => {
    const game = createGame({ kingdom: ['Mystic'] });
    game.alice.setHand(['Mystic', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Mystic');
    if (game.pending.kind === 'chooseCard') {
      await game.chooseCard('Gold');
    }

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toHaveLength(4);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(1);
  });

  it('can name a card that is not in the Supply', async () => {
    const game = createGame({ kingdom: ['Mystic'] });
    game.alice.setHand(['Mystic', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Necropolis', ...COPPERS]);

    await game.start();
    await game.playAction('Mystic');
    await game.chooseCard('Necropolis');

    expect(game.alice.hand).toContain('Necropolis');
  });

  it('names a card for each play when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Mystic', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Mystic', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', 'Silver', 'Estate', ...COPPERS]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Mystic');
    await game.chooseCard('Gold');
    await game.chooseCard('Silver');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Gold', 'Silver']);
    expect(game.alice.deck[0]).toBe('Estate');
    expect(game.alice.coins).toBe(4);
    expect(game.alice.actions).toBe(2);
  });

  it('can name a Knight that is not on top of the Knights pile', async () => {
    const game = createGame({ kingdom: ['Mystic', 'Knights'] });
    game.setPile('Knights', ['Sir Martin', 'Dame Josephine']);
    game.alice.setHand(['Mystic', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Dame Josephine', ...COPPERS]);

    await game.start();
    await game.playAction('Mystic');
    await game.chooseCard('Dame Josephine');

    expect(game.alice.hand).toContain('Dame Josephine');
  });
});
