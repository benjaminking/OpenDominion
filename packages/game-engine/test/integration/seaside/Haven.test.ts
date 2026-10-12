import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, resolveEffects } from './seasideHelpers';

describe('Haven', () => {
  it('puts the set-aside card into hand at the start of the next turn and stays in play until then', async () => {
    const game = createGame({ kingdom: ['Haven'] });
    game.alice.setHand(['Haven', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Haven');
    // Setting a card aside is mandatory
    expect(game.expectDecision('chooseCard', 'Alice').noneAllowed).toBe(false);
    await game.chooseCard('Gold');
    expect(game.alice.setAside).toEqual(['Gold']);
    expect(game.alice.hand).not.toContain('Gold');
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Haven']);
    expect(game.alice.setAside).toEqual(['Gold']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toContain('Gold');
    expect(game.alice.setAside).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Haven']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Haven');
  });

  it('sets nothing aside with an empty hand and is discarded in the same clean-up', async () => {
    const game = createGame({ kingdom: ['Haven'] });
    game.alice.setHand(['Haven']);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Haven');
    expect(game.alice.setAside).toEqual([]);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual([]);
    // Discarded in clean-up, then reshuffled and drawn as the only card
    expect(game.alice.hand).toEqual(['Haven']);
  });

  it('sets aside a card for each play and returns both when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Haven', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Haven', 'Gold', 'Silver', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Haven');
    await game.chooseCard('Gold');
    await game.chooseCard('Silver');
    expect(game.alice.setAside).toEqual(['Gold', 'Silver']);
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(expect.arrayContaining(['Gold', 'Silver']));
    expect(game.alice.setAside).toEqual([]);
  });

  it('keeps the set-aside card out of a reshuffle during clean-up', async () => {
    const game = createGame({ kingdom: ['Haven'] });
    game.alice.setHand(['Haven', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Silver']);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Haven');
    await game.chooseCard('Gold');
    await game.endTurn();

    // The Silver, then the 4 discarded Coppers after shuffling; the Gold stays set aside
    expect(game.alice.hand.sort()).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.setAside).toEqual(['Gold']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(6);
    expect(game.alice.hand).toContain('Gold');
  });

  it('counts the set-aside card for scoring if the game ends before it returns', async () => {
    const game = createGame({ kingdom: ['Haven'] });
    game.alice.setHand(['Haven', 'Province', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Province', 0);

    await game.start();
    await game.playAction('Haven');
    await game.chooseCard('Province');
    await game.endTurn();

    expect(game.isFinished).toBe(true);
    expect(game.alice.setAside).toEqual(['Province']);
    expect(game.alice.score).toBe(6);
  });
  it('still sets aside a card when there is nothing to draw', async () => {
    const game = createGame({ kingdom: ['Haven'] });
    game.alice.setHand(['Haven', 'Gold']);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Haven');
    expect(game.alice.hand).toEqual(['Gold']);
    expect(game.alice.actions).toBe(1);
    await game.chooseCard('Gold');
    expect(game.alice.setAside).toEqual(['Gold']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Haven']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(['Gold']);
  });

  it("sets aside a card on each play it can when played three times by King's Court, returning them all", async () => {
    const game = createGame({ kingdom: ['Haven', "King's Court"] });
    game.alice.setHand(["King's Court", 'Haven', 'Gold', 'Silver']);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Haven');
    await game.chooseCard('Gold');
    await game.chooseCard('Silver');
    // The third play has nothing to draw or set aside
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.setAside).toEqual(['Gold', 'Silver']);
    expect(game.alice.actions).toBe(3);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(["King's Court", 'Haven']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(['Gold', 'Silver']);
    expect(game.alice.setAside).toEqual([]);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
  });

  it("played on an Outpost turn, keeps its card set aside through the next player's turn", async () => {
    const game = createGame({ kingdom: ['Haven', 'Outpost'] });
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Haven', 'Gold', 'Copper', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);

    await game.playAction('Haven');
    await game.chooseCard('Gold');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.setAside).toEqual(['Gold']);
    expect(game.alice.inPlay).toEqual(['Haven']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(6);
    expect(game.alice.hand).toContain('Gold');
    expect(game.alice.setAside).toEqual([]);
  });
});
