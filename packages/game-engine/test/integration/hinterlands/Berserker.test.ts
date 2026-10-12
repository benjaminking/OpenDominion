import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, offered } from './hinterlandsHelpers';

const KINGDOM = ['Berserker', 'Guard Dog', 'Village', 'Laboratory', 'Smithy', 'Border Village'];
const COPPERS = Array<string>(10).fill('Copper');

describe('Berserker', () => {
  it('is played when bought while you have an Action in play, gaining a cheaper card and attacking', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Village', 'Gold', 'Gold', 'Copper', 'Estate']);
    game.alice.setDeck(['Estate', ...COPPERS]);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(7);
    await game.buy('Berserker');

    // Berserker is played: gain a card costing less than $5
    const gain = game.expectDecision('chooseCard', 'Alice');
    const offered = gain.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Smithy');
    expect(offered).not.toContain('Laboratory');
    expect(offered).not.toContain('Berserker');
    expect(gain.noneAllowed).toBe(false);
    await game.chooseCard('Smithy');

    game.expectDecision('chooseCards', 'Bob');
    expect(game.alice.inPlay).toEqual(['Village', 'Gold', 'Gold', 'Copper', 'Berserker']);
    expect(game.alice.discard).toEqual(['Smithy']);
    await game.chooseCards(['Estate', 'Estate']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);

    // It is discarded in Clean-up like any other card in play
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Berserker');
  });

  it('is not played when gained without an Action in play', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Gold', 'Copper', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Berserker');

    // No gain and no attack: straight on to Bob's turn
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard).toContain('Berserker');
    expect(game.bob.hand).toHaveLength(5);
  });

  it('is played when gained by another card, e.g. Border Village, with an Action in play', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Village', 'Gold', 'Gold', 'Estate', 'Estate']);
    game.alice.setDeck(['Copper', ...COPPERS]);
    game.bob.setHand(['Estate', 'Copper', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.playAllTreasures();
    await game.buy('Border Village');

    // Border Village gains a cheaper card: Berserker ($5), which is then played
    await game.chooseCard('Berserker');
    await game.chooseCard('Silver');
    game.expectDecision('chooseCards', 'Bob');
    expect(game.alice.inPlay).toEqual(['Village', 'Gold', 'Gold', 'Copper', 'Berserker']);
    expect(game.alice.discard).toEqual(['Border Village', 'Silver']);
    await game.chooseCards(['Estate', 'Copper']);

    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
  });

  it('makes each other player discard down to 3 cards, with 3 players', async () => {
    const game = createGame({ kingdom: KINGDOM, players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Berserker', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    const cara = game.player('Cara');
    cara.setHand(['Estate', 'Copper', 'Silver']);

    await game.start();
    await game.playAction('Berserker');
    await game.chooseCard('Silver');

    // Bob discards 2; Cara already has 3 cards and is not asked
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Estate', 'Estate']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
    expect(cara.hand).toEqual(['Estate', 'Copper', 'Silver']);
    expect(game.alice.discard).toEqual(['Silver']);
  });

  it('lets other players react to its Attack when it is played on being gained', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Village', 'Gold', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(['Estate', ...COPPERS]);
    game.bob.setHand(['Guard Dog', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.playAllTreasures();
    await game.buy('Berserker');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Guard Dog']);
  });

  it('is played when gained while a Duration card from your last turn is still in play', async () => {
    const game = createGame({ kingdom: ['Berserker', 'Wharf', 'Village'] });
    game.alice.setHand(['Wharf', 'Copper', 'Copper', 'Copper', 'Copper']);
    // Wharf draws 2 now, Clean-up draws the next 5, and Wharf draws 2 more at the start of the next turn
    game.alice.setDeck(['Estate', 'Estate', 'Gold', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper', ...COPPERS]);
    game.bob.setDeck(['Estate', 'Estate', 'Copper', 'Copper', 'Silver', ...COPPERS]);

    await game.start();
    await game.playAction('Wharf');
    await game.endTurn();
    await game.endTurn();
    while (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Wharf');
    }

    // No Action played this turn, but Wharf is still in play
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.inPlay).toEqual(['Wharf']);
    await game.playAllTreasures();
    await game.buy('Berserker');

    await game.chooseCard('Silver');
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Estate', 'Estate']);

    expect(game.alice.inPlay).toEqual([
      'Wharf',
      'Gold',
      'Copper',
      'Copper',
      'Copper',
      'Copper',
      'Copper',
      'Copper',
      'Berserker',
    ]);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
  });

  it("is played on another player's turn when gained there with an Action in play, attacking that player", async () => {
    const game = createGame({ kingdom: ['Berserker', 'Weaver', 'Highway', 'Militia', 'Village'] });
    game.alice.setHand(['Highway', 'Militia', 'Copper', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(['Silver', ...COPPERS]);
    game.bob.setHand(['Weaver', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(COPPERS);
    const berserkers = game.pileSize('Berserker');

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Militia');
    await game.chooseCards(['Weaver', 'Estate']);

    // Bob plays the discarded Weaver; with Alice's Highway in play, Berserker costs $4
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain a card costing up to $4');
    await game.chooseCard('Berserker');

    // Bob's Weaver is an Action in play, so Berserker is played: Bob gains a card costing less than $4
    const gain = game.expectDecision('chooseCard', 'Bob');
    const offered = gain.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Silver');
    expect(offered).toContain('Weaver');
    expect(offered).not.toContain('Berserker');
    expect(offered).not.toContain('Highway');
    await game.chooseCard('Silver');

    // Then Alice, whose turn it is, discards down to 3
    game.expectDecision('chooseCards', 'Alice');
    await game.chooseCards(['Estate', 'Copper']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Silver']);
    expect(game.bob.inPlay).toEqual(['Weaver', 'Berserker']);
    expect(game.pileSize('Berserker')).toBe(berserkers - 1);
    expect([...game.bob.discard].sort()).toEqual(['Estate', 'Silver']);

    // Both are discarded in Alice's Clean-up
    await game.endTurn();
    expect(game.bob.inPlay).toEqual([]);
    expect(game.bob.discard).toEqual(expect.arrayContaining(['Weaver', 'Berserker']));
  });

  it('is not played if Trader has already exchanged it for a Silver', async () => {
    const game = createGame({ kingdom: ['Berserker', 'Trader', 'Village'] });
    game.alice.setHand(['Village', 'Trader', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(['Copper', ...COPPERS]);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(COPPERS);
    const berserkers = game.pileSize('Berserker');

    await game.start();
    await game.playAction('Village');
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Berserker');

    const order = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(order.optionalEffects.map((effect) => effect.effectName)).toEqual(['Trader']);
    expect(order.mandatoryEffects.map((effect) => effect.effectName)).toEqual(['Berserker']);
    await game.chooseEffect('Trader');

    // Berserker is back in the Supply, so it has lost track of itself: no gain and no attack
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pileSize('Berserker')).toBe(berserkers);
    expect(game.bob.hand).toHaveLength(5);
    expect(game.alice.discard).not.toContain('Berserker');
  });

  it('is not played if Watchtower has already trashed it', async () => {
    const game = createGame({ kingdom: ['Berserker', 'Watchtower', 'Village'] });
    game.alice.setHand(['Village', 'Watchtower', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(['Copper', ...COPPERS]);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Berserker');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.trash).toEqual(['Berserker']);
    expect(game.bob.hand).toHaveLength(5);
  });

  it('gains nothing when cost reductions make it cost $0, but still attacks', async () => {
    const game = createGame({ kingdom: ['Berserker', 'Quarry', 'Bridge', 'Village'] });
    game.alice.setHand(['Bridge', 'Quarry', 'Quarry', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Bridge');
    await game.playTreasure('Quarry');
    await game.playTreasure('Quarry');
    await game.playAllTreasures();
    // $5 - $1 (Bridge) - $4 (two Quarries, as it is an Action)
    expect(game.costOf('Berserker').coins).toBe(0);
    await game.buy('Berserker');

    // Nothing costs less than $0: no gain, straight to the Attack
    game.expectDecision('chooseCards', 'Bob');
    expect(game.alice.inPlay).toContain('Berserker');
    await game.chooseCards(['Estate', 'Estate']);

    game.expectDecision('buyPhase', 'Alice');
    expect(game.alice.discard).toEqual([]);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
  });

  it('gains a card costing less than its reduced cost, with Bridge and Quarry stacked', async () => {
    const game = createGame({ kingdom: ['Berserker', 'Quarry', 'Bridge', 'Village', 'Smithy', 'Laboratory'] });
    game.alice.setHand(['Bridge', 'Quarry', 'Gold', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Bridge');
    await game.playTreasure('Quarry');
    await game.playAllTreasures();
    // $5 - $1 - $2 = $2
    await game.buy('Berserker');

    // Actions are $3 cheaper, other cards $1 cheaper
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(offered(gain)).toEqual(expect.arrayContaining(['Bridge', 'Copper', 'Curse', 'Estate', 'Smithy', 'Village']));
    expect(offered(gain)).not.toContain('Silver');
    expect(offered(gain)).not.toContain('Laboratory');
    expect(offered(gain)).not.toContain('Quarry');
    expect(offered(gain)).not.toContain('Berserker');
    await game.chooseCard('Smithy');
    expect(game.alice.discard).toEqual(['Smithy']);
  });

  it("compares with Peddler's Buy-phase cost, which counts the Berserker in play, but not with $P costs", async () => {
    const game = createGame({ kingdom: ['Berserker', 'Peddler', 'Village', 'Familiar'] });
    game.alice.setHand(['Village', 'Gold', 'Gold', 'Copper', 'Estate']);
    game.alice.setDeck(['Copper', ...coppers(10)]);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAllTreasures();
    await game.buy('Berserker');

    // Village and Berserker are in play: Peddler costs $8 - $4 = $4
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(offered(gain)).toContain('Peddler');
    expect(offered(gain)).toContain('Potion');
    expect(offered(gain)).not.toContain('Familiar');
    expect(offered(gain)).not.toContain('Berserker');
    await game.chooseCard('Peddler');

    expect(game.alice.discard[0]).toBe('Peddler');
  });

  it('gains and attacks twice when played by Throne Room, and the Attack can be reacted to each time', async () => {
    const game = createGame({ kingdom: ['Berserker', 'Throne Room', 'Guard Dog', 'Village'] });
    game.alice.setHand(['Throne Room', 'Berserker', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Guard Dog', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Gold', 'Silver', 'Gold', ...coppers(5)]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Berserker');

    // 1st play: Bob keeps his Guard Dog; Alice gains a Silver; Bob discards down to 3
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.declineEffects();
    await game.chooseCard('Silver');
    await game.chooseCards(['Estate', 'Estate']);
    expect(game.bob.hand).toEqual(['Guard Dog', 'Copper', 'Copper']);

    // 2nd play: Bob plays Guard Dog (2 cards, then 2 more), Alice gains another card, Bob discards down to 3 again
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Guard Dog');
    await game.chooseCard('Village');
    game.expectDecision('chooseCards', 'Bob');
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver', 'Gold', 'Silver', 'Gold']);
    await game.chooseCards(['Copper', 'Copper', 'Silver']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.hand.sort()).toEqual(['Gold', 'Gold', 'Silver']);
    expect(game.alice.discard).toEqual(['Silver', 'Village']);
    expect(game.alice.inPlay).toEqual(['Throne Room', 'Berserker']);
  });

  it('counts a Coronet played as a Treasure as an Action in play', async () => {
    const game = createGame({ kingdom: ['Berserker', 'Village'] });
    game.alice.setHand(['Coronet', 'Gold', 'Gold', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('Gold');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(9);
    await game.buy('Berserker');

    await game.chooseCard('Silver');
    game.expectDecision('chooseCards', 'Bob');
    expect(game.alice.inPlay).toEqual(['Coronet', 'Gold', 'Gold', 'Berserker']);
    await game.chooseCards(['Estate', 'Estate']);

    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
  });

  it('does not count a Cauldron in play, which is a Treasure and an Attack but not an Action', async () => {
    const game = createGame({ kingdom: ['Berserker', 'Cauldron', 'Village'] });
    game.alice.setHand(['Cauldron', 'Gold', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Cauldron');
    await game.playAllTreasures();
    await game.buy('Berserker');

    game.expectDecision('buyPhase', 'Alice');
    expect(game.alice.discard).toEqual(['Berserker']);
    expect(game.alice.inPlay).not.toContain('Berserker');
    expect(game.bob.hand).toHaveLength(5);
  });

  it("is not played when another player's Swindler gives it to you and you have no Action in play", async () => {
    const game = createGame({ kingdom: ['Berserker', 'Swindler', 'Laboratory', 'Village'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Laboratory', ...coppers(10)]);

    await game.start();
    await game.playAction('Swindler');
    await game.chooseCard('Berserker');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Laboratory']);
    expect(game.bob.discard).toEqual(['Berserker']);
    expect(game.bob.inPlay).toEqual([]);
    expect(game.alice.hand).toHaveLength(4);
  });

  it("is played on another player's turn when their Swindler gives it to you while your Duration is in play", async () => {
    const game = createGame({ kingdom: ['Berserker', 'Swindler', 'Wharf', 'Laboratory', 'Village'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(['Swindler', ...coppers(10)]);
    game.bob.setHand(['Wharf', 'Copper', 'Copper', 'Copper', 'Copper']);
    // Wharf draws 2, Clean-up draws 5, then the Laboratory is on top for Swindler
    game.bob.setDeck([
      'Copper',
      'Copper',
      'Estate',
      'Estate',
      'Copper',
      'Copper',
      'Copper',
      'Laboratory',
      ...coppers(6),
    ]);

    await game.start();
    await game.endTurn();
    await game.playAction('Wharf');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.bob.inPlay).toEqual(['Wharf']);
    await game.playAction('Swindler');
    await game.chooseCard('Berserker');

    // Bob's Wharf is an Action in play: Bob plays Berserker, gains a card costing less than $5, and attacks Alice
    const gain = game.expectDecision('chooseCard', 'Bob');
    expect(offered(gain)).not.toContain('Laboratory');
    await game.chooseCard('Silver');
    game.expectDecision('chooseCards', 'Alice');
    await game.chooseCards(['Copper']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper']);
    expect(game.bob.inPlay).toEqual(['Wharf', 'Berserker']);
    expect(game.bob.discard).toContain('Silver');

    // Berserker is discarded in Alice's Clean-up; Wharf stays for Bob's turn
    await game.endTurn();
    while (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Wharf');
    }
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.bob.discard).toContain('Berserker');
  });

  it('is played from your hand when gained there, e.g. by Artisan', async () => {
    const game = createGame({ kingdom: ['Berserker', 'Artisan', 'Village'] });
    game.alice.setHand(['Artisan', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Artisan');
    await game.chooseCard('Berserker');

    // Artisan is an Action in play: Berserker is played from hand
    await game.chooseCard('Silver');
    await game.chooseCards(['Estate', 'Estate']);
    expect(game.alice.inPlay).toEqual(['Artisan', 'Berserker']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper']);

    // Then Artisan puts a card from hand onto the deck
    await game.chooseCard('Copper');
    expect(game.alice.deck[0]).toBe('Copper');
    expect(game.alice.discard).toEqual(['Silver']);
  });
});
