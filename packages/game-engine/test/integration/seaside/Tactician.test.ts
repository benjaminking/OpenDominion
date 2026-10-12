import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers } from './seasideHelpers';

describe('Tactician', () => {
  it('does nothing with an empty hand and is discarded in the same clean-up', async () => {
    const game = createGame({ kingdom: ['Tactician'] });
    game.alice.setHand(['Tactician']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Tactician');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toEqual(['Tactician']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.buys).toBe(1);
  });

  it('discards the hand, then gives +5 Cards, +1 Action and +1 Buy at the start of the next turn', async () => {
    const game = createGame({ kingdom: ['Tactician'] });
    game.alice.setHand(['Tactician', 'Copper', 'Copper', 'Silver', 'Estate']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Tactician');
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard).toEqual(['Copper', 'Copper', 'Silver', 'Estate']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Tactician']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(10);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.buys).toBe(2);
    expect(game.alice.inPlay).toEqual(['Tactician']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
  });

  it('gives its bonus only once when played twice by Throne Room, and the Throne Room stays in play with it', async () => {
    const game = createGame({ kingdom: ['Tactician', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Tactician', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(30));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Tactician');
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Throne Room', 'Tactician']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(10);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.buys).toBe(2);
    expect(game.alice.inPlay).toEqual(['Throne Room', 'Tactician']);
  });
  it('draws as many of the 5 cards as it can at the start of the next turn', async () => {
    const game = createGame({ kingdom: ['Tactician'] });
    game.alice.setHand(['Tactician', 'Estate']);
    game.alice.setDeck(coppers(7));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Tactician');
    await game.endTurn();

    expect(game.alice.deck).toHaveLength(2);
    expect(game.alice.discard).toEqual(['Estate']);
    await game.endTurn();

    // 2 cards from the deck, then the Estate after shuffling
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(8);
    expect(game.alice.hand).toContain('Estate');
    expect(game.alice.actions).toBe(2);
    expect(game.alice.buys).toBe(2);
  });

  it('lets a Tunnel discarded with the hand be revealed to gain a Gold', async () => {
    const game = createGame({ kingdom: ['Tactician', 'Tunnel'] });
    game.alice.setHand(['Tactician', 'Tunnel', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Tactician');
    await game.chooseEffect('Tunnel');

    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Tunnel', 'Copper', 'Gold']));
  });
});
