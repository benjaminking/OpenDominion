import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Spoils', () => {
  it('returns to its pile when played, so it is not discarded in Clean-up', async () => {
    const game = createGame({ kingdom: ['Bandit Camp'] });
    game.alice.setHand(['Spoils', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const spoils = game.pileSize('Spoils');

    await game.start();
    await game.playTreasure('Spoils');
    expect(game.alice.coins).toBe(3);
    expect(game.alice.inPlay).toEqual([]);
    expect(game.pileSize('Spoils')).toBe(spoils + 1);

    await game.endTurn();
    expect(game.alice.discard).not.toContain('Spoils');
  });

  it('gives $3 twice but returns to its pile only once when Counterfeit plays it twice, and is not trashed', async () => {
    const game = createGame({ kingdom: ['Bandit Camp', 'Counterfeit'] });
    game.alice.setHand(['Counterfeit', 'Spoils', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const spoils = game.pileSize('Spoils');

    await game.start();
    await game.playTreasure('Counterfeit');
    await game.chooseCard('Spoils');

    expect(game.alice.coins).toBe(7);
    expect(game.alice.buys).toBe(2);
    expect(game.pileSize('Spoils')).toBe(spoils + 1);
    expect(game.trash).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Counterfeit']);
    // The second play still gives $3, but has lost track of the Spoils, as does Counterfeit
    expect(game.alice.log.filter((line) => line === 'Alice has lost track of Spoils')).toHaveLength(2);
  });

  it('returns to the Spoils pile even when that pile is empty', async () => {
    const game = createGame({ kingdom: ['Bandit Camp'] });
    game.alice.setHand(['Spoils', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Spoils', 0);

    await game.start();
    await game.playTreasure('Spoils');

    expect(game.alice.coins).toBe(3);
    expect(game.alice.inPlay).toEqual([]);
    expect(game.pileSize('Spoils')).toBe(1);
  });

  it('gives $3 twice but returns to its empty pile only once when Tiara plays it twice', async () => {
    const game = createGame({ kingdom: ['Bandit Camp', 'Tiara'] });
    game.alice.setHand(['Tiara', 'Spoils', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Spoils', 0);
    const spoils = game.pileSize('Spoils');

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard('Spoils');

    expect(game.alice.coins).toBe(6);
    expect(game.alice.buys).toBe(2);
    expect(game.pileSize('Spoils')).toBe(spoils + 1);
    expect(game.alice.inPlay).toEqual(['Tiara']);
    // The second play has lost track of it
    expect(game.alice.log).toContain('Alice has lost track of Spoils');

    await game.endTurn();
    expect(game.alice.discard).not.toContain('Spoils');
  });

  it('gives $3 twice but returns to its pile only once when Coronet plays it twice', async () => {
    const game = createGame({ kingdom: ['Bandit Camp'] });
    game.alice.setHand(['Coronet', 'Spoils', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const spoils = game.pileSize('Spoils');

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('Spoils');

    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
    expect(game.alice.coins).toBe(6);
    expect(game.pileSize('Spoils')).toBe(spoils + 1);
    expect(game.alice.inPlay).toEqual(['Coronet']);
    // The second play has lost track of it
    expect(game.alice.log).toContain('Alice has lost track of Spoils');

    await game.endTurn();
    expect(game.alice.discard).not.toContain('Spoils');
  });
});
