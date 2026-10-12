import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const KINGDOM = ['Weaver', 'Oasis', 'Militia', 'Vassal', 'Smithy', 'Village'];
const COPPERS = Array<string>(10).fill('Copper');

describe('Weaver', () => {
  it('may be played when discarded to Oasis', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Oasis', 'Weaver', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', ...COPPERS]);
    const silvers = game.pileSize('Silver');

    await game.start();
    await game.playAction('Oasis');
    await game.chooseCard('Weaver');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Weaver']);
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain two Silvers');

    expect(game.alice.inPlay).toEqual(['Oasis', 'Weaver']);
    expect(game.alice.discard).toEqual(['Silver', 'Silver']);
    expect(game.pileSize('Silver')).toBe(silvers - 2);
    // Playing it this way does not use up an Action
    expect(game.alice.actions).toBe(1);
  });

  it("may be played on another player's turn when discarded to their Attack", async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Weaver', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Militia');
    await game.chooseCards(['Weaver', 'Estate']);
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain a card costing up to $4');

    const gain = game.expectDecision('chooseCard', 'Bob');
    expect(gain.noneAllowed).toBe(false);
    expect(gain.cardChoices.map((choice) => choice.card.name)).toContain('Weaver');
    expect(gain.cardChoices.map((choice) => choice.card.name)).not.toContain('Market');
    await game.chooseCard('Smithy');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.inPlay).toEqual(['Weaver']);
    expect([...game.bob.discard].sort()).toEqual(['Estate', 'Smithy']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
  });

  it("is discarded in the Clean-up of the other player's turn it was played on", async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Weaver', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Militia');
    await game.chooseCards(['Weaver', 'Estate']);
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain two Silvers');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.bob.inPlay).toEqual([]);
    expect(game.bob.discard).toContain('Weaver');
  });

  it('is played only once when Vassal discards it and it reacts', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Vassal', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Weaver', ...COPPERS]);
    const silvers = game.pileSize('Silver');

    await game.start();
    await game.playAction('Vassal');
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain two Silvers');

    // Vassal has lost track of it, so it isn't played again (whether or not Vassal still asks)
    if (game.pending.kind === 'chooseOneOption') {
      await game.chooseOption('Yes');
    }

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.inPlay).toEqual(['Vassal', 'Weaver']);
    expect(game.pileSize('Silver')).toBe(silvers - 2);
    expect(game.alice.discard).toEqual(['Silver', 'Silver']);
    expect(game.alice.coins).toBe(2);
  });

  it("is still offered once a discarded Trail's +1 Card has shuffled it into the deck and drawn it, but loses track of itself", async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Trail'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Trail', 'Weaver', 'Copper', 'Copper', 'Silver']);
    const silvers = game.pileSize('Silver');

    await game.start();
    await game.playAction('Militia');
    await game.chooseCards(['Trail', 'Weaver']);

    const reactions = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reactions.optionalEffects.map((effect) => effect.effectName).sort()).toEqual(['Trail', 'Weaver']);
    await game.chooseEffect('Trail');

    // Trail's +1 Card shuffled the Weaver into the empty deck and drew it
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver', 'Weaver']);
    const weaver = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(weaver.optionalEffects.map((effect) => effect.effectName)).toEqual(['Weaver']);
    await game.chooseEffect('Weaver');

    expect(game.bob.log).toContain('Bob has lost track of Weaver');
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.inPlay).toEqual(['Trail']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver', 'Weaver']);
    expect(game.pileSize('Silver')).toBe(silvers);
  });

  it("may be played when your own Witch's Hut discards it with no Actions left, and still counts as an Action discarded", async () => {
    const game = createGame({ kingdom: [...KINGDOM, "Witch's Hut"] });
    game.alice.setHand(["Witch's Hut", 'Weaver', 'Smithy', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Copper', 'Copper', 'Copper', ...COPPERS]);
    const curses = game.pileSize('Curse');

    await game.start();
    await game.playAction("Witch's Hut");
    expect(game.alice.actions).toBe(0);
    await game.chooseCards(['Weaver', 'Smithy']);

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Weaver']);
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain two Silvers');

    // Both discarded cards were Actions, so Bob gains a Curse
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.inPlay).toEqual(["Witch's Hut", 'Weaver']);
    expect(game.alice.actions).toBe(0);
    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.pileSize('Curse')).toBe(curses - 1);
    expect([...game.alice.discard].sort()).toEqual(['Silver', 'Silver', 'Smithy']);
  });

  it('may be played when discarded from the top of the deck by Jack of All Trades', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Jack Of All Trades'] });
    game.alice.setHand(['Jack Of All Trades', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Weaver', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Jack Of All Trades');
    await game.chooseOption('Discard it');
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain a card costing up to $4');
    await game.chooseCard('Smithy');

    // Then Jack draws up to 5 cards; with only Treasures in hand there is nothing to trash
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.inPlay).toEqual(['Jack Of All Trades', 'Weaver']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Gold']);
    expect(game.alice.discard).toEqual(['Silver', 'Smithy']);
  });

  it('gains only the one Silver left when choosing two Silvers', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Weaver', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Silver', 1);

    await game.start();
    await game.playAction('Weaver');
    await game.chooseOption('Gain two Silvers');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.discard).toEqual(['Silver']);
    expect(game.pileSize('Silver')).toBe(0);
  });

  it('cannot gain a card with a Potion in its cost, but can gain a Potion', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Scrying Pool', 'Familiar'] });
    game.alice.setHand(['Weaver', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Weaver');
    await game.chooseOption('Gain a card costing up to $4');

    const gain = game.expectDecision('chooseCard', 'Alice');
    const offeredNames = gain.cardChoices.map((choice) => choice.card.name);
    expect(offeredNames).toContain('Potion');
    expect(offeredNames).not.toContain('Scrying Pool');
    expect(offeredNames).not.toContain('Familiar');
    await game.chooseCard('Potion');
    expect(game.alice.discard).toEqual(['Potion']);
  });

  it('can choose differently on each play when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Weaver', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Weaver');
    await game.chooseOption('Gain two Silvers');
    await game.chooseOption('Gain a card costing up to $4');
    await game.chooseCard('Smithy');

    expect(game.alice.discard).toEqual(['Silver', 'Silver', 'Smithy']);
  });
});
