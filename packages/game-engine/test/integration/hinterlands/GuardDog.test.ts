import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const KINGDOM = ['Guard Dog', 'Militia', 'Margrave', 'Village'];
const COPPERS = Array<string>(10).fill('Copper');

describe('GuardDog', () => {
  it('is played before the Attack resolves, then the Attack still happens', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Guard Dog', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Gold', 'Duchy', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Militia');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Guard Dog']);
    expect(game.alice.coins).toBe(0);
    await game.chooseEffect('Guard Dog');

    // 4 cards left in hand + 2 = 6, so no extra draw; then Militia makes Bob discard down to 3
    game.expectDecision('chooseCards', 'Bob');
    expect(game.bob.hand).toEqual(['Estate', 'Estate', 'Copper', 'Copper', 'Silver', 'Gold']);
    expect(game.bob.inPlay).toEqual(['Guard Dog']);
    await game.chooseCards(['Estate', 'Estate', 'Copper']);

    expect(game.bob.hand).toEqual(['Copper', 'Silver', 'Gold']);
    expect(game.bob.deck).toEqual(['Duchy', 'Copper', 'Copper', 'Copper']);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(0);
    game.expectDecision('treasurePhase', 'Alice');
  });

  it('draws 2 more cards when it has exactly 5 cards in hand after the first draw', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Guard Dog', 'Estate', 'Estate', 'Copper']);
    game.bob.setDeck(['Silver', 'Gold', 'Duchy', 'Province', 'Copper']);

    await game.start();
    await game.playAction('Militia');
    await game.chooseEffect('Guard Dog');

    game.expectDecision('chooseCards', 'Bob');
    expect(game.bob.hand).toEqual(['Estate', 'Estate', 'Copper', 'Silver', 'Gold', 'Duchy', 'Province']);
    expect(game.pending.numSelectedEligibility).toEqual([4]);
    await game.chooseCards(['Estate', 'Estate', 'Duchy', 'Province']);

    expect(game.bob.hand).toEqual(['Copper', 'Silver', 'Gold']);
    expect(game.bob.deck).toEqual(['Copper']);
  });

  it('can be declined, and the Attack resolves normally', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Guard Dog', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Militia');
    await game.declineEffects();
    await game.chooseCards(['Estate', 'Estate']);

    expect(game.bob.hand).toEqual(['Guard Dog', 'Copper', 'Copper']);
    expect(game.bob.inPlay).toEqual([]);
    expect(game.bob.deck).toHaveLength(10);
  });

  it('lets a Guard Dog drawn while reacting also be played against the same Attack', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Guard Dog', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(['Guard Dog', 'Copper', 'Silver', 'Silver', 'Gold', 'Gold']);

    await game.start();
    await game.playAction('Militia');
    await game.chooseEffect('Guard Dog');

    // The newly drawn Guard Dog can react to the same Attack
    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Guard Dog']);
    await game.chooseEffect('Guard Dog');

    game.expectDecision('chooseCards', 'Bob');
    expect(game.bob.inPlay).toEqual(['Guard Dog', 'Guard Dog']);
    expect(game.bob.hand).toEqual(['Estate', 'Estate', 'Estate', 'Estate', 'Copper', 'Silver', 'Silver']);
    await game.chooseCards(['Estate', 'Estate', 'Estate', 'Estate']);

    expect(game.bob.hand).toEqual(['Copper', 'Silver', 'Silver']);
    expect(game.bob.deck).toEqual(['Gold', 'Gold']);
  });

  it('lets each other player react in turn order, with 3 players', async () => {
    const game = createGame({ kingdom: KINGDOM, players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Margrave', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Guard Dog', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Silver', 'Gold', 'Copper', 'Copper']);
    const cara = game.player('Cara');
    cara.setHand(['Guard Dog', 'Estate', 'Copper']);
    cara.setDeck(['Gold', 'Gold', 'Silver', 'Silver', 'Duchy', 'Copper']);

    await game.start();
    await game.playAction('Margrave');

    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Guard Dog');
    game.expectDecision('chooseFromMultipleEvents', 'Cara');
    await game.chooseEffect('Guard Dog');

    // Then Margrave resolves: Bob draws 1 (7 cards) and discards 4
    game.expectDecision('chooseCards', 'Bob');
    expect(game.bob.hand).toEqual(['Estate', 'Estate', 'Copper', 'Copper', 'Silver', 'Silver', 'Gold']);
    await game.chooseCards(['Estate', 'Estate', 'Copper', 'Copper']);

    // Cara: 2 cards + 2 + 2 (she had 4, so drew 2 more) + 1 from Margrave = 7, discards 4
    game.expectDecision('chooseCards', 'Cara');
    expect(cara.hand).toEqual(['Estate', 'Copper', 'Gold', 'Gold', 'Silver', 'Silver', 'Duchy']);
    await game.chooseCards(['Estate', 'Copper', 'Silver', 'Duchy']);

    expect(game.bob.hand).toEqual(['Silver', 'Silver', 'Gold']);
    expect(cara.hand).toEqual(['Gold', 'Gold', 'Silver']);
    expect(cara.inPlay).toEqual(['Guard Dog']);
  });

  it("is discarded in the Clean-up of the other player's turn it was played on", async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Guard Dog', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Militia');
    await game.chooseEffect('Guard Dog');
    await game.chooseCards(['Estate', 'Estate', 'Copper']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.bob.inPlay).toEqual([]);
    expect(game.bob.discard).toContain('Guard Dog');
  });

  it('can react separately to each play of an Attack played twice by Throne Room', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Militia', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Guard Dog', 'Guard Dog', 'Estate', 'Estate', 'Copper']);
    game.bob.setDeck(['Silver', 'Silver', 'Gold', 'Gold', 'Duchy', 'Duchy', ...COPPERS]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Militia');

    // 1st play: one Guard Dog reacts (6 cards after drawing, so no more draws); the other is kept for later
    const first = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(first.optionalEffects.map((effect) => effect.effectName)).toEqual(['Guard Dog', 'Guard Dog']);
    await game.chooseEffect('Guard Dog');
    await game.declineEffects();
    await game.chooseCards(['Estate', 'Estate', 'Copper']);
    expect(game.bob.hand).toEqual(['Guard Dog', 'Silver', 'Silver']);

    // 2nd play: the other Guard Dog reacts, drawing 2 and then 2 more
    const second = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(second.optionalEffects.map((effect) => effect.effectName)).toEqual(['Guard Dog']);
    await game.chooseEffect('Guard Dog');
    expect(game.bob.hand).toEqual(['Silver', 'Silver', 'Gold', 'Gold', 'Duchy', 'Duchy']);
    await game.chooseCards(['Duchy', 'Duchy', 'Silver']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.inPlay).toEqual(['Guard Dog', 'Guard Dog']);
    expect(game.bob.hand).toEqual(['Silver', 'Gold', 'Gold']);
    expect(game.alice.coins).toBe(4);
  });

  it('can react to an Attack that Band of Misfits plays from the Supply', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Band Of Misfits'] });
    game.alice.setHand(['Band Of Misfits', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Guard Dog', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Gold', ...COPPERS]);
    const militias = game.pileSize('Militia');

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Militia');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Guard Dog']);
    await game.chooseEffect('Guard Dog');
    await game.chooseCards(['Estate', 'Estate', 'Copper']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.inPlay).toEqual(['Guard Dog']);
    expect(game.bob.hand).toEqual(['Copper', 'Silver', 'Gold']);
    expect(game.alice.coins).toBe(2);
    expect(game.pileSize('Militia')).toBe(militias);
  });

  it('shuffles the discard pile when its draw runs out of deck', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Guard Dog', 'Estate', 'Estate', 'Copper']);
    game.bob.setDeck(['Silver']);
    game.bob.setDiscard(['Gold', 'Gold', 'Gold']);

    await game.start();
    await game.playAction('Militia');
    await game.chooseEffect('Guard Dog');

    // Silver, then a shuffle for the other Gold; with 5 cards in hand, 2 more
    game.expectDecision('chooseCards', 'Bob');
    expect(game.bob.hand).toEqual(['Estate', 'Estate', 'Copper', 'Silver', 'Gold', 'Gold', 'Gold']);
    expect(game.bob.deck).toEqual([]);
    expect(game.bob.discard).toEqual([]);
    await game.chooseCards(['Estate', 'Estate', 'Copper', 'Silver']);

    expect(game.bob.hand).toEqual(['Gold', 'Gold', 'Gold']);
  });

  it('can draw a Moat that then blocks the same Attack', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Moat'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Guard Dog', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(['Moat', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Militia');
    await game.chooseEffect('Guard Dog');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Moat']);
    await game.chooseEffect('Moat');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.declineEffects();
    }

    // Bob doesn't have to discard
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.hand).toEqual(['Estate', 'Estate', 'Estate', 'Estate', 'Moat', 'Copper']);
    expect(game.bob.discard).toEqual([]);
    expect(game.alice.coins).toBe(2);
  });

  it('can grow the hand to 5 cards so that Diplomat can react to the same Attack', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Diplomat'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Guard Dog', 'Diplomat', 'Estate', 'Estate']);
    game.bob.setDeck(['Copper', 'Copper', 'Silver', 'Silver', 'Gold', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Militia');

    // With 4 cards in hand, Diplomat can't react yet
    const first = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(first.optionalEffects.map((effect) => effect.effectName)).toEqual(['Guard Dog']);
    await game.chooseEffect('Guard Dog');

    // 3 cards + 2 + 2 = 7: now Diplomat can react
    const second = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(second.optionalEffects.map((effect) => effect.effectName)).toEqual(['Diplomat']);
    await game.chooseEffect('Diplomat');
    expect(game.bob.hand).toEqual([
      'Diplomat',
      'Estate',
      'Estate',
      'Copper',
      'Copper',
      'Silver',
      'Silver',
      'Gold',
      'Gold',
    ]);
    await game.chooseCards(['Estate', 'Estate', 'Copper']);
    // With 6 cards left, Diplomat could be revealed again
    await game.chooseOption('No');

    // Then Militia: down to 3
    await game.chooseCards(['Diplomat', 'Copper', 'Silver']);
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.hand).toEqual(['Silver', 'Gold', 'Gold']);
    expect(game.bob.inPlay).toEqual(['Guard Dog']);
  });

  it("can be played on its owner's own turn, without using an Action, against another player's Berserker", async () => {
    const game = createGame({ kingdom: ['Guard Dog', 'Berserker', 'Weaver', 'Highway', 'Militia'] });
    game.alice.setHand(['Highway', 'Militia', 'Guard Dog', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(['Silver', 'Gold', 'Gold', ...COPPERS]);
    game.bob.setHand(['Weaver', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Militia');
    await game.chooseCards(['Weaver', 'Estate']);
    // Bob plays the discarded Weaver and gains a Berserker (it costs $4 with Alice's Highway), which he then plays
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain a card costing up to $4');
    await game.chooseCard('Berserker');

    // Alice may play Guard Dog before Bob's Berserker resolves
    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Guard Dog']);
    await game.chooseEffect('Guard Dog');
    // 4 cards + 2 = 6: no more draws
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Estate', 'Silver', 'Gold', 'Gold']);

    // Berserker: Bob gains a card costing less than $4, then Alice discards down to 3
    await game.chooseCard('Silver');
    game.expectDecision('chooseCards', 'Alice');
    await game.chooseCards(['Copper', 'Copper', 'Estate']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Silver', 'Gold', 'Gold']);
    expect(game.alice.inPlay).toEqual(['Highway', 'Militia', 'Guard Dog']);
    expect(game.alice.actions).toBe(0);
    expect(game.bob.inPlay).toEqual(['Weaver', 'Berserker']);
  });

  it('draws only what is left when the deck and discard pile run out', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Guard Dog', 'Estate', 'Estate', 'Copper']);
    game.bob.setDeck(['Silver']);

    await game.start();
    await game.playAction('Militia');
    await game.chooseEffect('Guard Dog');

    // Only the Silver: 4 cards in hand, and nothing more to draw; Militia still makes Bob discard 1
    const discard = game.expectDecision('chooseCards', 'Bob');
    expect(discard.numSelectedEligibility).toEqual([1]);
    expect(game.bob.hand).toEqual(['Estate', 'Estate', 'Copper', 'Silver']);
    await game.chooseCards(['Estate']);

    expect(game.bob.hand).toEqual(['Estate', 'Copper', 'Silver']);
    expect(game.bob.deck).toEqual([]);
    expect(game.bob.inPlay).toEqual(['Guard Dog']);
  });

  it('checks the hand size again on each play when Throne Room plays it twice', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Guard Dog', 'Copper']);
    game.alice.setDeck(['Silver', 'Silver', 'Gold', 'Gold', 'Estate', 'Estate', ...COPPERS]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Guard Dog');

    // 1st play: 1 + 2 = 3 cards, so 2 more (5); 2nd play: 5 + 2 = 7, so no more
    expect(game.alice.hand).toEqual(['Copper', 'Silver', 'Silver', 'Gold', 'Gold', 'Estate', 'Estate']);
    expect(game.alice.deck).toEqual(COPPERS);
  });
});
