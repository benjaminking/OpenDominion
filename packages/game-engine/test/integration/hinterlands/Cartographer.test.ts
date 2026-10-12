import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { offered } from './hinterlandsHelpers';

const KINGDOM = ['Cartographer', 'Village'];

describe('Cartographer', () => {
  it('shuffles mid-effect to look at 4 cards when the deck runs out after drawing', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Cartographer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold']);
    game.alice.setDiscard(['Estate', 'Estate', 'Duchy']);

    await game.start();
    await game.playAction('Cartographer');

    // Silver is drawn; Gold is the last card of the deck, then the discard pile is shuffled for the other 3
    const look = game.expectDecision('chooseCards', 'Alice');
    expect(look.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Duchy', 'Estate', 'Estate', 'Gold']);
    expect(game.alice.hand).toContain('Silver');
    expect(game.alice.discard).toEqual([]);
    await game.chooseCards(['Estate', 'Estate', 'Duchy']);

    expect(game.alice.discard.sort()).toEqual(['Duchy', 'Estate', 'Estate']);
    expect(game.alice.deck).toEqual(['Gold']);
    expect(game.alice.actions).toBe(1);
  });

  it('looks at only as many cards as there are when deck and discard pile together have fewer than 4', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Cartographer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold']);
    game.alice.setDiscard(['Estate']);

    await game.start();
    await game.playAction('Cartographer');

    const look = game.expectDecision('chooseCards', 'Alice');
    expect(look.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Estate', 'Gold']);
    await game.chooseCards(['Estate']);

    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.alice.deck).toEqual(['Gold']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
  });

  it('puts the cards it does not discard back in the order chosen, last chosen on top', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Cartographer', 'Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Silver', 'Gold', 'Estate', 'Village', 'Copper']);

    await game.start();
    await game.playAction('Cartographer');
    await game.chooseCards(['Estate']);

    // Put Silver back first, then Village, then Gold, so Gold ends up on top
    await game.chooseCard('Silver');
    await game.chooseCard('Village');
    expect(game.alice.deck).toEqual(['Gold', 'Village', 'Silver', 'Copper']);

    // Village draws the Gold that is now on top
    await game.playAction('Village');
    expect(game.alice.hand).toContain('Gold');
    expect(game.alice.deck).toEqual(['Village', 'Silver', 'Copper']);
  });

  it('draws one of the cards it put back, then looks at the next 4, when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Cartographer', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Silver', 'Gold', 'Estate', 'Duchy', 'Province', 'Curse', 'Village', 'Copper']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Cartographer');

    // 1st play: draws the Copper, looks at Silver, Gold, Estate, Duchy
    const firstLook = game.expectDecision('chooseCards', 'Alice');
    expect(offered(firstLook).sort()).toEqual(['Duchy', 'Estate', 'Gold', 'Silver']);
    await game.chooseCards(['Estate', 'Duchy']);
    // Silver goes back first, so Gold ends up on top
    await game.chooseCard('Silver');

    // 2nd play: draws the Gold, looks at Silver, Province, Curse, Village
    const secondLook = game.expectDecision('chooseCards', 'Alice');
    expect(offered(secondLook).sort()).toEqual(['Curse', 'Province', 'Silver', 'Village']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Gold']);
    await game.chooseCards(['Curse']);
    await game.chooseCard('Silver');
    await game.chooseCard('Province');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.deck).toEqual(['Village', 'Province', 'Silver', 'Copper']);
    expect(game.alice.discard.sort()).toEqual(['Curse', 'Duchy', 'Estate']);
    expect(game.alice.actions).toBe(2);
  });

  it('draws the only card in the deck and discard pile, then has nothing to look at', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Cartographer', 'Village', 'Copper']);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Cartographer');

    // No prompt to discard from no cards
    game.expectDecision('actionPhase', 'Alice');
    expect(game.alice.hand).toEqual(['Village', 'Copper', 'Gold']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.actions).toBe(1);
  });
});
