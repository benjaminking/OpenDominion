import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { offered } from './baseGameHelpers';

const coppers = (n: number): string[] => Array<string>(n).fill('Copper');

describe('Militia', () => {
  it('asks only the players with more than 3 cards in hand to discard, for exactly the excess', async () => {
    const game = createGame({ kingdom: ['Militia'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    const cara = game.player('Cara');
    cara.setHand(['Estate', 'Copper']);

    await game.start();
    await game.playAction('Militia');

    const decision = game.expectDecision('chooseCards', 'Bob');
    expect(decision.numSelectedEligibility).toEqual([2]);
    await game.chooseCards(['Estate', 'Estate']);

    // Cara has only 2 cards, so she is never asked
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
    expect(cara.hand).toEqual(['Estate', 'Copper']);
    expect(cara.discard).toEqual([]);
    expect(game.alice.coins).toBe(2);
  });

  it('attacks each other player in turn order, each discarding down to 3', async () => {
    const game = createGame({ kingdom: ['Militia'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Copper', 'Copper', 'Silver']);
    const cara = game.player('Cara');
    cara.setHand(['Curse', 'Curse', 'Estate', 'Copper', 'Copper', 'Gold']);

    await game.start();
    await game.playAction('Militia');

    expect(game.expectDecision('chooseCards', 'Bob').numSelectedEligibility).toEqual([1]);
    await game.chooseCards(['Estate']);
    expect(game.expectDecision('chooseCards', 'Cara').numSelectedEligibility).toEqual([3]);
    await game.chooseCards(['Curse', 'Curse', 'Estate']);

    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
    expect(cara.hand).toEqual(['Copper', 'Copper', 'Gold']);
    expect(cara.discard.sort()).toEqual(['Curse', 'Curse', 'Estate']);
  });

  it('makes a target discard down to 3 from the hand they have at that moment, after a Moat-blocked first play', async () => {
    const game = createGame({ kingdom: ['Militia', 'Moat', 'Throne Room'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Throne Room', 'Militia', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Estate', 'Estate', 'Copper', 'Copper']);
    const cara = game.player('Cara');
    cara.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Militia');
    // First play: Bob reveals Moat; Cara discards 2
    await game.chooseEffect('Moat');
    await game.chooseCards(['Estate', 'Estate']);
    // Second play: Bob doesn't reveal Moat and discards 2; Cara already has 3 cards
    await game.declineEffects();
    await game.chooseCards(['Estate', 'Estate']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.hand).toEqual(['Moat', 'Copper', 'Copper']);
    expect(cara.hand).toEqual(['Copper', 'Copper', 'Silver']);
    expect(game.alice.coins).toBe(4);
  });

  it('gives +$2 before the Attack, which then goes round the other 3 players in turn order', async () => {
    const game = createGame({ kingdom: ['Militia'], players: ['Alice', 'Bob', 'Cara', 'Dave'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Copper', 'Copper', 'Copper']);
    const cara = game.player('Cara');
    cara.setHand(['Copper', 'Copper', 'Silver']);
    const dave = game.player('Dave');
    dave.setHand(['Curse', 'Estate', 'Copper', 'Copper', 'Gold']);

    await game.start();
    await game.playAction('Militia');

    game.expectDecision('chooseCards', 'Bob');
    expect(game.alice.coins).toBe(2);
    await game.chooseCards(['Estate']);
    // Cara already has 3 cards, so Dave is next
    expect(game.expectDecision('chooseCards', 'Dave').numSelectedEligibility).toEqual([2]);
    await game.chooseCards(['Curse', 'Estate']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Copper']);
    expect(cara.hand).toEqual(['Copper', 'Copper', 'Silver']);
    expect(dave.hand).toEqual(['Copper', 'Copper', 'Gold']);
  });

  it("lets a target play a discarded Weaver on the attacker's turn, gaining with the attacker's Bridge reduction", async () => {
    const game = createGame({ kingdom: ['Militia', 'Weaver', 'Bridge', 'Festival', 'Market'] });
    game.alice.setHand(['Festival', 'Bridge', 'Militia', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Weaver', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Festival');
    await game.playAction('Bridge');
    await game.playAction('Militia');
    await game.chooseCards(['Weaver', 'Estate']);
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain a card costing up to $4');

    // It is still Alice's turn, so her Bridge makes cards cost $1 less: Market costs $4, Gold $5
    const gain = game.expectDecision('chooseCard', 'Bob');
    expect(offered(gain)).toContain('Market');
    expect(offered(gain)).not.toContain('Gold');
    await game.chooseCard('Market');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.inPlay).toEqual(['Weaver']);
    expect(game.bob.discard.sort()).toEqual(['Estate', 'Market']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
  });
});
