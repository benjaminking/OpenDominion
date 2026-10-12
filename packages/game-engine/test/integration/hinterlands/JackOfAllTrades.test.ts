import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const KINGDOM = ['Jack Of All Trades', 'Throne Room', 'Village'];
const COPPERS = Array<string>(10).fill('Copper');

describe('JackOfAllTrades', () => {
  it('shuffles the Silver it gained into the deck when looking at the top card needs a shuffle', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Jack Of All Trades', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Jack Of All Trades');

    const look = game.expectDecision('chooseOneOption', 'Alice');
    expect(look.options).toEqual(['Discard it', 'Leave it on top']);
    expect(game.alice.discard).toEqual([]);
    expect([...game.alice.deck].sort()).toEqual(['Gold', 'Silver']);
    await game.chooseOption('Leave it on top');

    // Draws 1 to get back to 5 cards, then may trash a non-Treasure
    const trash = game.expectDecision('chooseCard', 'Alice');
    expect(trash.noneAllowed).toBe(true);
    expect(trash.cardChoices.map((choice) => choice.card.name)).toEqual(['Estate', 'Estate']);
    await game.chooseNone();

    expect(game.alice.hand).toHaveLength(5);
    expect([...game.alice.hand.slice(4), ...game.alice.deck].sort()).toEqual(['Gold', 'Silver']);
    expect(game.trash).toEqual([]);
  });

  it('leaves the top card for the next turn when the hand already has 5 cards', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Jack Of All Trades', 'Estate', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', ...COPPERS]);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Jack Of All Trades');
    await game.chooseOption('Leave it on top');
    await game.chooseCard('Estate');

    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Copper', 'Copper']);
    expect(game.alice.deck[0]).toBe('Gold');
    expect(game.trash).toEqual(['Estate']);

    // The kept Gold is drawn in Clean-up for the next turn
    await game.endTurn();
    expect(game.alice.hand).toEqual(['Gold', 'Copper', 'Copper', 'Copper', 'Copper']);
  });

  it('gains nothing from an empty Silver pile, and skips the look when there are no cards to look at', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Jack Of All Trades', 'Estate', 'Copper']);
    game.setPileSize('Silver', 0);

    await game.start();
    await game.playAction('Jack Of All Trades');

    // Straight to the optional trash
    const trash = game.expectDecision('chooseCard', 'Alice');
    expect(trash.cardChoices.map((choice) => choice.card.name)).toEqual(['Estate']);
    await game.chooseCard('Estate');

    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.alice.discard).toEqual([]);
    expect(game.trash).toEqual(['Estate']);
  });

  it('does everything twice when played by Throne Room', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Throne Room', 'Jack Of All Trades', 'Estate', 'Estate', 'Curse']);
    game.alice.setDeck(['Duchy', 'Copper', 'Copper', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Jack Of All Trades');

    // 1st play: discard the Duchy, draw 2 to get to 5 cards, trash the Curse
    await game.chooseOption('Discard it');
    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Curse', 'Copper', 'Copper']);
    await game.chooseCard('Curse');

    // 2nd play: keep the Gold on top, draw it, trash an Estate
    await game.chooseOption('Leave it on top');
    await game.chooseCard('Estate');

    expect(game.alice.hand).toEqual(['Estate', 'Copper', 'Copper', 'Gold']);
    expect(game.alice.discard).toEqual(['Silver', 'Duchy', 'Silver']);
    expect(game.trash).toEqual(['Curse', 'Estate']);
  });

  it('draws only what deck and discard pile hold together, including the Silver it gained', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Jack Of All Trades', 'Estate', 'Copper']);
    game.alice.setDeck(['Gold']);

    await game.start();
    await game.playAction('Jack Of All Trades');
    await game.chooseOption('Leave it on top');

    // Draws the Gold, then shuffles the discard pile (the Silver) and draws it; then there is nothing left
    const trash = game.expectDecision('chooseCard', 'Alice');
    expect(game.alice.hand).toEqual(['Estate', 'Copper', 'Gold', 'Silver']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    expect(trash.cardChoices.map((choice) => choice.card.name)).toEqual(['Estate']);
    await game.chooseNone();
    game.expectDecision('treasurePhase', 'Alice');
  });

  it('can discard a Trail from the top of the deck, play it, and then draw up to 5 cards', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Trail'] });
    game.alice.setHand(['Jack Of All Trades', 'Estate', 'Estate', 'Copper']);
    game.alice.setDeck(['Trail', 'Silver', 'Gold', 'Duchy', ...COPPERS]);

    await game.start();
    await game.playAction('Jack Of All Trades');
    await game.chooseOption('Discard it');
    await game.chooseEffect('Trail');

    // Trail draws the Silver (4 cards in hand), then Jack draws the Gold to get to 5
    game.expectDecision('chooseCard', 'Alice');
    expect(game.alice.inPlay).toEqual(['Jack Of All Trades', 'Trail']);
    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Copper', 'Silver', 'Gold']);
    expect(game.alice.actions).toBe(1);
    await game.chooseCard('Estate');

    expect(game.alice.deck[0]).toBe('Duchy');
    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.discard).toEqual(['Silver']);
  });

  it('may trash any card without the Treasure type, but no Treasure, whatever its other types', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Mill', 'Farm', 'Cauldron', "Fool's Gold"] });
    game.alice.setHand(['Jack Of All Trades', 'Mill', 'Curse', 'Coronet', 'Farm', 'Cauldron', "Fool's Gold", 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Jack Of All Trades');
    await game.chooseOption('Leave it on top');

    const trash = game.expectDecision('chooseCard', 'Alice');
    expect(trash.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Curse', 'Estate', 'Mill']);
    await game.chooseCard('Mill');
    expect(game.trash).toEqual(['Mill']);
  });

  it('looks at the gained Silver when Watchtower has put it onto the deck, since it gains first', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Watchtower'] });
    game.alice.setHand(['Jack Of All Trades', 'Watchtower', 'Estate', 'Copper']);
    game.alice.setDeck(['Gold', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Jack Of All Trades');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');

    const look = game.expectDecision('chooseOneOption', 'Alice');
    expect(look.prompt).toContain('Silver');
    expect(game.alice.deck.slice(0, 2)).toEqual(['Silver', 'Gold']);
    await game.chooseOption('Discard it');

    // Then it draws Gold and Copper to get to 5 cards
    const trash = game.expectDecision('chooseCard', 'Alice');
    expect(game.alice.hand).toEqual(['Watchtower', 'Estate', 'Copper', 'Gold', 'Copper']);
    expect(game.alice.discard).toEqual(['Silver']);
    expect(trash.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Estate', 'Watchtower']);
    await game.chooseNone();
  });
});
