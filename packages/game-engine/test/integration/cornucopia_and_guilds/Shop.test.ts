import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Shop', () => {
  it('cannot play another Shop, because the Shop being played is in play', async () => {
    const game = createGame({ kingdom: ['Shop'] });
    game.alice.setHand(['Shop', 'Shop', 'Village']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Shop');
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).toEqual(['Village']);
    await game.chooseCard('Village');

    expect(game.alice.inPlay).toEqual(['Shop', 'Village']);
    expect(game.alice.actions).toBe(2);
  });

  it('can play a copy of an Action that was played this turn but is no longer in play', async () => {
    const game = createGame({ kingdom: ['Shop', 'Mining Village'] });
    game.alice.setHand(['Mining Village', 'Shop', 'Mining Village']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Mining Village');
    await game.chooseOption('Yes');
    expect(game.trash).toEqual(['Mining Village']);
    await game.playAction('Shop');
    await game.chooseCard('Mining Village');
    await game.chooseOption('No');

    expect(game.alice.inPlay).toEqual(['Shop', 'Mining Village']);
    expect(game.alice.actions).toBe(3);
  });

  it("can't play a copy of a Duration still in play from last turn, and is discarded while a Duration it played stays", async () => {
    const game = createGame({ kingdom: ['Shop', 'Wharf', 'Fishing Village'] });
    game.alice.setHand(['Wharf', 'Copper', 'Copper', 'Copper', 'Copper']);
    // Wharf draws 2; the next hand; Wharf's 2 cards next turn; Shop's card
    game.alice.setDeck(['Copper', 'Copper', 'Shop', 'Wharf', 'Fishing Village', 'Copper', 'Copper', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Wharf');
    await game.endTurn();
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Wharf']);
    await game.playAction('Shop');
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).toEqual(['Fishing Village']);
    await game.chooseCard('Fishing Village');
    expect(game.alice.actions).toBe(2);
    await game.endTurn();

    // The old Wharf is done; Fishing Village stays for its next-turn effect; Shop is discarded
    expect(game.alice.inPlay).toEqual(['Fishing Village']);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Shop', 'Wharf']));
  });

  it('played twice by Throne Room, the second play cannot play a copy of the Action the first play played', async () => {
    const game = createGame({ kingdom: ['Shop', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Shop', 'Village', 'Village', 'Smithy']);
    game.alice.setDeck(coppers(20));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Shop');
    expect(game.pending.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Smithy', 'Village', 'Village']);
    await game.chooseCard('Village');
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).toEqual(['Smithy']);
    await game.chooseCard('Smithy');

    expect(game.alice.inPlay).toEqual(['Throne Room', 'Shop', 'Village', 'Smithy']);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(2);
  });

  it('compares names: with Ruined Village in play, it can play a Ruined Market but not another Ruined Village', async () => {
    const game = createGame({ kingdom: ['Shop'] });
    game.alice.setHand(['Ruined Village', 'Shop', 'Ruined Village', 'Ruined Market']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Ruined Village');
    await game.playAction('Shop');
    game.expectDecision('chooseCard', 'Alice');
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).toEqual(['Ruined Market']);
    await game.chooseCard('Ruined Market');

    expect(game.alice.inPlay).toEqual(['Ruined Village', 'Shop', 'Ruined Market']);
    expect(game.alice.buys).toBe(2);
    // Playing Ruined Market with Shop didn't use an Action
    expect(game.alice.actions).toBe(0);
  });

  it('can play an Action–Treasure Coronet, which then plays an Action and a Treasure twice', async () => {
    const game = createGame({ kingdom: ['Shop'] });
    game.alice.setHand(['Shop', 'Coronet', 'Village', 'Silver']);

    await game.start();
    await game.playAction('Shop');
    await game.chooseCard('Coronet');
    await game.chooseCard('Village');
    await game.chooseCard('Silver');

    expect(game.alice.inPlay).toEqual(['Shop', 'Coronet', 'Village', 'Silver']);
    expect(game.alice.coins).toBe(1 + 4);
    expect(game.alice.actions).toBe(4);
  });
});
