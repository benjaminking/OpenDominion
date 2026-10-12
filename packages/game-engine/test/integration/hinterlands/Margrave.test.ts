import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const KINGDOM = ['Margrave', 'Guard Dog', 'Village'];
const COPPERS = Array<string>(10).fill('Copper');

describe('Margrave', () => {
  it('makes each other player draw a card, then discard down to 3, with 3 players', async () => {
    const game = createGame({ kingdom: KINGDOM, players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Margrave', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Silver', 'Gold', ...COPPERS]);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(['Gold', ...COPPERS]);
    const cara = game.player('Cara');
    cara.setHand(['Estate', 'Copper']);
    cara.setDeck(['Silver', ...COPPERS]);

    await game.start();
    await game.playAction('Margrave');

    // Bob draws to 6 and discards 3
    const bobDiscard = game.expectDecision('chooseCards', 'Bob');
    expect(bobDiscard.numSelectedEligibility).toEqual([3]);
    expect(game.bob.hand).toEqual(['Estate', 'Estate', 'Copper', 'Copper', 'Silver', 'Gold']);
    await game.chooseCards(['Estate', 'Estate', 'Copper']);

    // Cara draws to 3 and does not discard
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.hand).toEqual(['Copper', 'Silver', 'Gold']);
    expect(cara.hand).toEqual(['Estate', 'Copper', 'Silver']);
    expect(cara.discard).toEqual([]);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver', 'Silver', 'Gold']);
    expect(game.alice.buys).toBe(2);
  });

  it('does not let a player react with a Guard Dog drawn by the Margrave itself', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Margrave', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(['Guard Dog', ...COPPERS]);

    await game.start();
    await game.playAction('Margrave');

    // No reaction prompt: straight to discarding, with the drawn Guard Dog in hand
    game.expectDecision('chooseCards', 'Bob');
    expect(game.bob.hand).toContain('Guard Dog');
    await game.chooseCards(['Estate', 'Estate', 'Copper']);

    expect(game.bob.hand).toEqual(['Copper', 'Silver', 'Guard Dog']);
    expect(game.bob.inPlay).toEqual([]);
  });

  it('still makes a player with no cards to draw discard down to 3', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Margrave', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Copper', 'Copper', 'Silver']);

    await game.start();
    await game.playAction('Margrave');

    const discard = game.expectDecision('chooseCards', 'Bob');
    expect(discard.numSelectedEligibility).toEqual([1]);
    await game.chooseCards(['Estate']);

    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
    expect(game.bob.discard).toEqual(['Estate']);
  });

  it('makes players with 4 and 6 cards each draw 1 and discard down to 3, with 3 players', async () => {
    const game = createGame({ kingdom: KINGDOM, players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Margrave', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(['Gold', ...COPPERS]);
    const cara = game.player('Cara');
    cara.setHand(['Estate', 'Estate', 'Estate', 'Copper', 'Silver', 'Gold']);
    cara.setDeck(['Duchy', ...COPPERS]);

    await game.start();
    await game.playAction('Margrave');

    const bobDiscard = game.expectDecision('chooseCards', 'Bob');
    expect(bobDiscard.numSelectedEligibility).toEqual([2]);
    await game.chooseCards(['Estate', 'Copper']);

    const caraDiscard = game.expectDecision('chooseCards', 'Cara');
    expect(caraDiscard.numSelectedEligibility).toEqual([4]);
    expect(cara.hand).toEqual(['Estate', 'Estate', 'Estate', 'Copper', 'Silver', 'Gold', 'Duchy']);
    await game.chooseCards(['Estate', 'Estate', 'Estate', 'Duchy']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.hand).toEqual(['Copper', 'Silver', 'Gold']);
    expect(cara.hand).toEqual(['Copper', 'Silver', 'Gold']);
  });

  it('lets a player reveal Diplomat first, then still draws 1 and discards down to 3', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Diplomat'] });
    game.alice.setHand(['Margrave', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Diplomat', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Silver', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Margrave');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Diplomat']);
    await game.chooseEffect('Diplomat');
    // Diplomat: draw 2, discard 3 (leaving 4 cards)
    await game.chooseCards(['Estate', 'Estate', 'Copper']);

    // Margrave: draw 1, then discard down to 3
    const discard = game.expectDecision('chooseCards', 'Bob');
    expect(discard.numSelectedEligibility).toEqual([2]);
    expect(game.bob.hand).toEqual(['Diplomat', 'Copper', 'Silver', 'Silver', 'Gold']);
    await game.chooseCards(['Diplomat', 'Copper']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.hand).toEqual(['Silver', 'Silver', 'Gold']);
  });

  it('resolves for each other player in turn order with 4 players; a player who reveals Moat neither draws nor discards', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Moat'], players: ['Alice', 'Bob', 'Cara', 'Dan'] });
    game.alice.setHand(['Margrave', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(['Gold', ...COPPERS]);
    const cara = game.player('Cara');
    cara.setHand(['Moat', 'Estate', 'Estate', 'Copper', 'Copper']);
    cara.setDeck(['Gold', ...COPPERS]);
    const dan = game.player('Dan');
    dan.setHand(['Estate', 'Duchy', 'Copper', 'Silver', 'Silver']);
    dan.setDeck(['Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Margrave');
    game.expectDecision('chooseFromMultipleEvents', 'Cara');
    await game.chooseEffect('Moat');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.declineEffects();
    }

    game.expectDecision('chooseCards', 'Bob');
    expect(game.bob.hand).toHaveLength(6);
    await game.chooseCards(['Estate', 'Estate', 'Copper']);

    game.expectDecision('chooseCards', 'Dan');
    expect(dan.hand).toEqual(['Estate', 'Duchy', 'Copper', 'Silver', 'Silver', 'Gold']);
    await game.chooseCards(['Estate', 'Duchy', 'Copper']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.hand).toEqual(['Copper', 'Silver', 'Gold']);
    expect(cara.hand).toEqual(['Moat', 'Estate', 'Estate', 'Copper', 'Copper']);
    expect(cara.deck[0]).toBe('Gold');
    expect(dan.hand).toEqual(['Silver', 'Silver', 'Gold']);
  });

  it('makes each other player draw and discard down to 3 twice when played by Throne Room', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Margrave', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(['Gold', 'Duchy', ...COPPERS]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Margrave');

    // 1st play: draws the Gold (6 cards), discards 3
    const first = game.expectDecision('chooseCards', 'Bob');
    expect(first.numSelectedEligibility).toEqual([3]);
    await game.chooseCards(['Estate', 'Estate', 'Copper']);
    // 2nd play: draws the Duchy (4 cards), discards 1
    const second = game.expectDecision('chooseCards', 'Bob');
    expect(second.numSelectedEligibility).toEqual([1]);
    expect(game.bob.hand).toEqual(['Copper', 'Silver', 'Gold', 'Duchy']);
    await game.chooseCards(['Duchy']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.hand).toEqual(['Copper', 'Silver', 'Gold']);
    expect(game.alice.hand).toHaveLength(9);
    expect(game.alice.buys).toBe(3);
  });
});
