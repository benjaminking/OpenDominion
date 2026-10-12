import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const TRASH_OPTION = 'Trash 2 cards from your hand.';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Steward', () => {
  it('must trash exactly 2 cards when there are 2 or more in hand', async () => {
    const game = createGame({ kingdom: ['Steward'] });
    game.alice.setHand(['Steward', 'Estate', 'Curse', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.playAction('Steward');
    await game.chooseOption(TRASH_OPTION);

    expect(game.expectDecision('chooseCards', 'Alice').numSelectedEligibility).toEqual([2]);
  });

  it('trashes the only card in hand', async () => {
    const game = createGame({ kingdom: ['Steward'] });
    game.alice.setHand(['Steward', 'Estate']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.playAction('Steward');
    await game.chooseOption(TRASH_OPTION);
    if (game.pending.kind === 'chooseCards') {
      await game.chooseCards(['Estate']);
    }

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.hand).toEqual([]);
  });

  it('draws what it can for +2 Cards, reshuffling the discard pile', async () => {
    const game = createGame({ kingdom: ['Steward'] });
    game.alice.setHand(['Steward']);
    game.alice.setDeck(['Silver']);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Steward');
    await game.chooseOption('+2 Cards');

    expect(game.alice.hand).toEqual(['Silver', 'Gold']);
  });

  it('trashes 2 cards then the last card when played by Throne Room with 3 cards in hand', async () => {
    const game = createGame({ kingdom: ['Steward', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Steward', 'Estate', 'Curse', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Steward');
    await game.chooseOption(TRASH_OPTION);
    await game.chooseCards(['Estate', 'Curse']);
    await game.chooseOption(TRASH_OPTION);
    if (game.pending.kind === 'chooseCards') {
      await game.chooseCards(['Copper']);
    }

    expect(game.trash).toEqual(['Estate', 'Curse', 'Copper']);
    expect(game.alice.hand).toEqual([]);
  });

  it('trashes nothing when choosing to trash with an empty hand', async () => {
    const game = createGame({ kingdom: ['Steward'] });
    game.alice.setHand(['Steward']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Steward');
    await game.chooseOption(TRASH_OPTION);
    if (game.pending.kind === 'chooseCards') {
      await game.chooseCards([]);
    }

    expect(game.trash).toEqual([]);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('offers its three options in the order printed on the card', async () => {
    const game = createGame({ kingdom: ['Steward'] });
    game.alice.setHand(['Steward', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Steward');

    expect(game.expectDecision('chooseOneOption', 'Alice').options).toEqual(['+2 Cards', '+$2', TRASH_OPTION]);
  });

  it('draws the only card left for +2 Cards when the deck and discard pile hold 1 card', async () => {
    const game = createGame({ kingdom: ['Steward'] });
    game.alice.setHand(['Steward', 'Copper']);
    game.alice.setDeck([]);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Steward');
    await game.chooseOption('+2 Cards');

    expect(game.alice.hand).toEqual(['Copper', 'Gold']);
    expect(game.alice.discard).toEqual([]);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('draws nothing for +2 Cards with an empty deck and discard pile', async () => {
    const game = createGame({ kingdom: ['Steward'] });
    game.alice.setHand(['Steward', 'Copper']);

    await game.start();
    await game.playAction('Steward');
    await game.chooseOption('+2 Cards');

    expect(game.alice.hand).toEqual(['Copper']);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('trashes both cards at once, then resolves their when-trash abilities in the chosen order', async () => {
    const game = createGame({ kingdom: ['Steward', 'Fortress', 'Rats'] });
    game.alice.setHand(['Steward', 'Fortress', 'Rats', 'Copper']);
    game.alice.setDeck(['Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Steward');
    await game.chooseOption(TRASH_OPTION);
    await game.chooseCards(['Fortress', 'Rats']);

    // Official FAQ (Steward): trash both at the same time, then choose the order of when-trash effects
    const order = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect([...order.mandatoryEffects.map((effect) => effect.effectName)].sort()).toEqual(['Fortress', 'Rats']);
    await game.chooseEffect('Fortress');

    expect(game.trash).toEqual(['Rats']);
    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Fortress', 'Gold']);
  });
});
