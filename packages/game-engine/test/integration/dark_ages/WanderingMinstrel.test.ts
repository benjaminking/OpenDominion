import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('Wandering Minstrel', () => {
  it('shuffles the discard pile to reveal 3 cards, putting back only the Actions', async () => {
    const game = createGame({ kingdom: ['Wandering Minstrel', 'Village', 'Smithy'] });
    game.alice.setHand(['Wandering Minstrel', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Village']);
    game.alice.setDiscard(['Estate', 'Smithy']);

    await game.start();
    await game.playAction('Wandering Minstrel');

    // Village and Smithy are both Actions with different names, so Alice chooses the order
    const order = game.expectDecision('chooseCard', 'Alice');
    expect(order.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Smithy', 'Village']);
    await game.chooseCard('Smithy');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    expect(game.alice.deck).toEqual(['Village', 'Smithy']);
    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.alice.actions).toBe(2);
  });

  it('discards everything when no Action is revealed, even with fewer than 3 cards left', async () => {
    const game = createGame({ kingdom: ['Wandering Minstrel'] });
    game.alice.setHand(['Wandering Minstrel', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Estate']);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Wandering Minstrel');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.deck).toEqual([]);
    expect([...game.alice.discard].sort()).toEqual(['Estate', 'Gold']);
  });

  it('puts back revealed Action-Treasure and Action-Victory cards, and discards a Tunnel, which can gain a Gold', async () => {
    const game = createGame({ kingdom: ['Wandering Minstrel', 'Mill', 'Tunnel'] });
    game.alice.setHand(['Wandering Minstrel', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Coronet', 'Mill', 'Tunnel', 'Silver', 'Copper']);

    await game.start();
    await game.playAction('Wandering Minstrel');

    // Put Mill back first, so Coronet ends up on top
    const order = game.expectDecision('chooseCard', 'Alice');
    expect(order.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Coronet', 'Mill']);
    await game.chooseCard('Mill');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Tunnel');

    expect(game.alice.deck).toEqual(['Coronet', 'Mill', 'Silver', 'Copper']);
    expect([...game.alice.discard].sort()).toEqual(['Gold', 'Tunnel']);
    expect(game.alice.actions).toBe(2);
  });
  it('puts back Moat (Action-Reaction) and Necropolis (Action-Shelter), and discards Hovel (Reaction-Shelter)', async () => {
    const game = createGame({ kingdom: ['Wandering Minstrel', 'Moat'] });
    game.alice.setHand(['Wandering Minstrel', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Moat', 'Hovel', 'Necropolis', 'Silver']);

    await game.start();
    await game.playAction('Wandering Minstrel');
    const order = game.expectDecision('chooseCard', 'Alice');
    expect(order.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Moat', 'Necropolis']);
    await game.chooseCard('Necropolis');

    expect(game.alice.deck).toEqual(['Moat', 'Necropolis', 'Silver']);
    expect(game.alice.discard).toEqual(['Hovel']);
  });

  it("puts back Dame Josephine (Action-Victory) and a Ruins, and discards Fool's Gold (Treasure-Reaction)", async () => {
    const game = createGame({ kingdom: ['Wandering Minstrel', 'Knights', 'Cultist', "Fool's Gold"] });
    game.alice.setHand(['Wandering Minstrel', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', "Fool's Gold", 'Dame Josephine', 'Ruined Village', 'Silver']);

    await game.start();
    await game.playAction('Wandering Minstrel');
    await game.chooseCard('Dame Josephine');

    expect(game.alice.deck).toEqual(['Ruined Village', 'Dame Josephine', 'Silver']);
    expect(game.alice.discard).toEqual(["Fool's Gold"]);
  });

  it('reveals nothing when the card it draws was the last one', async () => {
    const game = createGame({ kingdom: ['Wandering Minstrel'] });
    game.alice.setHand(['Wandering Minstrel', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver']);

    await game.start();
    await game.playAction('Wandering Minstrel');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.actions).toBe(2);
  });
});
