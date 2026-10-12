import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');

describe('BanditCamp', () => {
  it('played twice by Throne Room with one Spoils left gains only that Spoils', async () => {
    const game = createGame({ kingdom: ['Bandit Camp', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Bandit Camp', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Spoils', 1);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Bandit Camp');

    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.actions).toBe(4);
    expect(game.alice.discard).toEqual(['Spoils']);
    expect(game.pileSize('Spoils')).toBe(0);
  });
});

describe('BanditCamp: interactions', () => {
  it('taking the last Spoils does not count toward the 3 empty Supply piles', async () => {
    const game = createGame({ kingdom: ['Bandit Camp'] });
    game.alice.setHand(['Bandit Camp', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);
    game.setPileSize('Spoils', 1);
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);

    await game.start();
    await game.playAction('Bandit Camp');
    expect(game.pileSize('Spoils')).toBe(0);
    await game.endTurn();

    expect(game.isFinished).toBe(false);
    expect(game.currentPlayerName).toBe('Bob');
  });

  it("played three times by King's Court gains 3 Spoils", async () => {
    const game = createGame({ kingdom: ['Bandit Camp', "King's Court"] });
    game.alice.setHand(["King's Court", 'Bandit Camp', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Bandit Camp');

    expect(game.alice.discard).toEqual(['Spoils', 'Spoils', 'Spoils']);
    expect(game.alice.actions).toBe(6);
    expect(game.alice.hand).toHaveLength(6);
  });

  it('draws before gaining the Spoils: with an empty deck and discard pile it draws nothing and the Spoils stays in the discard', async () => {
    const game = createGame({ kingdom: ['Bandit Camp'] });
    game.alice.setHand(['Bandit Camp', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Bandit Camp');

    expect(game.alice.hand).toEqual(['Copper', 'Copper']);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.discard).toEqual(['Spoils']);
  });
});
