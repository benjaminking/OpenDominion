import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, resolveEffects } from './seasideHelpers';

describe('Fishing Village', () => {
  it('gives +1 Action and +$1 at the start of the next turn and stays in play until then', async () => {
    const game = createGame({ kingdom: ['Fishing Village'] });
    game.alice.setHand(['Fishing Village', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Fishing Village');
    expect(game.alice.actions).toBe(2);
    expect(game.alice.coins).toBe(1);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Fishing Village']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.actions).toBe(2);
    expect(game.alice.coins).toBe(1);
    expect(game.alice.inPlay).toEqual(['Fishing Village']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Fishing Village');
  });

  it('gives +2 Actions and +$2 at the start of the next turn when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Fishing Village', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Fishing Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Fishing Village');
    expect(game.alice.actions).toBe(4);
    expect(game.alice.coins).toBe(2);
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.actions).toBe(3);
    expect(game.alice.coins).toBe(2);
  });

  it("gives +3 Actions and +$3 at the start of the next turn when played three times by King's Court", async () => {
    const game = createGame({ kingdom: ['Fishing Village', "King's Court"] });
    game.alice.setHand(["King's Court", 'Fishing Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Fishing Village');
    expect(game.alice.actions).toBe(6);
    expect(game.alice.coins).toBe(3);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(["King's Court", 'Fishing Village']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.actions).toBe(4);
    expect(game.alice.coins).toBe(3);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
  });
  it("played on an Outpost turn, gives +1 Action and +$1 at the start of its owner's next normal turn", async () => {
    const game = createGame({ kingdom: ['Fishing Village', 'Outpost'] });
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Fishing Village', 'Copper', 'Copper', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);

    await game.playAction('Fishing Village');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Fishing Village']);
    expect(game.bob.actions).toBe(1);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.actions).toBe(2);
    expect(game.alice.coins).toBe(1);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
  });
});
