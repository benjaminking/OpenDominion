import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Tiara', () => {
  it('played by another Tiara, plays two different Treasures twice each', async () => {
    const game = createGame({ kingdom: ['Tiara'] });
    game.alice.setHand(['Tiara', 'Tiara', 'Gold', 'Silver', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard('Tiara');
    expect(
      game
        .expectDecision('chooseCard', 'Alice')
        .cardChoices.map((choice) => choice.card.name)
        .sort(),
    ).toEqual(['Gold', 'Silver']);
    await game.chooseCard('Gold');
    await game.chooseCard('Silver');

    expect(game.alice.coins).toBe(10);
    expect(game.alice.buys).toBe(4);
    expect(game.alice.hand).toEqual(['Estate']);
  });

  it('lets you put any or all of the cards you gain this turn onto your deck', async () => {
    const game = createGame({ kingdom: ['Tiara'] });
    game.alice.setHand(['Tiara', 'Silver', 'Silver', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseNone();
    await game.playAllTreasures();
    await game.buy('Silver');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Tiara');
    await game.buy('Copper');
    await game.declineEffects();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand).toEqual(['Silver', 'Copper', 'Copper', 'Copper', 'Copper']);
    expect(game.alice.discard).toContain('Copper');
  });

  it('stays in play with a Duration Treasure it played twice until that card is discarded', async () => {
    const game = createGame({ kingdom: ['Tiara', 'Astrolabe'] });
    game.alice.setHand(['Tiara', 'Astrolabe', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard('Astrolabe');
    expect(game.alice.coins).toBe(2);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Tiara', 'Astrolabe']);
  });

  it('plays Spoils twice for $6, returning it to its pile only once', async () => {
    const game = createGame({ kingdom: ['Tiara', 'Bandit Camp'] });
    game.alice.setHand(['Tiara', 'Spoils', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    const spoilsBefore = game.pileSize('Spoils');

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard('Spoils');

    expect(game.alice.coins).toBe(6);
    expect(game.pileSize('Spoils')).toBe(spoilsBefore + 1);
    expect(game.alice.inPlay).toEqual(['Tiara']);
  });

  it('plays Investment twice, but the second play gives no VP once it has trashed itself', async () => {
    const game = createGame({ kingdom: ['Tiara', 'Investment'] });
    game.alice.setHand(['Tiara', 'Investment', 'Estate', 'Estate', 'Silver']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard('Investment');
    await game.chooseCard('Estate');
    await game.chooseOption('Trash this for VP');
    expect(game.alice.vpTokens).toBe(1);
    await game.chooseCard('Estate');
    await game.chooseOption('Trash this for VP');

    expect(game.alice.vpTokens).toBe(1);
    expect(game.trash).toEqual(['Estate', 'Investment', 'Estate']);
    expect(game.alice.coins).toBe(0);
  });

  it('plays a Charlatan Curse twice for $2', async () => {
    const game = createGame({ kingdom: ['Tiara', 'Charlatan'] });
    game.alice.setHand(['Tiara', 'Charlatan Curse', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard('Curse');

    expect(game.alice.coins).toBe(2);
    expect(game.alice.inPlay).toEqual(['Tiara', 'Charlatan Curse']);
  });

  it("doesn't put cards gained on an Outpost extra turn onto the deck", async () => {
    const game = createGame({ kingdom: ['Tiara', 'Outpost'] });
    game.alice.setHand(['Outpost', 'Tiara', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Silver', 'Silver', 'Copper', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Outpost');
    await game.playTreasure('Tiara');
    await game.endBuyPhase();
    await game.chooseExtraTurn('Outpost');
    await game.playAllTreasures();
    await game.buy('Silver');

    // No Tiara prompt: the extra turn is a new turn
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.deck[0]).not.toBe('Silver');
  });

  it("doesn't let anyone put cards another player gains during your turn onto a deck, e.g. Charlatan's Curse", async () => {
    const game = createGame({ kingdom: ['Tiara', 'Crystal Ball', 'Charlatan'] });
    game.alice.setHand(['Tiara', 'Crystal Ball', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Charlatan', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(5));

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseNone();
    await game.playTreasure('Crystal Ball');
    await game.chooseOption('Play it');

    // No Tiara prompt for Bob's Curse
    expect(game.bob.discard).toEqual(['Charlatan Curse']);
    expect(game.bob.deck).toEqual(coppers(5));
    expect(game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice')).toBeDefined();
    expect(game.alice.coins).toBe(4);
  });

  it('played by another Tiara, still puts each gained card onto the deck only once, losing track of it after that', async () => {
    const game = createGame({ kingdom: ['Tiara'] });
    game.alice.setHand(['Tiara', 'Tiara', 'Silver', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard('Tiara');
    // The inner Tiara plays Silver twice; its second play has no Treasure left to play
    await game.chooseCard('Silver');
    expect(game.alice.coins).toBe(4);
    expect(game.alice.buys).toBe(4);
    await game.buy('Silver');
    // Three Tiara effects are active. Once one has put the Silver onto the deck, the others are still offered, but
    // they have lost track of it
    await game.chooseEffect('Tiara');
    expect(game.alice.deck[0]).toBe('Silver');
    await game.chooseEffect('Tiara');
    await game.chooseEffect('Tiara');

    expect(game.alice.log.filter((line) => line === 'Alice has lost track of Silver')).toHaveLength(2);
    expect(game.alice.deck[0]).toBe('Silver');
    expect(game.alice.deck.filter((name) => name === 'Silver')).toHaveLength(1);
    expect(game.expectDecision('buyPhase', 'Alice').numBuys).toBe(3);
  });
});
