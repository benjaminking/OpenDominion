import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const copies = (name: string, count: number): string[] => Array<string>(count).fill(name);

const numShuffles = (log: string[], playerName: string): number =>
  log.filter((line) => line === `${playerName} shuffles.`).length;

describe('Reshuffling', () => {
  it('only shuffles when a card must be drawn and the deck is empty, not when the deck has just run out', async () => {
    const game = createGame({ kingdom: ['Village', 'Smithy'] });
    game.alice.setHand(['Village', 'Smithy', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Silver', 4));
    game.alice.setDiscard(copies('Gold', 3));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Smithy');

    // Smithy drew the last 3 cards of the deck: the discard pile is untouched
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual(copies('Gold', 3));
    expect(numShuffles(game.alice.log, 'Alice')).toBe(0);
    await game.endTurn();

    // Clean-up discards everything first, so this turn's cards are shuffled in for the new hand
    expect(numShuffles(game.alice.log, 'Alice')).toBe(1);
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.deck).toHaveLength(7);
    expect(game.alice.discard).toEqual([]);
  });

  it("doesn't shuffle cards in play or set aside into the new deck", async () => {
    const game = createGame({ kingdom: ['Haven', 'Laboratory'] });
    game.alice.setHand(['Haven', 'Laboratory', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(['Copper']);
    game.alice.setDiscard(['Gold', 'Gold']);

    await game.start();
    await game.playAction('Haven');
    await game.chooseCard('Estate');
    await game.playAction('Laboratory');

    // Laboratory shuffled only the two Golds
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Gold', 'Gold']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Haven', 'Laboratory']);
    expect(game.alice.setAside).toEqual(['Estate']);
  });

  it("doesn't shuffle in a card set aside during a draw-until (Library)", async () => {
    const game = createGame({ kingdom: ['Library', 'Village'] });
    game.alice.setHand(['Library', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Village']);
    game.alice.setDiscard(['Silver', 'Silver', 'Silver']);

    await game.start();
    await game.playAction('Library');
    await game.chooseOption('Set it aside');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver', 'Silver', 'Silver']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual(['Village']);
  });

  it("shuffles in the middle of an Attack's reveal without shuffling in the card already revealed", async () => {
    const game = createGame({ kingdom: ['Bandit'] });
    game.alice.setHand(['Bandit', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));
    game.bob.setDeck(['Estate']);
    game.bob.setDiscard(['Gold', 'Gold']);

    await game.start();
    await game.playAction('Bandit');

    // Bob revealed the Estate, then shuffled the two Golds to reveal one of them
    expect(game.trash).toEqual(['Gold']);
    expect(game.bob.discard).toEqual(['Estate']);
    expect(game.bob.deck).toEqual(['Gold']);
    expect(numShuffles(game.bob.log, 'Bob')).toBe(1);
  });

  it("shuffles another player's discard pile to reveal their top card for Scrying Pool", async () => {
    const game = createGame({ kingdom: ['Scrying Pool'] });
    game.alice.setHand(['Scrying Pool', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', ...copies('Copper', 5)]);
    game.bob.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Scrying Pool');
    await game.chooseOption('Put it back');

    expect(game.expectDecision('chooseOneOption', 'Alice').prompt).toContain("Bob's Gold");
    expect(game.bob.deck).toEqual(['Gold']);
    expect(game.bob.discard).toEqual([]);
  });

  it('draws what it can when the deck and discard pile run out, without shuffling anything else in', async () => {
    const game = createGame({ kingdom: ['Smithy'] });
    game.alice.setHand(['Smithy', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver']);

    await game.start();
    await game.playAction('Smithy');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
    expect(game.alice.inPlay).toEqual(['Smithy']);
    expect(numShuffles(game.alice.log, 'Alice')).toBe(0);
  });
});
