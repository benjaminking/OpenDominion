import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('SecretPassage', () => {
  it('takes the chosen card out of hand and puts it at the chosen depth in the deck', async () => {
    const game = createGame({ kingdom: ['Secret Passage'] });
    game.alice.setHand(['Secret Passage', 'Gold', 'Copper']);
    game.alice.setDeck(['Estate', 'Estate', 'Silver', 'Duchy', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Secret Passage');
    expect(game.alice.actions).toBe(1);
    await game.chooseCard('Gold');
    await game.chooseOption('1');

    expect(game.alice.hand).toEqual(['Copper', 'Estate', 'Estate']);
    expect(game.alice.deck).toEqual(['Silver', 'Gold', 'Duchy', 'Copper', 'Copper']);
  });

  it('offers every position in the deck, from the top to the bottom', async () => {
    const game = createGame({ kingdom: ['Secret Passage'] });
    game.alice.setHand(['Secret Passage', 'Gold']);
    game.alice.setDeck(['Copper', 'Copper', ...Array<string>(6).fill('Estate')]);

    await game.start();
    await game.playAction('Secret Passage');
    await game.chooseCard('Gold');

    // 6 cards left in the deck: Gold can go above any of them or under all of them
    expect(game.expectDecision('chooseOneOption', 'Alice').options).toEqual(['0', '1', '2', '3', '4', '5', '6']);
    await game.chooseOption('6');
    expect(game.alice.deck).toEqual([...Array<string>(6).fill('Estate'), 'Gold']);
  });

  it('makes the card the only card in the deck when the deck is empty', async () => {
    const game = createGame({ kingdom: ['Secret Passage'] });
    game.alice.setHand(['Secret Passage', 'Gold', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Silver']);

    await game.start();
    await game.playAction('Secret Passage');
    await game.chooseCard('Gold');
    if (game.pending.kind === 'chooseOneOption') {
      expect(game.pending.options).toEqual(['0']);
      await game.chooseOption('0');
    }

    expect(game.alice.deck).toEqual(['Gold']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Silver', 'Silver']);
  });

  it('puts the card into an empty deck without shuffling the discard pile, so it is drawn before the reshuffle', async () => {
    const game = createGame({ kingdom: ['Secret Passage', 'Smithy'] });
    game.alice.setHand(['Secret Passage', 'Smithy', 'Gold']);
    game.alice.setDeck(['Copper', 'Copper']);
    game.alice.setDiscard(['Estate', 'Estate']);

    await game.start();
    await game.playAction('Secret Passage');
    await game.chooseCard('Gold');
    if (game.pending.kind === 'chooseOneOption') {
      await game.chooseOption('0');
    }

    expect(game.alice.deck).toEqual(['Gold']);
    expect(game.alice.discard).toEqual(['Estate', 'Estate']);

    // Smithy draws the Gold, then shuffles the discard pile for the other 2
    await game.playAction('Smithy');
    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Copper', 'Estate', 'Estate', 'Gold']);
  });

  it('only offers cards from hand, not Secret Passage itself, which is in play', async () => {
    const game = createGame({ kingdom: ['Secret Passage'] });
    game.alice.setHand(['Secret Passage', 'Gold']);
    game.alice.setDeck(['Copper', 'Copper', 'Estate']);

    await game.start();
    await game.playAction('Secret Passage');

    const decision = game.expectDecision('chooseCard', 'Alice');
    expect([...decision.cardChoices.map((choice) => choice.card.name)].sort()).toEqual(['Copper', 'Copper', 'Gold']);
    expect(decision.noneAllowed).toBe(false);
  });

  it('can put back a card on the first play by Throne Room that the second play then draws', async () => {
    const game = createGame({ kingdom: ['Secret Passage', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Secret Passage', 'Gold']);
    game.alice.setDeck(['Copper', 'Copper', 'Estate', 'Estate', 'Silver', ...coppers(5)]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Secret Passage');
    await game.chooseCard('Gold');
    // Gold goes under the top Estate, so the second play draws Estate and Gold
    await game.chooseOption('1');

    await game.chooseCard('Copper');
    await game.chooseOption('0');

    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Estate', 'Gold']);
    expect(game.alice.deck.slice(0, 2)).toEqual(['Copper', 'Estate']);
    expect(game.alice.actions).toBe(2);
  });

  it('draws the only card left by reshuffling, then puts a card into the now-empty deck', async () => {
    const game = createGame({ kingdom: ['Secret Passage'] });
    game.alice.setHand(['Secret Passage', 'Copper']);
    game.alice.setDeck([]);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Secret Passage');
    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Gold']);
    await game.chooseCard('Copper');
    if (game.pending.kind === 'chooseOneOption') {
      await game.chooseOption('0');
    }

    expect(game.alice.hand).toEqual(['Gold']);
    expect(game.alice.deck).toEqual(['Copper']);
    expect(game.alice.actions).toBe(1);
  });

  it('does nothing more with no cards to draw and an empty hand', async () => {
    const game = createGame({ kingdom: ['Secret Passage'] });
    game.alice.setHand(['Secret Passage']);

    await game.start();
    await game.playAction('Secret Passage');

    expect(game.alice.deck).toEqual([]);
    expect(game.alice.actions).toBe(1);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });
});
