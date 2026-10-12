import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');

const setUp = (hand: string[]) => {
  const game = createGame({ kingdom: ['Hermit', 'Throne Room', 'Village'] });
  game.alice.setHand(hand);
  game.alice.setDeck(COPPERS);
  game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
  game.bob.setDeck(COPPERS);
  return { game, hermits: game.pileSize('Hermit'), madmen: game.pileSize('Madman') };
};

describe('Hermit', () => {
  it('is exchanged for a Madman at the end of a Buy phase with no gains, even after gaining in the Action phase', async () => {
    const { game, hermits, madmen } = setUp(['Hermit', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Hermit');
    await game.chooseCard('Silver', CardLocation.PILE);
    await game.playAllTreasures();
    await game.endBuyPhase();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pileSize('Hermit')).toBe(hermits + 1);
    expect(game.pileSize('Madman')).toBe(madmen - 1);
    expect(game.alice.discard).toContain('Madman');
    expect(game.alice.discard).toContain('Silver');
    expect([...game.alice.discard, ...game.alice.hand, ...game.alice.deck]).not.toContain('Hermit');
  });

  it('is not exchanged when a card is bought', async () => {
    const { game, hermits, madmen } = setUp(['Hermit', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Hermit');
    await game.chooseCard('Silver', CardLocation.PILE);
    await game.playAllTreasures();
    await game.buy('Copper');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pileSize('Hermit')).toBe(hermits);
    expect(game.pileSize('Madman')).toBe(madmen);
    expect(game.alice.discard).toContain('Hermit');
  });

  it('is not exchanged on a later turn in which nothing is gained', async () => {
    const { game, madmen } = setUp(['Hermit', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Hermit');
    await game.chooseCard('Silver', CardLocation.PILE);
    await game.playAllTreasures();
    await game.buy('Copper');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pileSize('Madman')).toBe(madmen);
    expect(game.alice.discard).not.toContain('Madman');
  });

  it('exchanges each of two Hermits played in the same turn', async () => {
    const { game, hermits, madmen } = setUp(['Village', 'Hermit', 'Hermit', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Hermit');
    // The other Hermit in hand could be trashed; keep it
    await game.chooseNone();
    await game.chooseCard('Silver', CardLocation.PILE);
    await game.playAction('Hermit');
    await game.chooseCard('Silver', CardLocation.PILE);
    await game.endBuyPhase();

    expect(game.pileSize('Hermit')).toBe(hermits + 2);
    expect(game.pileSize('Madman')).toBe(madmen - 2);
    expect(game.alice.discard.filter((name) => name === 'Madman')).toHaveLength(2);
  });

  it('played twice by Throne Room is exchanged only once', async () => {
    const { game, hermits, madmen } = setUp(['Throne Room', 'Hermit', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Hermit');
    await game.chooseCard('Silver', CardLocation.PILE);
    await game.chooseCard('Silver', CardLocation.PILE);
    await game.endBuyPhase();

    expect(game.pileSize('Hermit')).toBe(hermits + 1);
    expect(game.pileSize('Madman')).toBe(madmen - 1);
    expect(game.alice.discard.filter((name) => name === 'Madman')).toHaveLength(1);
    // The second exchange has lost track of the Hermit, which is back in its pile
    expect(game.alice.log.filter((line) => line === 'Alice has lost track of Hermit')).toHaveLength(1);
  });

  it('is not exchanged when it is no longer in play (trashed by Procession)', async () => {
    const game = createGame({ kingdom: ['Hermit', 'Procession', 'Smithy'] });
    game.alice.setHand(['Procession', 'Hermit', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(COPPERS);
    const madmen = game.pileSize('Madman');

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Hermit');
    await game.chooseCard('Silver', CardLocation.PILE);
    await game.chooseCard('Silver', CardLocation.PILE);
    // Procession trashes Hermit and gains an Action costing exactly $4
    await game.chooseCard('Smithy', CardLocation.PILE);
    expect(game.trash).toEqual(['Hermit']);
    await game.endBuyPhase();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pileSize('Madman')).toBe(madmen);
    expect(game.alice.discard).not.toContain('Madman');
    expect(game.trash).toEqual(['Hermit']);
    expect(game.alice.log).toContain('Alice has lost track of Hermit');
  });
});

describe('Hermit: interactions', () => {
  it('is discarded normally when the Madman pile is empty', async () => {
    const { game, hermits } = setUp(['Hermit', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.setPileSize('Madman', 0);

    await game.start();
    await game.playAction('Hermit');
    await game.chooseCard('Silver', CardLocation.PILE);
    await game.endBuyPhase();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pileSize('Hermit')).toBe(hermits);
    expect(game.alice.discard).toContain('Hermit');
  });

  it('is not exchanged when a Treasure (Anvil) gains a card in the Buy phase, even with no buy', async () => {
    const game = createGame({ kingdom: ['Hermit', 'Anvil'] });
    game.alice.setHand(['Hermit', 'Anvil', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(COPPERS);
    const madmen = game.pileSize('Madman');

    await game.start();
    await game.playAction('Hermit');
    await game.chooseCard('Silver', CardLocation.PILE);
    await game.playTreasure('Anvil');
    await game.chooseCard('Copper');
    await game.chooseCard('Silver', CardLocation.PILE);
    await game.endBuyPhase();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pileSize('Madman')).toBe(madmen);
    expect(game.alice.discard).toContain('Hermit');
  });

  it('trashing a Fortress from the discard pile puts the Fortress into hand', async () => {
    const game = createGame({ kingdom: ['Hermit', 'Fortress'] });
    game.alice.setHand(['Hermit', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.alice.setDiscard(['Fortress', 'Estate']);

    await game.start();
    await game.playAction('Hermit');
    await game.chooseCard('Fortress', CardLocation.DISCARD);
    await game.chooseCard('Silver', CardLocation.PILE);

    expect(game.trash).toEqual([]);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Fortress']);
    expect(game.alice.discard).toEqual(['Estate', 'Silver']);
  });

  it('is exchanged when the turn is ended from the Action phase, since the Buy phase still happens', async () => {
    const { game, hermits, madmen } = setUp(['Village', 'Hermit', 'Village', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Hermit');
    // Keep the other Village
    await game.chooseNone();
    await game.chooseCard('Silver', CardLocation.PILE);
    game.expectDecision('actionPhase', 'Alice');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pileSize('Hermit')).toBe(hermits + 1);
    expect(game.pileSize('Madman')).toBe(madmen - 1);
    expect(game.alice.discard).toContain('Madman');
  });

  it("exchanging it for a Madman isn't gaining, so Watchtower in hand isn't offered", async () => {
    const game = createGame({ kingdom: ['Hermit', 'Watchtower'] });
    game.alice.setHand(['Hermit', 'Watchtower', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(COPPERS);
    const madmen = game.pileSize('Madman');

    await game.start();
    await game.playAction('Hermit');
    // Keep the Watchtower
    await game.chooseNone();
    await game.chooseCard('Silver', CardLocation.PILE);
    // Watchtower reacts to the Silver gained by Hermit; decline it
    await game.declineEffects();
    await game.endBuyPhase();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pileSize('Madman')).toBe(madmen - 1);
    expect(game.alice.discard).toContain('Madman');
  });

  it('with two Hermits and one Madman left, only one Hermit is exchanged', async () => {
    const { game, hermits } = setUp(['Village', 'Hermit', 'Hermit', 'Copper', 'Copper']);
    game.setPileSize('Madman', 1);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Hermit');
    await game.chooseNone();
    await game.chooseCard('Silver', CardLocation.PILE);
    await game.playAction('Hermit');
    await game.chooseCard('Silver', CardLocation.PILE);
    await game.endBuyPhase();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pileSize('Madman')).toBe(0);
    expect(game.pileSize('Hermit')).toBe(hermits + 1);
    expect(game.alice.discard.filter((name) => name === 'Madman')).toHaveLength(1);
    expect(game.alice.discard.filter((name) => name === 'Hermit')).toHaveLength(1);
  });

  it("offers no card with the Treasure type, even multi-type ones (Coronet, Farm, Fool's Gold, Spoils), from hand or discard", async () => {
    const game = createGame({ kingdom: ['Hermit', 'Farm', 'Mill', "Fool's Gold", 'Marauder'] });
    game.alice.setHand(['Hermit', 'Coronet', 'Farm', 'Mill', 'Abandoned Mine']);
    game.alice.setDeck(COPPERS);
    game.alice.setDiscard(["Fool's Gold", 'Spoils', 'Hovel', 'Curse', 'Copper']);

    await game.start();
    await game.playAction('Hermit');

    game.expectDecision('chooseCard', 'Alice');
    expect(game.pending.noneAllowed).toBe(true);
    expect(game.pending.cardChoices.map((choice) => `${choice.card.name}@${choice.card.location}`).sort()).toEqual([
      `Abandoned Mine@${CardLocation.HAND}`,
      `Curse@${CardLocation.DISCARD}`,
      `Hovel@${CardLocation.DISCARD}`,
      `Mill@${CardLocation.HAND}`,
    ]);
    await game.chooseCard('Mill');
    await game.chooseCard('Silver', CardLocation.PILE);
    expect(game.trash).toEqual(['Mill']);
  });

  it('with Charlatan in the game, cannot trash a Curse, since it is a Treasure', async () => {
    const game = createGame({ kingdom: ['Hermit', 'Charlatan'] });
    game.alice.setHand(['Hermit', 'Charlatan Curse', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.alice.setDiscard(['Charlatan Curse']);

    await game.start();
    await game.playAction('Hermit');

    expect(game.pending.cardChoices.map((choice) => choice.card.name)).toEqual(['Estate']);
  });

  it('cannot gain a card with a Potion in its cost, even one costing $0P', async () => {
    const game = createGame({ kingdom: ['Hermit', 'Vineyard', 'Apothecary'] });
    game.alice.setHand(['Hermit', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Hermit');

    game.expectDecision('chooseCard', 'Alice');
    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Silver');
    expect(offered).not.toContain('Vineyard');
    expect(offered).not.toContain('Apothecary');
    expect(offered).not.toContain('Potion');
  });

  it('played by Coronet in the Buy phase gains cards in that Buy phase, so it is not exchanged; Quarry and Peddler costs apply', async () => {
    const game = createGame({ kingdom: ['Hermit', 'Quarry', 'Peddler', 'Laboratory'] });
    game.alice.setHand(['Quarry', 'Coronet', 'Hermit', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(COPPERS);
    const madmen = game.pileSize('Madman');

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Quarry');
    await game.playTreasure('Coronet');
    await game.chooseCard('Hermit');
    await game.chooseNone();
    // Quarry: Laboratory costs $3; Peddler costs $8 - $4 (Coronet and Hermit in play) - $2 = $2
    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Laboratory');
    expect(offered).toContain('Peddler');
    expect(offered).not.toContain('Duchy');
    await game.chooseCard('Laboratory', CardLocation.PILE);
    await game.chooseNone();
    await game.chooseCard('Peddler', CardLocation.PILE);
    await game.endBuyPhase();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pileSize('Madman')).toBe(madmen);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Hermit', 'Laboratory', 'Peddler']));
    expect(game.alice.discard).not.toContain('Madman');
  });
});
