import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, resolveEffects } from './seasideHelpers';

describe('Astrolabe', () => {
  it('gives $1 and +1 Buy now and at the start of the next turn, staying in play until then', async () => {
    const game = createGame({ kingdom: ['Astrolabe'] });
    game.alice.setHand(['Astrolabe', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Astrolabe');
    expect(game.alice.coins).toBe(1);
    expect(game.alice.buys).toBe(2);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Astrolabe']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.coins).toBe(1);
    expect(game.alice.buys).toBe(2);
    expect(game.alice.inPlay).toEqual(['Astrolabe']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Astrolabe');
  });

  it('gives $2 and +2 Buys now and next turn when played twice by Tiara, which stays in play with it', async () => {
    const game = createGame({ kingdom: ['Astrolabe', 'Tiara'] });
    game.alice.setHand(['Tiara', 'Astrolabe', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard('Astrolabe');
    expect(game.alice.coins).toBe(2);
    expect(game.alice.buys).toBe(4);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Tiara', 'Astrolabe']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.coins).toBe(2);
    expect(game.alice.buys).toBe(3);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
  });

  it('cannot be played by Throne Room, as it is not an Action', async () => {
    const game = createGame({ kingdom: ['Astrolabe', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Astrolabe', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));

    await game.start();
    await game.playAction('Throne Room');

    expect(game.alice.inPlay).toEqual(['Throne Room']);
    expect(game.alice.hand).toContain('Astrolabe');
    expect(game.alice.coins).toBe(0);
  });

  it('gives $2 and +2 Buys now and next turn when played twice by Coronet, which stays in play with it', async () => {
    const game = createGame({ kingdom: ['Astrolabe'] });
    game.alice.setHand(['Coronet', 'Astrolabe', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('Astrolabe');
    expect(game.alice.coins).toBe(2);
    expect(game.alice.buys).toBe(3);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Coronet', 'Astrolabe']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.coins).toBe(2);
    expect(game.alice.buys).toBe(3);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Coronet', 'Astrolabe']));
  });

  it('played on an Outpost turn, gives its $1 and +1 Buy at the start of the next normal turn', async () => {
    const game = createGame({ kingdom: ['Astrolabe', 'Outpost'] });
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Astrolabe', 'Copper', 'Copper', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);

    expect(game.currentPlayerName).toBe('Alice');
    await game.playTreasure('Astrolabe');
    expect(game.alice.buys).toBe(2);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Astrolabe']);
    expect(game.bob.buys).toBe(1);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.coins).toBe(1);
    expect(game.alice.buys).toBe(2);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
  });
});
