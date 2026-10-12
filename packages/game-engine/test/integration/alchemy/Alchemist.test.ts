import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const copies = (name: string, count: number): string[] => Array<string>(count).fill(name);

describe('Alchemist', () => {
  it('can go onto an empty deck at the start of Clean-up with a Potion in play, and is drawn into the next hand', async () => {
    const game = createGame({ kingdom: ['Alchemist'] });
    game.alice.setHand(['Alchemist', 'Potion', 'Copper', 'Copper', 'Copper']);
    // Alchemist draws the whole deck, so the deck is empty at Clean-up
    game.alice.setDeck(['Estate', 'Estate']);
    game.alice.setDiscard(copies('Silver', 6));

    await game.start();
    await game.playAction('Alchemist');
    expect(game.alice.hand).toHaveLength(6);
    expect(game.alice.actions).toBe(1);
    await game.playAllTreasures();
    expect(game.alice.potions).toBe(1);
    await game.endTurn();

    const decision = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(decision.optionalEffects.map((effect) => effect.effectName)).toEqual(['Alchemist']);
    expect(decision.mandatoryEffects).toEqual([]);
    await game.chooseEffect('Alchemist');

    // Alchemist was the only card in the deck, so it is drawn first, then the discard pile is shuffled
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.hand).toContain('Alchemist');
    expect(game.alice.inPlay).toEqual([]);
    expect([...game.alice.hand, ...game.alice.deck, ...game.alice.discard].filter((n) => n === 'Alchemist')).toEqual([
      'Alchemist',
    ]);
  });

  it('is discarded when its owner declines to put it onto the deck', async () => {
    const game = createGame({ kingdom: ['Alchemist'] });
    game.alice.setHand(['Alchemist', 'Potion', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Estate', 10));

    await game.start();
    await game.playAction('Alchemist');
    await game.playAllTreasures();
    await game.endTurn();
    await game.declineEffects();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard).toContain('Alchemist');
    expect(game.alice.hand).toEqual(copies('Estate', 5));
  });

  it('is not offered when the Potion stayed in hand instead of being played', async () => {
    const game = createGame({ kingdom: ['Alchemist'] });
    game.alice.setHand(['Alchemist', 'Potion', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Estate', 10));

    await game.start();
    await game.playAction('Alchemist');
    await game.endTurn();

    // No Clean-up prompt: play passes straight to Bob
    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.discard).toContain('Alchemist');
    expect(game.alice.discard).toContain('Potion');
  });

  it('lets each of several Alchemists go onto the deck with a single Potion in play', async () => {
    const game = createGame({ kingdom: ['Alchemist'] });
    game.alice.setHand(['Alchemist', 'Alchemist', 'Potion', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Estate', 10));

    await game.start();
    await game.playAction('Alchemist');
    await game.playAction('Alchemist');
    expect(game.alice.actions).toBe(1);
    await game.playAllTreasures();
    await game.endTurn();

    await game.chooseEffect('Alchemist');
    // The second Alchemist is still offered after the first has gone onto the deck
    const decision = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(decision.optionalEffects.map((effect) => effect.effectName)).toEqual(['Alchemist']);
    await game.chooseEffect('Alchemist');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand).toEqual(['Alchemist', 'Alchemist', 'Estate', 'Estate', 'Estate']);
    expect(game.alice.discard).not.toContain('Alchemist');
  });

  it('goes onto the deck only once after being played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Alchemist', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Alchemist', 'Potion', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Estate', 12));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Alchemist');
    // +2 Cards and +1 Action, twice
    expect(game.alice.hand).toHaveLength(7);
    expect(game.alice.actions).toBe(2);
    await game.playAllTreasures();
    await game.endTurn();

    await game.chooseEffect('Alchemist');
    // Its second Clean-up ability is still offered, but it has left play since it was played, so it can't move again
    await game.chooseEffect('Alchemist');
    expect(game.alice.log).toContain('Alice has lost track of Alchemist');
    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.hand.filter((name) => name === 'Alchemist')).toEqual(['Alchemist']);
    expect(game.alice.discard).not.toContain('Alchemist');
    expect(game.alice.discard).toContain('Throne Room');
  });

  it('can go onto the deck only once with two Potions in play', async () => {
    const game = createGame({ kingdom: ['Alchemist'] });
    game.alice.setHand(['Alchemist', 'Potion', 'Potion', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Estate', 10));

    await game.start();
    await game.playAction('Alchemist');
    await game.playAllTreasures();
    expect(game.alice.potions).toBe(2);
    await game.endTurn();

    const decision = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(decision.optionalEffects.map((effect) => effect.effectName)).toEqual(['Alchemist']);
    await game.chooseEffect('Alchemist');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand).toEqual(['Alchemist', 'Estate', 'Estate', 'Estate', 'Estate']);
    expect(game.alice.discard.filter((name) => name === 'Potion')).toHaveLength(2);
  });

  it('puts two Alchemists onto an empty deck; both are drawn before the discard pile is shuffled', async () => {
    const game = createGame({ kingdom: ['Alchemist'] });
    game.alice.setHand(['Alchemist', 'Alchemist', 'Potion', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDiscard(copies('Silver', 6));

    await game.start();
    await game.playAction('Alchemist');
    await game.playAction('Alchemist');
    // The two Alchemists drew the whole deck
    expect(game.alice.deck).toEqual([]);
    await game.playAllTreasures();
    await game.endTurn();
    await game.chooseEffect('Alchemist');
    await game.chooseEffect('Alchemist');

    // The new hand: both Alchemists, then 3 of the 13 cards in the shuffled discard pile (6 Silvers + this turn's 7)
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.hand.slice(0, 2)).toEqual(['Alchemist', 'Alchemist']);
    expect(game.alice.hand.slice(2)).not.toContain('Alchemist');
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.deck).toHaveLength(10);
  });

  it('goes onto the deck at the start of Clean-up, before Herbalist puts the Potion on top of it', async () => {
    const game = createGame({ kingdom: ['Alchemist', 'Herbalist'] });
    game.alice.setHand(['Alchemist', 'Herbalist', 'Potion', 'Copper', 'Estate']);
    game.alice.setDeck(copies('Estate', 10));

    await game.start();
    await game.playAction('Alchemist');
    await game.playAction('Herbalist');
    await game.playAllTreasures();
    await game.endTurn();

    await game.chooseEffect('Alchemist');
    await game.chooseEffect('Herbalist');
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Copper', 'Potion']);
    await game.chooseCard('Potion');

    // The Potion went on top of the Alchemist, so both are drawn
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand).toEqual(['Potion', 'Alchemist', 'Estate', 'Estate', 'Estate']);
  });

  it("isn't offered when the Potion it needs was trashed by Counterfeit after being played twice", async () => {
    const game = createGame({ kingdom: ['Alchemist', 'Counterfeit', 'Golem'] });
    game.alice.setHand(['Alchemist', 'Counterfeit', 'Potion', 'Copper', 'Estate']);
    game.alice.setDeck(copies('Estate', 10));

    await game.start();
    await game.playAction('Alchemist');
    await game.playTreasure('Counterfeit');
    await game.chooseCard('Potion');

    // Played twice for 2 Potions, then trashed: no Potion is left in play
    expect(game.alice.potions).toBe(2);
    expect(game.trash).toEqual(['Potion']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.discard).toContain('Alchemist');
  });

  it('can go onto the deck when it was played by Golem', async () => {
    const game = createGame({ kingdom: ['Alchemist', 'Golem'] });
    game.alice.setHand(['Golem', 'Potion', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Alchemist', 'Copper', 'Copper', ...copies('Estate', 10)]);

    await game.start();
    await game.playAction('Golem');
    expect(game.alice.inPlay).toEqual(['Golem', 'Alchemist']);
    await game.playAllTreasures();
    await game.endTurn();
    await game.chooseEffect('Alchemist');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand[0]).toBe('Alchemist');
    expect(game.alice.discard).toContain('Golem');
  });

  it('played twice by Coronet in the Buy phase, draws 4 cards and can still go onto the deck once', async () => {
    const game = createGame({ kingdom: ['Alchemist'] });
    game.alice.setHand(['Potion', 'Coronet', 'Alchemist', 'Estate', 'Estate']);
    game.alice.setDeck(['Gold', 'Gold', 'Estate', 'Estate', ...copies('Estate', 10)]);

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Potion');
    await game.playTreasure('Coronet');
    await game.chooseCard('Alchemist');
    // Alchemist twice: +4 Cards; Coronet then offers to play a Treasure twice: one of the drawn Golds
    await game.chooseCard('Gold');
    expect(game.alice.coins).toBe(6);
    expect(game.alice.inPlay).toEqual(['Potion', 'Coronet', 'Alchemist', 'Gold']);
    await game.endTurn();

    await game.chooseEffect('Alchemist');
    // The second ability is still offered, but has lost track of it
    await game.chooseEffect('Alchemist');
    expect(game.alice.log).toContain('Alice has lost track of Alchemist');
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand[0]).toBe('Alchemist');
    expect(game.alice.discard).not.toContain('Alchemist');
  });

  it('draws the only card there is, and still gives +1 Action', async () => {
    const game = createGame({ kingdom: ['Alchemist', 'Village'] });
    game.alice.setHand(['Alchemist', 'Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver']);

    await game.start();
    await game.playAction('Alchemist');

    expect(game.alice.hand).toEqual(['Village', 'Copper', 'Copper', 'Copper', 'Silver']);
    expect(game.alice.actions).toBe(1);
    game.expectDecision('actionPhase', 'Alice');
  });

  it('shuffles the discard pile partway through its draw', async () => {
    const game = createGame({ kingdom: ['Alchemist'] });
    game.alice.setHand(['Alchemist', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver']);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Alchemist');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver', 'Gold']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
  });

  it("isn't offered with only a Philosopher's Stone in play: it needs a Potion, not a card costing one", async () => {
    const game = createGame({ kingdom: ['Alchemist', "Philosopher's Stone"] });
    game.alice.setHand(['Alchemist', "Philosopher's Stone", 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Estate', 10));

    await game.start();
    await game.playAction('Alchemist');
    await game.playTreasure("Philosopher's Stone");
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.discard).toContain('Alchemist');
  });

  it('has lost track of itself after Procession played it twice and trashed it, even with a Potion in play', async () => {
    const game = createGame({ kingdom: ['Alchemist', 'Procession', 'Golem'] });
    game.alice.setHand(['Procession', 'Alchemist', 'Potion', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Estate', 10));

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Alchemist');
    // +2 Cards and +1 Action twice, then Alchemist ($3P) is trashed and a $4P Action is gained
    expect(game.alice.hand).toHaveLength(7);
    expect(game.alice.actions).toBe(2);
    expect(game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name)).toEqual(['Golem']);
    await game.chooseCard('Golem');
    expect(game.trash).toEqual(['Alchemist']);
    await game.playAllTreasures();
    expect(game.alice.potions).toBe(1);
    await game.endTurn();

    // Both of its Clean-up abilities are still offered, but neither can move it out of the trash
    await game.chooseEffect('Alchemist');
    await game.chooseEffect('Alchemist');
    expect(game.alice.log.filter((line) => line === 'Alice has lost track of Alchemist')).toHaveLength(2);
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pending.playerName).toBe('Bob');
    expect(game.trash).toEqual(['Alchemist']);
  });

  it('goes onto the deck before an Outpost turn and is drawn into its 3-card hand; its ability is gone on that turn', async () => {
    const game = createGame({ kingdom: ['Alchemist', 'Outpost'] });
    game.alice.setHand(['Alchemist', 'Outpost', 'Potion', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Estate', ...copies('Silver', 10)]);
    game.bob.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Alchemist');
    await game.playAction('Outpost');
    await game.playAllTreasures();
    await game.endTurn();
    await game.chooseEffect('Alchemist');
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(['Alchemist', 'Silver', 'Silver']);
    // Played again on the Outpost turn, without a Potion in play: nothing is offered in Clean-up
    await game.playAction('Alchemist');
    await game.playAllTreasures();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.discard).toContain('Alchemist');
  });

  it("is offered alongside Scheme at the start of Clean-up; once it is on the deck, Scheme can't choose it", async () => {
    const game = createGame({ kingdom: ['Alchemist', 'Scheme'] });
    game.alice.setHand(['Scheme', 'Alchemist', 'Potion', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Estate', 10));

    await game.start();
    await game.playAction('Scheme');
    await game.playAction('Alchemist');
    await game.playAllTreasures();
    await game.endTurn();

    const decision = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(decision.optionalEffects.map((effect) => effect.effectName).sort()).toEqual(['Alchemist', 'Scheme']);
    await game.chooseEffect('Alchemist');
    await game.chooseEffect('Scheme');
    expect(game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name)).toEqual([
      'Scheme',
    ]);
    await game.chooseCard('Scheme');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand).toEqual(['Scheme', 'Alchemist', 'Estate', 'Estate', 'Estate']);
  });
});
