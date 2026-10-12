import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Dame Anna', () => {
  it('trashes up to 2 cards from hand before attacking', async () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.alice.setHand(['Dame Anna', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Silver', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Dame Anna');

    const choice = game.expectDecision('chooseCards', 'Alice');
    expect(choice.numSelectedEligibility).toEqual([0, 1, 2]);
    await game.chooseCards(['Estate', 'Estate']);

    expect(game.trash).toEqual(['Estate', 'Estate', 'Silver']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper']);
  });

  it('still attacks when there is nothing in hand to trash', async () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.alice.setHand(['Dame Anna']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Gold', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Dame Anna');
    if (game.pending.kind === 'chooseCards') {
      expect(game.pending.cardChoices).toEqual([]);
      await game.chooseCards([]);
    }

    expect(game.trash).toEqual(['Gold']);
    expect(game.alice.inPlay).toEqual(['Dame Anna']);
  });

  it('resolves the when-trashed abilities of a Rats and a Fortress it trashes, in the chosen order, before attacking', async () => {
    const game = createGame({ kingdom: ['Knights', 'Rats', 'Fortress'] });
    game.alice.setHand(['Dame Anna', 'Rats', 'Fortress', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', ...COPPERS]);
    game.bob.setDeck(['Gold', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Dame Anna');
    await game.chooseCards(['Rats', 'Fortress']);

    const order = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(order.mandatoryEffects.map((effect) => effect.effectName).sort()).toEqual(['Fortress', 'Rats']);
    expect(game.bob.deck.slice(0, 2)).toEqual(['Gold', 'Copper']);
    await game.chooseEffect('Fortress');

    // Rats then draws, and only then does Bob reveal
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Fortress', 'Silver']);
    expect(game.trash).toEqual(['Rats', 'Gold']);
    expect(game.alice.inPlay).toEqual(['Dame Anna']);
  });

  it('does not trash itself when it trashes a Knight from its own hand', async () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.alice.setHand(['Dame Anna', 'Sir Martin', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Copper', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Dame Anna');
    await game.chooseCards(['Sir Martin']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Sir Martin']);
    expect(game.alice.inPlay).toEqual(['Dame Anna']);
  });

  it('trashes the only other card in hand when that is all there is', async () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.alice.setHand(['Dame Anna', 'Estate']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Silver', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Dame Anna');

    const choice = game.expectDecision('chooseCards', 'Alice');
    expect(choice.cardChoices.map((cardChoice) => cardChoice.card.name)).toEqual(['Estate']);
    await game.chooseCards(['Estate']);

    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
    expect(game.trash).toEqual(['Estate', 'Silver']);
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Dame Anna']);
  });
});
