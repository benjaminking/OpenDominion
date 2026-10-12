import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');

describe('Mercenary', () => {
  it('makes each other player discard down to 3, skipping players with 3 or fewer cards (3 players)', async () => {
    const game = createGame({ players: ['Alice', 'Bob', 'Cara'], kingdom: ['Urchin'] });
    game.alice.setHand(['Mercenary', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Silver', ...COPPERS]);
    game.bob.setHand(['Copper', 'Copper', 'Estate', 'Estate', 'Silver']);
    game.player('Cara').setHand(['Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Mercenary');
    game.expectDecision('chooseCards', 'Alice');
    expect(game.pending.numSelectedEligibility).toEqual([0, 2]);
    await game.chooseCards(['Estate', 'Estate']);

    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Estate', 'Estate']);

    expect(game.trash).toEqual(['Estate', 'Estate']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Silver', 'Silver']);
    expect(game.alice.coins).toBe(2);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
    expect(game.player('Cara').hand).toHaveLength(3);
    game.expectDecision('treasurePhase', 'Alice');
  });

  it('lets other players react with Beggar before deciding whether to trash', async () => {
    const game = createGame({ kingdom: ['Urchin', 'Beggar'] });
    game.alice.setHand(['Mercenary', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Beggar', 'Copper', 'Copper', 'Estate', 'Estate']);

    await game.start();
    await game.playAction('Mercenary');

    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Beggar');
    game.expectDecision('chooseCards', 'Alice');
    await game.chooseCards(['Estate', 'Estate']);
    await game.chooseCards(['Estate']);

    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Estate']);
  });

  it('with only one other card in hand, may trash it but then gets nothing and does not attack', async () => {
    const game = createGame({ kingdom: ['Urchin'] });
    game.alice.setHand(['Mercenary', 'Estate']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Mercenary');
    await game.chooseCards(['Estate']);

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.coins).toBe(0);
    expect(game.bob.hand).toHaveLength(5);
  });

  it('resolves the when-trashed effects of both trashed cards, in the order you choose', async () => {
    const game = createGame({ kingdom: ['Urchin', 'Feodum', 'Cultist'] });
    game.alice.setHand(['Mercenary', 'Feodum', 'Cultist', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', 'Gold', 'Gold', 'Silver', 'Silver', ...COPPERS]);
    game.bob.setHand(['Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Mercenary');
    await game.chooseCards(['Feodum', 'Cultist']);

    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(game.pending.mandatoryEffects.map((effect) => effect.effectName).sort()).toEqual(['Cultist', 'Feodum']);
    await game.chooseEffect('Feodum');

    // Feodum: gain 3 Silvers; Cultist: +3 Cards; then Mercenary: +2 Cards, +$2
    expect(game.alice.discard).toEqual(['Silver', 'Silver', 'Silver']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Gold', 'Gold', 'Gold', 'Silver', 'Silver']);
    expect(game.alice.coins).toBe(2);
  });
});

describe('Mercenary: interactions', () => {
  it('trashing a Fortress and another card counts as trashing 2 cards, and the Fortress returns to hand', async () => {
    const game = createGame({ kingdom: ['Urchin', 'Fortress'] });
    game.alice.setHand(['Mercenary', 'Fortress', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Silver', ...COPPERS]);
    game.bob.setHand(['Copper', 'Copper', 'Estate', 'Estate', 'Silver']);

    await game.start();
    await game.playAction('Mercenary');
    await game.chooseCards(['Fortress', 'Estate']);
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Estate', 'Estate']);

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Fortress', 'Silver', 'Silver']);
    expect(game.alice.coins).toBe(2);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
  });

  it('attacks each other player in turn order, skipping one who reveals Moat (4 players)', async () => {
    const game = createGame({ players: ['Alice', 'Bob', 'Cara', 'Dan'], kingdom: ['Urchin', 'Moat'] });
    game.alice.setHand(['Mercenary', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Moat', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.player('Cara').setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.player('Dan').setHand(['Estate', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Mercenary');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Moat');
    await game.chooseCards(['Estate', 'Estate']);

    game.expectDecision('chooseCards', 'Cara');
    await game.chooseCards(['Estate', 'Estate']);
    game.expectDecision('chooseCards', 'Dan');
    await game.chooseCards(['Estate']);

    expect(game.bob.hand).toHaveLength(5);
    expect(game.player('Cara').hand).toEqual(['Copper', 'Copper', 'Copper']);
    expect(game.player('Dan').hand).toEqual(['Copper', 'Copper', 'Copper']);
    game.expectDecision('treasurePhase', 'Alice');
  });

  it('played twice by Throne Room: each play may trash 2 cards for its bonus', async () => {
    const game = createGame({ kingdom: ['Urchin', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Mercenary', 'Estate', 'Estate', 'Copper']);
    game.alice.setDeck(['Silver', 'Silver', 'Gold', 'Gold', ...COPPERS]);
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Estate', 'Estate']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Mercenary');
    await game.chooseCards(['Estate', 'Estate']);
    await game.chooseCards(['Estate', 'Estate']);
    // Second play: trash Copper and a Silver it drew
    game.expectDecision('chooseCards', 'Alice');
    await game.chooseCards(['Copper', 'Silver']);

    expect(game.trash).toEqual(['Estate', 'Estate', 'Copper', 'Silver']);
    expect(game.alice.hand).toEqual(['Silver', 'Gold', 'Gold']);
    expect(game.alice.coins).toBe(4);
    // Bob was already at 3 cards for the second Attack
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Copper']);
  });

  it('with an empty hand trashes nothing, so it gives nothing and does not attack', async () => {
    const game = createGame({ kingdom: ['Urchin'] });
    game.alice.setHand(['Mercenary']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Mercenary');

    // The (empty) choice only allows trashing nothing
    game.expectDecision('chooseCards', 'Alice');
    expect(game.pending.cardChoices).toEqual([]);
    expect(game.pending.numSelectedEligibility).toEqual([0]);
    await game.chooseCards([]);

    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.coins).toBe(0);
    expect(game.bob.hand).toHaveLength(5);
  });

  it('trashing 2 cards with an empty deck and discard pile draws nothing, but still gives +$2 and attacks', async () => {
    const game = createGame({ kingdom: ['Urchin'] });
    game.alice.setHand(['Mercenary', 'Estate', 'Estate', 'Copper']);
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Estate', 'Estate']);

    await game.start();
    await game.playAction('Mercenary');
    await game.chooseCards(['Estate', 'Estate']);
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Estate', 'Estate']);

    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.alice.coins).toBe(2);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Copper']);
  });
});
