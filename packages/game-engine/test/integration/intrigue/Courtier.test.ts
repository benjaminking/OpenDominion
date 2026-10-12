import { describe, expect, it, vi } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Courtier', () => {
  it('gives two different choices for a card with two types (Mill)', async () => {
    const game = createGame({ kingdom: ['Courtier', 'Mill'] });
    game.alice.setHand(['Courtier', 'Mill', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.playAction('Courtier');
    await game.chooseCard('Mill');

    const decision = game.expectDecision('chooseMultipleOptions', 'Alice');
    expect(decision.numToSelect).toBe(2);
    expect(decision.options).toEqual(['+1 Action', '+1 Buy', '+$3', 'Gain a Gold']);
    await game.chooseOptions(['+1 Action', 'Gain a Gold']);

    expect(game.alice.actions).toBe(1);
    expect(game.alice.buys).toBe(1);
    expect(game.alice.coins).toBe(0);
    expect(game.alice.discard).toEqual(['Gold']);
    // The revealed card stays in hand
    expect(game.alice.hand).toContain('Mill');
  });

  it('counts each type of an Action-Attack card', async () => {
    const game = createGame({ kingdom: ['Courtier', 'Minion'] });
    game.alice.setHand(['Courtier', 'Minion', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.playAction('Courtier');
    await game.chooseCard('Minion');

    expect(game.expectDecision('chooseMultipleOptions', 'Alice').numToSelect).toBe(2);
    await game.chooseOptions(['+1 Buy', '+$3']);
    expect(game.alice.buys).toBe(2);
    expect(game.alice.coins).toBe(3);
  });

  it('gives no bonus when there is no card in hand to reveal', async () => {
    const game = createGame({ kingdom: ['Courtier'] });
    game.alice.setHand(['Courtier']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.playAction('Courtier');

    expect(game.pending.kind).not.toBe('chooseMultipleOptions');
    expect(game.alice.coins).toBe(0);
    expect(game.alice.discard).toEqual([]);
  });

  it('gains nothing for "gain a Gold" when the Gold pile is empty', async () => {
    const game = createGame({ kingdom: ['Courtier'] });
    game.alice.setHand(['Courtier', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.setPileSize('Gold', 0);

    await game.start();
    await game.playAction('Courtier');
    // A single card in hand: it is revealed
    if (game.pending.kind === 'chooseCard') {
      await game.chooseCard('Copper');
    }
    await game.chooseOptions(['Gain a Gold']);

    expect(game.alice.discard).toEqual([]);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('gives all 4 bonuses for a card with 4 types (Dame Josephine)', async () => {
    const game = createGame({ kingdom: ['Courtier', 'Knights'] });
    game.alice.setHand(['Courtier', 'Dame Josephine', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Courtier');
    await game.chooseCard('Dame Josephine');

    expect(game.expectDecision('chooseMultipleOptions', 'Alice').numToSelect).toBe(4);
    await game.chooseOptions(['+1 Action', '+1 Buy', '+$3', 'Gain a Gold']);

    expect(game.alice.actions).toBe(1);
    expect(game.alice.buys).toBe(2);
    expect(game.alice.coins).toBe(3);
    expect(game.alice.discard).toEqual(['Gold']);
    expect(game.alice.hand).toEqual(['Dame Josephine', 'Copper']);
  });

  it('gives 3 choices for an Action-Treasure-Reward card (Coronet)', async () => {
    const game = createGame({ kingdom: ['Courtier'] });
    game.alice.setHand(['Courtier', 'Coronet', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Courtier');
    await game.chooseCard('Coronet');

    expect(game.expectDecision('chooseMultipleOptions', 'Alice').numToSelect).toBe(3);
    await game.chooseOptions(['+1 Action', '+1 Buy', '+$3']);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.buys).toBe(2);
    expect(game.alice.coins).toBe(3);
  });

  it('counts the Shelter type: Overgrown Estate gives 2 choices', async () => {
    const game = createGame({ kingdom: ['Courtier'], useShelters: true });
    game.alice.setHand(['Courtier', 'Overgrown Estate', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Courtier');
    await game.chooseCard('Overgrown Estate');

    expect(game.expectDecision('chooseMultipleOptions', 'Alice').numToSelect).toBe(2);
  });

  it('gives a single choice for a Curse', async () => {
    const game = createGame({ kingdom: ['Courtier'] });
    game.alice.setHand(['Courtier', 'Curse', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Courtier');
    await game.chooseCard('Curse');

    expect(game.expectDecision('chooseMultipleOptions', 'Alice').numToSelect).toBe(1);
    await game.chooseOptions(['+$3']);
    expect(game.alice.coins).toBe(3);
  });

  it('may reveal the same card for both plays by Throne Room and choose the same bonuses again', async () => {
    const game = createGame({ kingdom: ['Courtier', 'Throne Room', 'Mill'] });
    game.alice.setHand(['Throne Room', 'Courtier', 'Mill', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Courtier');
    await game.chooseCard('Mill');
    await game.chooseOptions(['+$3', 'Gain a Gold']);
    await game.chooseCard('Mill');
    await game.chooseOptions(['+$3', 'Gain a Gold']);

    expect(game.alice.coins).toBe(6);
    expect(game.alice.discard).toEqual(['Gold', 'Gold']);
    expect(game.alice.hand).toEqual(['Mill', 'Copper']);
  });

  it('resolves the chosen bonuses in the order printed on the card, whatever order they were picked in', async () => {
    const game = createGame({ kingdom: ['Courtier', 'Knights'] });
    game.alice.setHand(['Courtier', 'Dame Josephine', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    const ie = game.alice.ie;
    const addActions = vi.spyOn(ie, 'addActions');
    const addBuys = vi.spyOn(ie, 'addBuys');
    const addCoins = vi.spyOn(ie, 'addCoins');
    const gainFromPile = vi.spyOn(ie, 'gainFromPile');
    await game.playAction('Courtier');
    await game.chooseCard('Dame Josephine');
    await game.chooseOptions(['Gain a Gold', '+$3', '+1 Buy', '+1 Action']);

    const order = [addActions, addBuys, addCoins, gainFromPile].map((spy) => spy.mock.invocationCallOrder[0]);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(game.alice.discard).toEqual(['Gold']);
  });

  it('does not give the same bonus twice: the choices must be different', async () => {
    const game = createGame({ kingdom: ['Courtier', 'Mill'] });
    game.alice.setHand(['Courtier', 'Mill', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Courtier');
    await game.chooseCard('Mill');
    await game.chooseOptions(['+$3', '+$3']);

    expect(game.alice.coins).toBe(3);
  });

  it.each([
    { card: 'Sir Martin', kingdom: ['Knights'], types: 3, shelters: false },
    { card: 'Clerk', kingdom: ['Clerk'], types: 3, shelters: false },
    { card: 'Pirate', kingdom: ['Pirate'], types: 3, shelters: false },
    { card: 'Astrolabe', kingdom: ['Astrolabe'], types: 2, shelters: false },
    { card: "Fool's Gold", kingdom: ["Fool's Gold"], types: 2, shelters: false },
    { card: 'Ruined Village', kingdom: ['Cultist'], types: 2, shelters: false },
    { card: 'Hovel', kingdom: [], types: 2, shelters: true },
    { card: 'Necropolis', kingdom: [], types: 2, shelters: true },
    { card: 'Curse', kingdom: ['Charlatan'], types: 2, shelters: false },
    { card: 'Potion', kingdom: ['Familiar'], types: 1, shelters: false },
  ])('gives $types choices for $card', async ({ card, kingdom, types, shelters }) => {
    const game = createGame({ kingdom: ['Courtier', ...kingdom], useShelters: shelters });
    game.alice.setHand(['Courtier', 'Copper']);
    game.alice.setDeck(coppers(10));
    const revealed = game.alice.addToHand(card === 'Curse' ? 'Charlatan Curse' : card);

    await game.start();
    // Clerk may be played at the start of the turn
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.declineEffects();
    }
    await game.playAction('Courtier');
    await game.chooseCard(revealed);

    expect(game.expectDecision('chooseMultipleOptions', 'Alice').numToSelect).toBe(types);
  });

  it('can gain the last Gold as the third empty Supply pile, ending the game after the turn', async () => {
    const game = createGame({ kingdom: ['Courtier', 'Village', 'Smithy'] });
    game.alice.setHand(['Courtier', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);
    game.setPileSize('Gold', 1);

    await game.start();
    await game.playAction('Courtier');
    await game.chooseCard('Copper');
    await game.chooseOptions(['Gain a Gold']);

    expect(game.alice.discard).toEqual(['Gold']);
    expect(game.isFinished).toBe(false);
    await game.endTurn();
    expect(game.isFinished).toBe(true);
  });
});
