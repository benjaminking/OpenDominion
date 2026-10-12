import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');

describe('Beggar', () => {
  it('can be discarded when another player plays an Attack, gaining 2 Silvers with one onto the deck, before the Attack', async () => {
    const game = createGame({ kingdom: ['Beggar', 'Militia'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Beggar', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold']);
    const silvers = game.pileSize('Silver');

    await game.start();
    await game.playAction('Militia');

    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(game.pending.optionalEffects.map((effect) => effect.effectName)).toEqual(['Beggar']);
    await game.chooseEffect('Beggar');

    expect(game.bob.deck).toEqual(['Silver', 'Gold']);
    expect(game.bob.discard).toEqual(expect.arrayContaining(['Beggar', 'Silver']));
    expect(game.pileSize('Silver')).toBe(silvers - 2);

    // Militia then makes Bob discard from his 4 remaining cards down to 3
    game.expectDecision('chooseCards', 'Bob');
    expect(game.pending.numSelectedEligibility).toEqual([1]);
    await game.chooseCards(['Estate']);
    expect(game.bob.hand).toEqual(['Estate', 'Copper', 'Copper']);
  });

  it('is not offered when it is not in hand', async () => {
    const game = createGame({ kingdom: ['Beggar', 'Militia'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDiscard(['Beggar']);

    await game.start();
    await game.playAction('Militia');

    game.expectDecision('chooseCards', 'Bob');
  });

  it('puts the only remaining Silver onto the deck', async () => {
    const game = createGame({ kingdom: ['Beggar', 'Militia'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Beggar', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold']);
    game.setPileSize('Silver', 1);

    await game.start();
    await game.playAction('Militia');
    await game.chooseEffect('Beggar');

    expect(game.pileSize('Silver')).toBe(0);
    expect(game.bob.deck).toEqual(['Silver', 'Gold']);
    expect(game.bob.discard).toEqual(['Beggar']);
  });

  it('lets each Beggar in hand react to the same Attack', async () => {
    const game = createGame({ kingdom: ['Beggar', 'Militia'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Beggar', 'Beggar', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold']);
    const silvers = game.pileSize('Silver');

    await game.start();
    await game.playAction('Militia');
    await game.chooseEffect('Beggar');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Beggar');

    expect(game.pileSize('Silver')).toBe(silvers - 4);
    expect(game.bob.deck).toEqual(['Silver', 'Silver', 'Gold']);
    expect(game.bob.hand).toEqual(['Estate', 'Copper', 'Copper']);
  });
});

describe('Beggar: interactions', () => {
  it('can be discarded with the Silver pile empty, gaining nothing', async () => {
    const game = createGame({ kingdom: ['Beggar', 'Militia'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Beggar', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold']);
    game.setPileSize('Silver', 0);

    await game.start();
    await game.playAction('Militia');
    await game.chooseEffect('Beggar');

    expect(game.bob.discard).toEqual(['Beggar']);
    expect(game.bob.deck).toEqual(['Gold']);
    await game.chooseCards(['Estate']);
    expect(game.bob.hand).toEqual(['Estate', 'Copper', 'Copper']);
  });

  it('is not offered when its owner plays an Attack', async () => {
    const game = createGame({ kingdom: ['Beggar', 'Militia'] });
    game.alice.setHand(['Militia', 'Beggar', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Militia');

    game.expectDecision('chooseCards', 'Bob');
    expect(game.alice.hand).toContain('Beggar');
  });

  it('can be used along with Moat: Moat blocks the Attack and Beggar still gains Silvers', async () => {
    const game = createGame({ kingdom: ['Beggar', 'Militia', 'Moat'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Beggar', 'Moat', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold']);

    await game.start();
    await game.playAction('Militia');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(game.pending.optionalEffects.map((effect) => effect.effectName).sort()).toEqual(['Beggar', 'Moat']);
    await game.chooseEffect('Moat');
    await game.chooseEffect('Beggar');

    expect(game.bob.hand).toEqual(['Moat', 'Estate', 'Copper', 'Copper']);
    expect(game.bob.deck).toEqual(['Silver', 'Gold']);
    expect(game.bob.discard).toEqual(expect.arrayContaining(['Beggar', 'Silver']));
    game.expectDecision('treasurePhase', 'Alice');
  });

  it('played twice by Throne Room with only 4 Coppers left gains those 4 to hand', async () => {
    const game = createGame({ kingdom: ['Beggar', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Beggar', 'Estate']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Copper', 4);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Beggar');

    expect(game.alice.hand).toEqual(['Estate', 'Copper', 'Copper', 'Copper', 'Copper']);
    expect(game.pileSize('Copper')).toBe(0);
    expect(game.alice.inPlay).toEqual(['Throne Room', 'Beggar']);
  });

  it('lets each other player react in turn order; with 3 Silvers left the second player gets one, onto the deck (3 players)', async () => {
    const game = createGame({ players: ['Alice', 'Bob', 'Cara'], kingdom: ['Beggar', 'Militia'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Beggar', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold']);
    cara.setHand(['Beggar', 'Copper', 'Copper', 'Copper']);
    cara.setDeck(['Gold']);
    game.setPileSize('Silver', 3);

    await game.start();
    await game.playAction('Militia');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Beggar');
    game.expectDecision('chooseFromMultipleEvents', 'Cara');
    await game.chooseEffect('Beggar');

    expect(game.bob.deck).toEqual(['Silver', 'Gold']);
    expect(game.bob.discard).toEqual(expect.arrayContaining(['Beggar', 'Silver']));
    expect(cara.deck).toEqual(['Silver', 'Gold']);
    expect(cara.discard).toEqual(['Beggar']);
    expect(game.pileSize('Silver')).toBe(0);
    // Both are left with 3 cards, so Militia makes no one discard
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Copper']);
    expect(cara.hand).toEqual(['Copper', 'Copper', 'Copper']);
    game.expectDecision('treasurePhase', 'Alice');
  });

  it("can still be discarded for Silvers when its owner's Lighthouse makes the Attack not affect them", async () => {
    const game = createGame({ players: ['Bob', 'Alice'], kingdom: ['Beggar', 'Militia', 'Lighthouse'] });
    game.bob.setHand(['Lighthouse', 'Beggar', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Beggar', 'Estate', 'Estate', 'Copper', 'Copper', ...COPPERS]);
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Lighthouse');
    await game.endTurn();
    expect(game.bob.hand).toEqual(['Beggar', 'Estate', 'Estate', 'Copper', 'Copper']);
    await game.playAction('Militia');

    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Beggar');

    expect(game.bob.discard).toEqual(expect.arrayContaining(['Beggar', 'Silver']));
    // Lighthouse: Militia doesn't make Bob discard
    expect(game.bob.hand).toEqual(['Estate', 'Estate', 'Copper', 'Copper']);
    game.expectDecision('treasurePhase', 'Alice');
  });
});
