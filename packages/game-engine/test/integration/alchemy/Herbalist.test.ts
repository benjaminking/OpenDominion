import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const copies = (name: string, count: number): string[] => Array<string>(count).fill(name);

describe('Herbalist', () => {
  it('puts a Treasure from play onto the deck in Clean-up, so it is drawn into the next hand', async () => {
    const game = createGame({ kingdom: ['Herbalist'] });
    game.alice.setHand(['Herbalist', 'Gold', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(copies('Estate', 10));

    await game.start();
    await game.playAction('Herbalist');
    expect(game.alice.buys).toBe(2);
    expect(game.alice.coins).toBe(1);
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(6);
    await game.endTurn();

    await game.chooseEffect('Herbalist');
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.noneAllowed).toBe(true);
    expect(decision.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Copper', 'Copper', 'Gold']);
    await game.chooseCard('Gold');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand).toEqual(['Gold', 'Estate', 'Estate', 'Estate', 'Estate']);
    expect(game.alice.discard).not.toContain('Gold');
  });

  it('lets each Herbalist in play put another Treasure onto the deck', async () => {
    const game = createGame({ kingdom: ['Herbalist', 'Village'] });
    game.alice.setHand(['Village', 'Herbalist', 'Herbalist', 'Gold', 'Silver']);
    game.alice.setDeck(['Estate', ...copies('Estate', 10)]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Herbalist');
    await game.playAction('Herbalist');
    await game.playAllTreasures();
    await game.endTurn();

    await game.chooseEffect('Herbalist');
    await game.chooseCard('Gold');
    await game.chooseEffect('Herbalist');
    await game.chooseCard('Silver');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand).toEqual(['Silver', 'Gold', 'Estate', 'Estate', 'Estate']);
  });

  it('puts up to two Treasures onto the deck when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Herbalist', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Herbalist', 'Gold', 'Silver', 'Copper']);
    game.alice.setDeck(copies('Estate', 10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Herbalist');
    expect(game.alice.buys).toBe(3);
    expect(game.alice.coins).toBe(2);
    await game.playAllTreasures();
    await game.endTurn();

    await game.chooseEffect('Herbalist');
    await game.chooseCard('Gold');
    await game.chooseEffect('Herbalist');
    await game.chooseCard('Silver');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand).toEqual(['Silver', 'Gold', 'Estate', 'Estate', 'Estate']);
    expect(game.alice.discard).toContain('Copper');
  });

  it("can't put a Treasure that isn't being discarded from play (a Duration Treasure staying out) onto the deck", async () => {
    const game = createGame({ kingdom: ['Herbalist', 'Astrolabe'] });
    game.alice.setHand(['Herbalist', 'Astrolabe', 'Gold', 'Copper', 'Estate']);
    game.alice.setDeck(copies('Estate', 10));

    await game.start();
    await game.playAction('Herbalist');
    await game.playTreasure('Astrolabe');
    await game.playAllTreasures();
    await game.endTurn();

    await game.chooseEffect('Herbalist');
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Copper', 'Gold']);
  });

  it('is offered with Alchemist at the start of Clean-up, so Alchemist can go before Herbalist takes the Potion', async () => {
    const game = createGame({ kingdom: ['Herbalist', 'Alchemist'] });
    game.alice.setHand(['Alchemist', 'Herbalist', 'Potion', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Estate', 10));

    await game.start();
    await game.playAction('Alchemist');
    await game.playAction('Herbalist');
    await game.playAllTreasures();
    await game.endTurn();

    const decision = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(decision.optionalEffects.map((effect) => effect.effectName).sort()).toEqual(['Alchemist', 'Herbalist']);
    // Alchemist first, while the Potion is still in play
    await game.chooseEffect('Alchemist');
    await game.chooseEffect('Herbalist');
    await game.chooseCard('Potion');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand).toEqual(['Potion', 'Alchemist', 'Estate', 'Estate', 'Estate']);
  });

  it('can put a Coronet played in the Action phase onto the deck, since it is also a Treasure', async () => {
    const game = createGame({ kingdom: ['Herbalist'] });
    game.alice.setHand(['Coronet', 'Herbalist', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(copies('Estate', 10));

    await game.start();
    await game.playAction('Coronet');
    await game.chooseCard('Herbalist');
    await game.chooseCard('Copper');
    // Herbalist twice (+2 Buys, +$2), Copper twice (+$2)
    expect(game.alice.buys).toBe(3);
    expect(game.alice.coins).toBe(4);
    await game.endTurn();

    // Two Herbalist plays: one Treasure each
    await game.chooseEffect('Herbalist');
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Copper', 'Coronet']);
    await game.chooseCard('Coronet');
    await game.chooseEffect('Herbalist');
    await game.chooseCard('Copper');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand).toEqual(['Copper', 'Coronet', 'Estate', 'Estate', 'Estate']);
  });

  it('can put Tiara onto the deck, as well as the Treasure Tiara played twice', async () => {
    const game = createGame({ kingdom: ['Herbalist', 'Tiara'] });
    game.alice.setHand(['Herbalist', 'Tiara', 'Gold', 'Estate', 'Estate']);
    game.alice.setDeck(copies('Estate', 10));

    await game.start();
    await game.playAction('Herbalist');
    await game.playTreasure('Tiara');
    await game.chooseCard('Gold');
    expect(game.alice.coins).toBe(7);
    await game.endTurn();

    await game.chooseEffect('Herbalist');
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Gold', 'Tiara']);
    await game.chooseCard('Tiara');

    expect(game.alice.hand).toEqual(['Tiara', 'Estate', 'Estate', 'Estate', 'Estate']);
    expect(game.alice.discard).toContain('Gold');
  });

  it('can put a Duration Treasure onto the deck on the later turn it is discarded from play', async () => {
    const game = createGame({ kingdom: ['Herbalist', 'Astrolabe'] });
    game.alice.setHand(['Astrolabe', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Herbalist', 'Copper', 'Estate', 'Estate', 'Estate', ...copies('Estate', 10)]);
    game.bob.setDeck(copies('Copper', 10));

    await game.start();
    await game.playTreasure('Astrolabe');
    await game.endTurn();
    await game.endTurn();

    // Alice's next turn: Astrolabe gives its $1 and +1 Buy, then is discarded in this turn's Clean-up
    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Herbalist');
    await game.playAllTreasures();
    await game.endTurn();

    await game.chooseEffect('Herbalist');
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Astrolabe', 'Copper']);
    await game.chooseCard('Astrolabe');

    expect(game.alice.hand[0]).toBe('Astrolabe');
    expect(game.alice.inPlay).toEqual([]);
  });

  it("can't put a Treasure that Counterfeit trashed onto the deck, but can put Counterfeit itself", async () => {
    const game = createGame({ kingdom: ['Herbalist', 'Counterfeit'] });
    game.alice.setHand(['Herbalist', 'Counterfeit', 'Silver', 'Estate', 'Estate']);
    game.alice.setDeck(copies('Estate', 10));

    await game.start();
    await game.playAction('Herbalist');
    await game.playTreasure('Counterfeit');
    await game.chooseCard('Silver');
    expect(game.trash).toEqual(['Silver']);
    await game.endTurn();

    await game.chooseEffect('Herbalist');
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.cardChoices.map((choice) => choice.card.name)).toEqual(['Counterfeit']);
    await game.chooseCard('Counterfeit');

    expect(game.alice.hand).toEqual(['Counterfeit', 'Estate', 'Estate', 'Estate', 'Estate']);
  });

  it('asks nothing in Clean-up when no Treasure was played', async () => {
    const game = createGame({ kingdom: ['Herbalist'] });
    game.alice.setHand(['Herbalist', 'Copper', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(copies('Estate', 10));

    await game.start();
    await game.playAction('Herbalist');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.discard.sort()).toEqual(['Copper', 'Estate', 'Estate', 'Estate', 'Herbalist']);
  });

  it("can't put a Spoils onto the deck, since it returned to its pile when played", async () => {
    const game = createGame({ kingdom: ['Herbalist', 'Bandit Camp'] });
    game.alice.setHand(['Herbalist', 'Spoils', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(copies('Estate', 10));

    await game.start();
    await game.playAction('Herbalist');
    await game.playTreasure('Spoils');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(5);
    expect(game.alice.inPlay).toEqual(['Herbalist', 'Copper']);
    await game.endTurn();

    await game.chooseEffect('Herbalist');
    expect(game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name)).toEqual([
      'Copper',
    ]);
  });

  it("doesn't carry over to a later turn when it had nothing to put onto the deck this turn", async () => {
    const game = createGame({ kingdom: ['Herbalist'] });
    game.alice.setHand(['Herbalist', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Gold', 'Gold', 'Copper', 'Copper', 'Copper', ...copies('Estate', 10)]);
    game.bob.setHand(copies('Copper', 5));
    game.bob.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Herbalist');
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAllTreasures();
    await game.endTurn();

    // No Herbalist prompt in this Clean-up: play passes to Bob
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Gold', 'Gold', 'Copper', 'Copper', 'Copper']));
  });

  it("can put a Treasure-Victory (Farm) or Treasure-Reaction (Fool's Gold) onto the deck, but not an Action or Victory card", async () => {
    const game = createGame({ kingdom: ['Herbalist', 'Farm', "Fool's Gold", 'Village'] });
    game.alice.setHand(['Village', 'Herbalist', 'Farm', "Fool's Gold", 'Estate']);
    game.alice.setDeck(['Duchy', ...copies('Estate', 10)]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Herbalist');
    await game.playTreasure('Farm');
    await game.playTreasure("Fool's Gold");
    expect(game.alice.coins).toBe(4);
    await game.endTurn();

    await game.chooseEffect('Herbalist');
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Farm', "Fool's Gold"]);
    await game.chooseCard('Farm');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand).toEqual(['Farm', 'Estate', 'Estate', 'Estate', 'Estate']);
  });

  it("doesn't carry over into an Outpost extra turn when no Treasure was discarded on the turn it was played", async () => {
    const game = createGame({ kingdom: ['Herbalist', 'Outpost', 'Village'] });
    game.alice.setHand(['Village', 'Herbalist', 'Outpost', 'Estate', 'Estate']);
    game.alice.setDeck(['Estate', 'Gold', 'Silver', 'Copper', ...copies('Estate', 10)]);
    game.bob.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Herbalist');
    await game.playAction('Outpost');
    await game.endTurn();
    // Nothing to put back in this Clean-up
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(['Gold', 'Silver', 'Copper']);
    await game.playAllTreasures();
    await game.endTurn();

    // No Herbalist prompt on the Outpost turn: play passes to Bob
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Gold', 'Silver', 'Copper']));
  });

  it("can't put a Coronet onto the deck after Scheme has already put it there as an Action at the start of Clean-up", async () => {
    const game = createGame({ kingdom: ['Herbalist', 'Scheme'] });
    game.alice.setHand(['Scheme', 'Herbalist', 'Coronet', 'Copper', 'Estate']);
    game.alice.setDeck(copies('Estate', 10));

    await game.start();
    await game.playAction('Scheme');
    await game.playAction('Herbalist');
    // Coronet as a Treasure: no Action to play twice, so it plays the Copper twice
    await game.playTreasure('Coronet');
    await game.chooseCard('Copper');
    expect(game.alice.coins).toBe(3);
    await game.endTurn();

    // Scheme acts at the start of Clean-up, before anything is discarded
    await game.chooseEffect('Scheme');
    expect(
      game
        .expectDecision('chooseCard', 'Alice')
        .cardChoices.map((choice) => choice.card.name)
        .sort(),
    ).toEqual(['Coronet', 'Herbalist', 'Scheme']);
    await game.chooseCard('Coronet');
    // Herbalist, when the rest is discarded: only the Copper is left
    await game.chooseEffect('Herbalist');
    expect(game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name)).toEqual([
      'Copper',
    ]);
    await game.chooseCard('Copper');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand).toEqual(['Copper', 'Coronet', 'Estate', 'Estate', 'Estate']);
  });
});
