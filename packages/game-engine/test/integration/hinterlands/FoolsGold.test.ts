import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const KINGDOM = ["Fool's Gold", 'Village', 'Smithy'];
const COPPERS = Array<string>(10).fill('Copper');

describe('FoolsGold', () => {
  it('lets another player trash it from hand to gain a Gold onto their deck when you gain a Province', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Gold', 'Gold', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(["Fool's Gold", 'Estate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', ...COPPERS]);
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAllTreasures();
    await game.buy('Province');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(["Fool's Gold"]);
    expect(reaction.mandatoryEffects).toEqual([]);
    await game.chooseEffect("Fool's Gold");

    expect(game.trash).toEqual(["Fool's Gold"]);
    expect(game.bob.hand).toEqual(['Estate', 'Copper', 'Copper', 'Copper']);
    expect(game.bob.deck.slice(0, 2)).toEqual(['Gold', 'Silver']);
    expect(game.pileSize('Gold')).toBe(golds - 1);
    expect(game.currentPlayerName).toBe('Bob');
  });

  it('can be kept by declining the reaction', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Gold', 'Gold', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(["Fool's Gold", 'Estate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Province');
    await game.declineEffects();

    expect(game.trash).toEqual([]);
    expect(game.bob.hand).toContain("Fool's Gold");
    expect(game.bob.deck).toEqual(COPPERS);
  });

  it("cannot react to its owner's own Province gain", async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(["Fool's Gold", 'Gold', 'Gold', 'Silver', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playTreasure('Gold');
    await game.playTreasure('Gold');
    await game.playTreasure('Silver');
    expect(game.alice.coins).toBe(8);
    await game.buy('Province');

    // No prompt: straight on to Bob's turn
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.trash).toEqual([]);
    expect(game.alice.discard[0]).toBe('Province');
  });

  it('cannot react to another player gaining a card other than a Province', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Gold', 'Silver', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(["Fool's Gold", 'Estate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Duchy');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.bob.hand).toContain("Fool's Gold");
    expect(game.trash).toEqual([]);
  });

  it("lets a player react with each Fool's Gold in hand", async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Gold', 'Gold', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(["Fool's Gold", "Fool's Gold", 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Province');
    await game.chooseEffect("Fool's Gold");

    const second = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(second.optionalEffects.map((effect) => effect.effectName)).toEqual(["Fool's Gold"]);
    await game.chooseEffect("Fool's Gold");

    expect(game.trash).toEqual(["Fool's Gold", "Fool's Gold"]);
    expect(game.bob.deck.slice(0, 2)).toEqual(['Gold', 'Gold']);
  });

  it('lets each other player react in turn order, with 3 players', async () => {
    const game = createGame({ kingdom: KINGDOM, players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Gold', 'Gold', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(["Fool's Gold", 'Estate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);
    const cara = game.player('Cara');
    cara.setHand(["Fool's Gold", 'Estate', 'Copper', 'Copper', 'Copper']);
    cara.setDeck(COPPERS);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Province');

    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.declineEffects();
    game.expectDecision('chooseFromMultipleEvents', 'Cara');
    await game.chooseEffect("Fool's Gold");

    expect(game.trash).toEqual(["Fool's Gold"]);
    expect(game.bob.hand).toContain("Fool's Gold");
    expect(cara.deck[0]).toBe('Gold');
  });

  it("is worth $1 and then $4 when Counterfeit plays the same Fool's Gold twice", async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Counterfeit'] });
    game.alice.setHand(['Counterfeit', "Fool's Gold", 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playTreasure('Counterfeit');
    await game.chooseCard("Fool's Gold");

    // Counterfeit's $1, then $1 for the first Fool's Gold played this turn and $4 for the second
    expect(game.alice.coins).toBe(6);
    expect(game.alice.buys).toBe(2);
    expect(game.trash).toEqual(["Fool's Gold"]);
  });

  it('lets another player react to a Province gained without buying it, e.g. with Remodel', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Remodel'] });
    game.alice.setHand(['Remodel', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(["Fool's Gold", 'Estate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Remodel');
    await game.chooseCard('Gold');
    await game.chooseCard('Province');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(["Fool's Gold"]);
    await game.chooseEffect("Fool's Gold");

    expect(game.bob.deck[0]).toBe('Gold');
    expect(game.trash).toEqual(['Gold', "Fool's Gold"]);
  });

  it("can react on its owner's own turn, when their Attack makes another player gain a Province", async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Swindler'] });
    game.alice.setHand(['Swindler', "Fool's Gold", 'Copper', 'Copper', 'Copper']);
    game.bob.setHand(["Fool's Gold", 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Province', ...COPPERS]);

    await game.start();
    await game.playAction('Swindler');
    // Bob trashes his Province; Alice picks a card costing $8 for him to gain
    await game.chooseCard('Province');

    // Only Alice's Fool's Gold reacts: Bob's can't react to his own gain
    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(["Fool's Gold"]);
    await game.chooseEffect("Fool's Gold");

    // The Gold goes onto Alice's empty deck
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.deck).toEqual(['Gold']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper']);
    expect(game.trash).toEqual(['Province', "Fool's Gold"]);
    expect(game.bob.discard).toEqual(['Province']);
    expect(game.bob.hand).toContain("Fool's Gold");
  });

  it("is worth $1 again for the first Fool's Gold of an extra turn from Outpost", async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Outpost'] });
    game.alice.setHand(['Outpost', "Fool's Gold", "Fool's Gold", 'Copper', 'Copper']);
    game.alice.setDeck(["Fool's Gold", "Fool's Gold", 'Copper', ...COPPERS]);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Outpost');
    await game.playTreasure("Fool's Gold");
    expect(game.alice.coins).toBe(1);
    await game.playTreasure("Fool's Gold");
    expect(game.alice.coins).toBe(5);
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(["Fool's Gold", "Fool's Gold", 'Copper']);
    await game.playTreasure("Fool's Gold");
    expect(game.alice.coins).toBe(1);
    await game.playTreasure("Fool's Gold");
    expect(game.alice.coins).toBe(5);
  });

  it('can still be trashed when the Gold pile is empty, gaining nothing', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Gold', 'Gold', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(["Fool's Gold", 'Estate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', ...COPPERS]);
    game.setPileSize('Gold', 0);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Province');
    await game.chooseEffect("Fool's Gold");

    expect(game.trash).toEqual(["Fool's Gold"]);
    expect(game.bob.hand).toEqual(['Estate', 'Copper', 'Copper', 'Copper']);
    expect(game.bob.deck[0]).toBe('Silver');
    expect(game.pileSize('Gold')).toBe(0);
    expect(game.currentPlayerName).toBe('Bob');
  });
});
