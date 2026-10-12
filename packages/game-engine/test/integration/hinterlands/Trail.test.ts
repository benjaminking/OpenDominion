import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const KINGDOM = ['Trail', 'Workshop', 'Village', 'Develop', 'Militia', 'Laboratory'];
const COPPERS = Array<string>(10).fill('Copper');

describe('Trail', () => {
  it('may be played when gained, and its +1 Action can be used for another Action', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Workshop', 'Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Workshop');
    await game.chooseCard('Trail');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Trail']);
    await game.chooseEffect('Trail');

    expect(game.alice.inPlay).toEqual(['Workshop', 'Trail']);
    expect(game.alice.hand).toEqual(['Village', 'Copper', 'Copper', 'Copper', 'Silver']);
    expect(game.alice.actions).toBe(1);
    await game.playAction('Village');
    expect(game.alice.actions).toBe(2);

    // It is discarded from play in Clean-up
    await game.endTurn();
    expect(game.alice.discard).toContain('Trail');
    expect(game.alice.inPlay).toEqual([]);
  });

  it('may be played when trashed, and still counts as trashed for the card that trashed it', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Develop', 'Trail', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', ...COPPERS]);

    await game.start();
    await game.playAction('Develop');
    await game.chooseCard('Trail');
    await game.chooseEffect('Trail');

    expect(game.trash).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Develop', 'Trail']);
    expect(game.alice.hand).toContain('Silver');

    // Develop still gains a $5 and a $3 card for the $4 Trail
    await game.chooseCard('Laboratory');
    await game.chooseCard('Silver');
    expect(game.alice.deck.slice(0, 2)).toEqual(['Silver', 'Laboratory']);
  });

  it('may be played when discarded to an Attack, without having to discard again', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Trail', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(['Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Militia');
    await game.chooseCards(['Trail', 'Estate']);

    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Trail');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.inPlay).toEqual(['Trail']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver', 'Gold']);
    expect(game.bob.discard).toEqual(['Estate']);
  });

  it("is discarded in the Clean-up of the other player's turn it was played on", async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Trail', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Militia');
    await game.chooseCards(['Trail', 'Estate']);
    await game.chooseEffect('Trail');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.bob.inPlay).toEqual([]);
    expect(game.bob.discard).toContain('Trail');
  });

  it('reacts with each of several Trails discarded at once, one at a time', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Trail', 'Trail', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(['Gold', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Militia');
    await game.chooseCards(['Trail', 'Trail']);
    await game.chooseEffect('Trail');

    const second = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(second.optionalEffects.map((effect) => effect.effectName)).toEqual(['Trail']);
    await game.chooseEffect('Trail');

    expect(game.bob.inPlay).toEqual(['Trail', 'Trail']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver', 'Gold', 'Gold']);
  });

  it('is not offered when discarded in Clean-up', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Trail', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard).toContain('Trail');
    expect(game.alice.inPlay).toEqual([]);
  });

  it('may be played when discarded by your own Cellar, which still draws a card for it', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Cellar', 'Trail', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', 'Duchy', ...COPPERS]);

    await game.start();
    await game.playAction('Cellar');
    await game.chooseCards(['Trail', 'Estate']);
    await game.chooseEffect('Trail');

    // Trail draws the Silver, then Cellar draws 2 for the 2 discarded cards
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.inPlay).toEqual(['Cellar', 'Trail']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Silver', 'Gold', 'Duchy']);
    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.alice.actions).toBe(2);
  });

  it("may be played when discarded to Margrave, and the hand doesn't have to go back down to 3", async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Margrave'] });
    game.alice.setHand(['Margrave', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Trail', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(['Gold', 'Duchy', ...COPPERS]);

    await game.start();
    await game.playAction('Margrave');
    // Bob draws the Gold, then discards down to 3
    await game.chooseCards(['Trail', 'Estate', 'Copper']);
    await game.chooseEffect('Trail');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.inPlay).toEqual(['Trail']);
    expect(game.bob.hand).toEqual(['Copper', 'Silver', 'Gold', 'Duchy']);
  });

  it('draws a card discarded along with it when its +1 Card needs a shuffle', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Trail', 'Estate', 'Copper', 'Copper', 'Silver']);

    await game.start();
    await game.playAction('Militia');
    await game.chooseCards(['Trail', 'Estate']);
    await game.chooseEffect('Trail');

    // Both cards were discarded before Trail was played, so the Estate is shuffled into the empty deck and drawn
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.inPlay).toEqual(['Trail']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver', 'Estate']);
    expect(game.bob.discard).toEqual([]);
  });

  it("loses track of a second discarded Trail that the first one's +1 Card shuffled into the deck", async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Trail', 'Trail', 'Copper', 'Copper', 'Silver']);

    await game.start();
    await game.playAction('Militia');
    await game.chooseCards(['Trail', 'Trail']);
    await game.chooseEffect('Trail');

    // The other Trail was in the discard pile, so it was shuffled into the deck and drawn: it is still offered, but
    // has lost track of itself
    const secondTrail = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(secondTrail.optionalEffects.map((effect) => effect.effectName)).toEqual(['Trail']);
    await game.chooseEffect('Trail');

    expect(game.bob.log).toContain('Bob has lost track of Trail');
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.inPlay).toEqual(['Trail']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver', 'Trail']);
  });

  it('loses track of itself when gained if Trader has already exchanged it', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Trader'] });
    game.alice.setHand(['Workshop', 'Trader', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', ...COPPERS]);
    const trails = game.pileSize('Trail');

    await game.start();
    await game.playAction('Workshop');
    await game.chooseCard('Trail');
    await game.chooseEffect('Trader');

    // The Trail is back in its pile: it is still offered, but has lost track of itself
    const trail = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(trail.optionalEffects.map((effect) => effect.effectName)).toEqual(['Trail']);
    await game.chooseEffect('Trail');

    expect(game.alice.log).toContain('Alice has lost track of Trail');
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.pileSize('Trail')).toBe(trails);
    expect(game.alice.inPlay).toEqual(['Workshop']);
    expect(game.alice.discard).toEqual(['Silver']);
    expect(game.alice.hand).toEqual(['Trader', 'Copper', 'Copper', 'Copper']);
  });

  it('is played only once when Watchtower trashes it as it is gained: on being trashed, not again for the gain', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Watchtower'] });
    game.alice.setHand(['Workshop', 'Watchtower', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(['Gold', 'Silver', ...COPPERS]);

    await game.start();
    await game.playAction('Workshop');
    await game.chooseCard('Trail');

    const onGain = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(onGain.optionalEffects.map((effect) => effect.effectName).sort()).toEqual(['Trail', 'Watchtower']);
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    // Trashing it lets it be played from the trash
    const onTrash = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(onTrash.optionalEffects.map((effect) => effect.effectName)).toEqual(['Trail']);
    await game.chooseEffect('Trail');

    // It is in play now: its on-gain reaction is still offered, but has lost track of it. One card drawn, one Action
    const onGainAgain = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(onGainAgain.optionalEffects.map((effect) => effect.effectName)).toEqual(['Trail']);
    await game.chooseEffect('Trail');

    expect(game.alice.log).toContain('Alice has lost track of Trail');
    game.expectDecision('actionPhase', 'Alice');
    expect(game.trash).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Workshop', 'Trail']);
    expect(game.alice.hand).toEqual(['Watchtower', 'Copper', 'Estate', 'Estate', 'Gold']);
    expect(game.alice.actions).toBe(1);
  });

  it('offers its on-gain reaction once when gained into hand', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Artisan'] });
    game.alice.setHand(['Artisan', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', ...COPPERS]);

    await game.start();
    await game.playAction('Artisan');
    await game.chooseCard('Trail');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Trail']);
    await game.chooseEffect('Trail');

    // Played from hand: it draws the Silver; then Artisan puts a card from hand onto the deck
    await game.chooseCard('Silver');
    expect(game.alice.inPlay).toEqual(['Artisan', 'Trail']);
    expect(game.alice.deck[0]).toBe('Silver');
  });

  // User ruling: the cards being looked at aren't on the deck, so Trail draws the card beneath them
  it('draws the card beneath the cards Cartographer is looking at when Cartographer discards it', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Cartographer'] });
    game.alice.setHand(['Cartographer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Trail', 'Silver', 'Gold', 'Estate', 'Province', ...COPPERS]);

    await game.start();
    await game.playAction('Cartographer');
    await game.chooseCards(['Trail']);
    await game.chooseEffect('Trail');

    expect(game.alice.inPlay).toEqual(['Cartographer', 'Trail']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Province']);
    // Cartographer then puts the cards it is still looking at back on the deck
    while (game.pending.kind === 'chooseCard') {
      await game.chooseCard(game.pending.cardChoices[0].card.name);
    }
    expect(game.alice.deck.slice(0, 3).sort()).toEqual(['Estate', 'Gold', 'Silver']);
  });

  it("may be played from the trash when another player's Swindler trashes it, and Swindler still replaces it", async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Swindler', 'Smithy'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Trail', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Swindler');

    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Trail');
    expect(game.trash).toEqual([]);
    expect(game.bob.inPlay).toEqual(['Trail']);
    expect(game.bob.hand).toEqual(['Gold']);

    // Alice still chooses a $4 card for Bob to gain
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.cardChoices.map((choice) => choice.card.name)).toContain('Smithy');
    await game.chooseCard('Smithy');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.discard).toEqual(['Smithy']);
    await game.endTurn();
    expect(game.bob.inPlay).toEqual([]);
    expect(game.bob.discard).toContain('Trail');
  });

  it("may be played when gained on another player's turn, e.g. by a Weaver played there", async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Weaver'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Weaver', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(['Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Militia');
    await game.chooseCards(['Weaver', 'Estate']);
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain a card costing up to $4');
    await game.chooseCard('Trail');

    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Trail');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.inPlay).toEqual(['Weaver', 'Trail']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver', 'Gold']);
  });
});
