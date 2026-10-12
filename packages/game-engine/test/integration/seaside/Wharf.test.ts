import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, offeredEffects, resolveEffects } from './seasideHelpers';

describe('Wharf', () => {
  it('gives +4 Cards and +2 Buys at the start of the next turn when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Wharf', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Wharf', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(30));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Wharf');
    expect(game.alice.hand).toHaveLength(7);
    expect(game.alice.buys).toBe(3);
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(9);
    expect(game.alice.buys).toBe(3);
  });

  it('lets its owner choose the order of Wharf and Lighthouse at the start of the next turn', async () => {
    const game = createGame({ kingdom: ['Wharf', 'Lighthouse'] });
    game.alice.setHand(['Lighthouse', 'Wharf', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(30));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Lighthouse');
    await game.playAction('Wharf');
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    const durations = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect([...offeredEffects(durations)].sort()).toEqual(['Lighthouse', 'Wharf']);
    expect(durations.optionalEffects).toEqual([]);
    await resolveEffects(game, ['Lighthouse', 'Wharf']);

    expect(game.alice.coins).toBe(1);
    expect(game.alice.hand).toHaveLength(7);
    expect(game.alice.buys).toBe(2);
  });

  it('can draw cards that Tide Pools discarded first at the start of the same turn, by shuffling them in', async () => {
    const game = createGame({ kingdom: ['Wharf', 'Tide Pools'] });
    game.alice.setHand(['Tide Pools', 'Wharf']);
    game.alice.setDeck([...coppers(5), 'Estate', 'Estate', 'Gold', 'Gold', 'Gold']);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Tide Pools');
    await game.playAction('Wharf');
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual(coppers(5));
    await game.chooseEffect('Tide Pools');
    await game.chooseCards(['Estate', 'Estate']);
    await resolveEffects(game);

    // Wharf shuffled the 5 Coppers and the 2 discarded Estates together, then drew 2 of them
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.hand.filter((name) => name === 'Gold')).toHaveLength(3);
    expect(game.alice.discard).toEqual([]);
    expect([...game.alice.hand, ...game.alice.deck].filter((name) => name !== 'Gold').sort()).toEqual([
      ...coppers(5),
      'Estate',
      'Estate',
    ]);
  });

  it('played on an Outpost turn, gives its +2 Cards and +1 Buy at the start of the next normal turn', async () => {
    const game = createGame({ kingdom: ['Wharf', 'Outpost'] });
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Wharf', 'Copper', 'Copper', ...coppers(30)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Wharf');
    expect(game.alice.hand).toHaveLength(4);
    expect(game.alice.buys).toBe(2);
    await game.endTurn();

    // The Outpost is done, but the Wharf waits through Bob's turn
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Wharf']);
    expect(game.alice.hand).toHaveLength(5);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(7);
    expect(game.alice.buys).toBe(2);
    expect(game.alice.inPlay).toEqual(['Wharf']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Wharf');
  });

  it('still gives +1 Buy at the start of the next turn when there is nothing left to draw', async () => {
    const game = createGame({ kingdom: ['Wharf'] });
    game.alice.setHand(['Wharf']);
    game.alice.setDeck(['Copper', 'Copper']);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Wharf');
    expect(game.alice.hand).toEqual(['Copper', 'Copper']);
    await game.endTurn();

    // Clean-up drew the 2 Coppers back; the Wharf is still in play, so nothing is left to draw
    expect(game.alice.hand).toEqual(['Copper', 'Copper']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper']);
    expect(game.alice.buys).toBe(2);
    expect(game.alice.inPlay).toEqual(['Wharf']);
  });
});
