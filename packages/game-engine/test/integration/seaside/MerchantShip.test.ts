import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, resolveEffects } from './seasideHelpers';

describe('Merchant Ship', () => {
  it('gives +$2 at the start of the next turn and stays in play until then', async () => {
    const game = createGame({ kingdom: ['Merchant Ship'] });
    game.alice.setHand(['Merchant Ship', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Merchant Ship');
    expect(game.alice.coins).toBe(2);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Merchant Ship']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.coins).toBe(2);
    expect(game.alice.inPlay).toEqual(['Merchant Ship']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Merchant Ship');
  });

  it('gives +$4 at the start of the next turn when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Merchant Ship', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Merchant Ship', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Merchant Ship');
    expect(game.alice.coins).toBe(4);
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.coins).toBe(4);
  });

  it("gives +$6 now and +$6 at the start of the next turn when played three times by King's Court, which stays in play", async () => {
    const game = createGame({ kingdom: ['Merchant Ship', "King's Court"] });
    game.alice.setHand(["King's Court", 'Merchant Ship', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Merchant Ship');
    expect(game.alice.coins).toBe(6);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(["King's Court", 'Merchant Ship']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.coins).toBe(6);
    expect(game.alice.inPlay).toEqual(["King's Court", 'Merchant Ship']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
  });
  it("played on an Outpost turn, gives its +$2 at the start of its owner's next normal turn", async () => {
    const game = createGame({ kingdom: ['Merchant Ship', 'Outpost'] });
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Merchant Ship', 'Copper', 'Copper', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);

    await game.playAction('Merchant Ship');
    expect(game.alice.coins).toBe(2);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Merchant Ship']);
    expect(game.bob.coins).toBe(0);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.coins).toBe(2);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
  });
});
