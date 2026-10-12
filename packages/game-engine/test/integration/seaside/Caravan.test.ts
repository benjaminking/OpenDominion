import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers } from './seasideHelpers';

describe('Caravan', () => {
  it("draws a card at the start of the next turn and stays in play until that turn's clean-up", async () => {
    const game = createGame({ kingdom: ['Caravan'] });
    game.alice.setHand(['Caravan', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', ...coppers(5), 'Gold', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Caravan');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
    expect(game.alice.actions).toBe(1);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Caravan']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(6);
    expect(game.alice.hand).toContain('Gold');
    expect(game.alice.inPlay).toEqual(['Caravan']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Caravan');
  });

  it('stays in play until the next turn even when there will be nothing left to draw', async () => {
    const game = createGame({ kingdom: ['Caravan'] });
    game.alice.setHand(['Caravan']);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Caravan');
    expect(game.alice.hand).toEqual([]);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Caravan']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Caravan']);
    await game.endTurn();

    // Discarded in this clean-up, then reshuffled and drawn as the only card
    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.hand).toEqual(['Caravan']);
  });

  it('draws a card for each play at the start of the next turn when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Caravan', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Caravan', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Caravan');
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.actions).toBe(2);
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(7);
  });

  it('keeps the Throne Room that played it in play until the Caravan is discarded', async () => {
    const game = createGame({ kingdom: ['Caravan', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Caravan', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Caravan');
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Throne Room', 'Caravan']);
    await game.endTurn();
    expect(game.alice.inPlay).toEqual(['Throne Room', 'Caravan']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Throne Room', 'Caravan']));
  });

  it('keeps only the Throne Room that played it in play when that Throne Room was played by another Throne Room', async () => {
    const game = createGame({ kingdom: ['Caravan', 'Throne Room', 'Village'] });
    const [, secondThroneRoom, caravan] = game.alice.setHand([
      'Throne Room',
      'Throne Room',
      'Caravan',
      'Village',
      'Copper',
    ]);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Throne Room');
    await game.chooseCard('Caravan');
    await game.chooseCard('Village');
    await game.endTurn();

    expect(game.alice.cards(CardLocation.IN_PLAY).map((card) => card.getId())).toEqual([
      secondThroneRoom.getId(),
      caravan.getId(),
    ]);
  });

  it("draws 3 cards at the start of the next turn when played three times by King's Court", async () => {
    const game = createGame({ kingdom: ['Caravan', "King's Court"] });
    game.alice.setHand(["King's Court", 'Caravan', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(30));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Caravan');
    expect(game.alice.hand).toHaveLength(6);
    expect(game.alice.actions).toBe(3);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(["King's Court", 'Caravan']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(8);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
  });
  it('shuffles the discard pile to draw at the start of the next turn', async () => {
    const game = createGame({ kingdom: ['Caravan'] });
    game.alice.setHand(['Caravan', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', ...coppers(5)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Caravan');
    await game.endTurn();

    // Clean-up drew the last 5 cards of the deck
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toHaveLength(5);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(6);
    expect(game.alice.deck).toHaveLength(4);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Caravan']);
  });
});
