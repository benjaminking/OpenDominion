import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { offered } from './hinterlandsHelpers';

const KINGDOM = ['Inn', 'Border Village', 'Village', 'Smithy'];
const COPPERS = Array<string>(10).fill('Copper');

describe('Inn', () => {
  it('when bought, shuffles the chosen Action cards from the discard pile, including itself, into the deck', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Gold', 'Copper', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);
    game.alice.setDiscard(['Village', 'Copper', 'Smithy', 'Duchy']);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Inn');

    const reveal = game.expectDecision('chooseCards', 'Alice');
    expect(reveal.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Inn', 'Smithy', 'Village']);
    expect(reveal.numSelectedEligibility).toContain(0);
    expect(reveal.numSelectedEligibility).toContain(3);
    await game.chooseCards(['Village', 'Inn']);

    // Clean-up then draws 5 cards from the shuffled deck
    expect(game.currentPlayerName).toBe('Bob');
    const deckAndHand = [...game.alice.hand, ...game.alice.deck];
    expect(deckAndHand).toHaveLength(12);
    expect(deckAndHand).toContain('Inn');
    expect(deckAndHand).toContain('Village');
    expect(game.alice.discard).not.toContain('Inn');
    expect(game.alice.discard).not.toContain('Village');
    expect(game.alice.discard.slice(0, 3)).toEqual(['Copper', 'Smithy', 'Duchy']);
  });

  it('can shuffle in the Border Village that gained it', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Gold', 'Gold', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Border Village');
    await game.chooseCard('Inn');

    const reveal = game.expectDecision('chooseCards', 'Alice');
    expect(reveal.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Border Village', 'Inn']);
    await game.chooseCards(['Border Village', 'Inn']);

    expect(game.currentPlayerName).toBe('Bob');
    const deckAndHand = [...game.alice.hand, ...game.alice.deck];
    expect(deckAndHand).toHaveLength(12);
    expect(deckAndHand).toContain('Border Village');
    expect(deckAndHand).toContain('Inn');
  });

  it('discards the only card left when there are fewer than 2 cards in hand', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Inn']);
    game.alice.setDeck(['Copper']);

    await game.start();
    await game.playAction('Inn');

    const discard = game.expectDecision('chooseCards', 'Alice');
    expect(discard.cardChoices.map((choice) => choice.card.name)).toEqual(['Copper']);
    expect(discard.numSelectedEligibility).toContain(1);
    await game.chooseCards(['Copper']);

    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard).toEqual(['Copper']);
  });

  it('makes the chosen Action cards the whole deck when the deck is empty, leaving the rest in the discard pile', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Highway', 'Workshop'] });
    game.alice.setHand(['Highway', 'Workshop', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper']);
    game.alice.setDiscard(['Village', 'Smithy', 'Estate', 'Copper']);

    await game.start();
    await game.playAction('Highway');
    expect(game.alice.deck).toEqual([]);
    // Inn costs $4 with Highway in play
    await game.playAction('Workshop');
    await game.chooseCard('Inn');

    const reveal = game.expectDecision('chooseCards', 'Alice');
    expect(reveal.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Inn', 'Smithy', 'Village']);
    await game.chooseCards(['Village', 'Inn']);

    game.expectDecision('treasurePhase', 'Alice');
    expect([...game.alice.deck].sort()).toEqual(['Inn', 'Village']);
    expect(game.alice.discard).toEqual(['Smithy', 'Estate', 'Copper']);
    expect(game.alice.log).toContain('Alice reveals Village, Inn');
  });

  it('when gained, offers every card with the Action type, whatever its other types, and nothing else', async () => {
    const game = createGame({
      kingdom: [...KINGDOM, 'Mill', 'Guard Dog', 'Cauldron', 'Tunnel', 'Farm', "Fool's Gold"],
    });
    game.alice.setHand(['Gold', 'Gold', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);
    game.alice.setDiscard(['Mill', 'Guard Dog', 'Coronet', 'Cauldron', 'Tunnel', 'Farm', "Fool's Gold", 'Village']);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Inn');

    const reveal = game.expectDecision('chooseCards', 'Alice');
    expect(offered(reveal).sort()).toEqual(['Coronet', 'Guard Dog', 'Inn', 'Mill', 'Village']);
    await game.chooseCards(['Coronet', 'Mill']);

    expect(game.currentPlayerName).toBe('Bob');
    const deckAndHand = [...game.alice.hand, ...game.alice.deck];
    expect(deckAndHand).toEqual(expect.arrayContaining(['Coronet', 'Mill']));
    expect(game.alice.discard).not.toContain('Coronet');
    expect(game.alice.discard).not.toContain('Mill');
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Cauldron', 'Tunnel', 'Farm', "Fool's Gold", 'Inn']));
  });

  it('asks nothing when there is no card to draw or discard', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Inn']);

    await game.start();
    await game.playAction('Inn');

    game.expectDecision('buyPhase', 'Alice');
    expect(game.alice.actions).toBe(2);
    expect(game.alice.discard).toEqual([]);
  });

  it('shuffles the discard pile to draw its second card, then discards 2', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Inn', 'Estate']);
    game.alice.setDeck(['Silver']);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Inn');

    const discard = game.expectDecision('chooseCards', 'Alice');
    expect(discard.numSelectedEligibility).toEqual([2]);
    expect(game.alice.hand).toEqual(['Estate', 'Silver', 'Gold']);
    await game.chooseCards(['Estate', 'Silver']);

    expect(game.alice.hand).toEqual(['Gold']);
    expect(game.alice.discard).toEqual(['Estate', 'Silver']);
  });

  it('when gained onto the deck with no Action cards in the discard pile, asks nothing but shuffles the deck', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Develop'] });
    game.alice.setHand(['Develop', 'Smithy', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', 'Silver', 'Estate']);
    game.alice.setDiscard(['Copper', 'Estate']);

    await game.start();
    await game.playAction('Develop');
    await game.chooseCard('Smithy');
    // $5 first: Inn, onto the deck, which is then shuffled with it
    await game.chooseCard('Inn');

    // Straight on to Develop's $3 gain
    const second = game.expectDecision('chooseCard', 'Alice');
    expect(offered(second)).toContain('Silver');
    expect([...game.alice.deck].sort()).toEqual(['Estate', 'Gold', 'Inn', 'Silver']);
    expect(game.alice.discard).toEqual(['Copper', 'Estate']);
    await game.chooseCard('Silver');
    expect(game.alice.deck[0]).toBe('Silver');
  });
});
