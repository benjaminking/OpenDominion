import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

// Alice plays Market and three Coppers, buys Farmhands and sets aside the given card from her hand.
const buyFarmhandsSettingAside = async (game: GameHarness, cardToSetAside: string): Promise<void> => {
  await game.start();
  await game.playAction('Market');
  if (game.pending.kind === 'actionPhase') {
    await game.endActionPhase();
  }
  await game.playTreasure('Copper');
  await game.playTreasure('Copper');
  await game.playTreasure('Copper');
  await game.endTreasurePhase();
  await game.buy('Farmhands');
  if (game.pending.kind === 'chooseFromMultipleEvents') {
    await game.chooseEffect('Farmhands');
  }
  await game.chooseCard(cardToSetAside);
  expect(game.alice.setAside).toEqual([cardToSetAside]);
  await game.endBuyPhase();
  // Bob's turn
  await game.endTurn();
};

describe('Farmhands', () => {
  it('when bought, sets aside a Treasure from hand and plays it at the start of the next turn', async () => {
    const game = createGame({ kingdom: ['Farmhands'] });
    game.alice.setHand(['Market', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));

    await buyFarmhandsSettingAside(game, 'Gold');

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.setAside).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Gold']);
    expect(game.alice.coins).toBe(3);
  });

  it('plays a set-aside Action at the start of the next turn without using an Action', async () => {
    const game = createGame({ kingdom: ['Farmhands'] });
    game.alice.setHand(['Market', 'Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));

    await buyFarmhandsSettingAside(game, 'Village');

    expect(game.alice.inPlay).toEqual(['Village']);
    expect(game.alice.actions).toBe(3);
    expect(game.alice.hand).toHaveLength(6);
  });

  it('plays a set-aside Attack at the start of the next turn, letting other players react to it', async () => {
    const game = createGame({ kingdom: ['Farmhands', 'Militia', 'Beggar'] });
    game.alice.setHand(['Market', 'Militia', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setDeck(['Beggar', 'Copper', 'Copper', 'Estate', 'Estate', ...coppers(5)]);

    await buyFarmhandsSettingAside(game, 'Militia');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toContain('Beggar');
  });

  it('a set-aside Duration is played at the start of the next turn, and stays in play until the turn after', async () => {
    const game = createGame({ kingdom: ['Farmhands', 'Wharf'] });
    game.alice.setHand(['Market', 'Wharf', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(30));

    await buyFarmhandsSettingAside(game, 'Wharf');

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.inPlay).toEqual(['Wharf']);
    expect(game.alice.hand).toHaveLength(5 + 2);
    expect(game.alice.buys).toBe(2);
    await game.endTurn();

    // Wharf's own Duration effect is still to come
    expect(game.alice.inPlay).toEqual(['Wharf']);
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(5 + 2);
    expect(game.alice.buys).toBe(2);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Wharf');
  });

  it('two Farmhands gained by overpaying for Stonemason each set aside a card, and both are played next turn', async () => {
    const game = createGame({ kingdom: ['Farmhands', 'Stonemason'] });
    game.alice.setHand(['Gold', 'Gold', 'Gold', 'Village', 'Smithy']);
    game.alice.setDeck(coppers(30));

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Stonemason');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Stonemason');
    }
    await game.chooseOption('$4');
    await game.chooseCard('Farmhands');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Farmhands');
    }
    await game.chooseCard('Village');
    await game.chooseCard('Farmhands');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Farmhands');
    }
    await game.chooseCard('Smithy');
    expect(game.alice.setAside.sort()).toEqual(['Smithy', 'Village']);
    // Bob's turn
    await game.endTurn();

    while (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Farmhands');
    }
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.setAside).toEqual([]);
    expect(game.alice.inPlay.sort()).toEqual(['Smithy', 'Village']);
    expect(game.alice.hand).toHaveLength(5 + 1 + 3);
    expect(game.alice.actions).toBe(3);
  });

  it('a set-aside Throne Room is played at the start of the next turn and plays an Action from the new hand twice', async () => {
    const game = createGame({ kingdom: ['Farmhands', 'Throne Room'] });
    game.alice.setHand(['Market', 'Throne Room', 'Copper', 'Copper', 'Copper']);
    // Market draws 1; the next hand is Village and 4 Coppers
    game.alice.setDeck(['Copper', 'Village', ...coppers(30)]);

    await buyFarmhandsSettingAside(game, 'Throne Room');

    game.expectDecision('chooseCard', 'Alice');
    await game.chooseCard('Village');
    expect(game.alice.inPlay).toEqual(['Throne Room', 'Village']);
    expect(game.alice.actions).toBe(5);
    expect(game.alice.hand).toHaveLength(4 + 2);
  });

  it('a set-aside Hamlet played at the start of the next turn can discard a Tunnel, which is not a Clean-up discard', async () => {
    const game = createGame({ kingdom: ['Farmhands', 'Hamlet', 'Tunnel'] });
    game.alice.setHand(['Market', 'Hamlet', 'Copper', 'Copper', 'Copper']);
    // Market draws 1; the next hand has a Tunnel; Hamlet draws 1
    game.alice.setDeck(['Copper', 'Tunnel', 'Copper', 'Copper', 'Copper', 'Copper', ...coppers(20)]);

    await buyFarmhandsSettingAside(game, 'Hamlet');

    expect(game.alice.inPlay).toEqual(['Hamlet']);
    await game.chooseCard('Tunnel');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Tunnel');

    expect(game.alice.discard).toEqual(expect.arrayContaining(['Tunnel', 'Gold']));
  });

  it('bought on a turn Outpost was played, plays the set-aside card at the start of the Outpost extra turn', async () => {
    const game = createGame({ kingdom: ['Farmhands', 'Outpost'] });
    game.alice.setHand(['Village', 'Outpost', 'Gold', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Outpost');
    await game.playTreasure('Silver');
    await game.playTreasure('Copper');
    await game.playTreasure('Copper');
    await game.endTreasurePhase();
    await game.buy('Farmhands');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Farmhands');
    }
    await game.chooseCard('Gold');
    expect(game.alice.setAside).toEqual(['Gold']);
    if (game.pending.kind === 'chooseExtraTurns') {
      await game.chooseExtraTurn('Outpost');
    }

    expect(game.currentPlayerName).toBe('Alice');
    // Outpost's and Farmhands' start-of-turn effects, in either order
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Farmhands');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Outpost');
    }
    expect(game.alice.setAside).toEqual([]);
    expect(game.alice.inPlay.sort()).toEqual(['Gold', 'Outpost']);
    expect(game.alice.coins).toBe(3);
    expect(game.alice.hand).toHaveLength(3);
  });

  it("gained on another player's turn (Bob's Weaver discarded to Militia), plays the card at the start of Bob's turn", async () => {
    const game = createGame({ kingdom: ['Farmhands', 'Militia', 'Weaver'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Weaver', 'Silver', 'Copper', 'Estate', 'Estate']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Militia');
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Weaver', 'Estate']);
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain a card costing up to $4');
    await game.chooseCard('Farmhands');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Farmhands');
    }
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Silver');
    expect(game.bob.setAside).toEqual(['Silver']);
    expect(game.bob.hand).toEqual(['Copper', 'Estate']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.bob.setAside).toEqual([]);
    expect(game.bob.inPlay).toEqual(['Silver']);
    expect(game.bob.coins).toBe(2);
  });

  it('a set-aside Workshop that gains a card at the start of the turn draws a card with Footpad in the game', async () => {
    const game = createGame({ kingdom: ['Farmhands', 'Footpad', 'Workshop'] });
    game.alice.setHand(['Market', 'Workshop', 'Copper', 'Copper', 'Copper']);
    // Market draws 1; then the next hand of 5 Coppers; then Footpad's card
    game.alice.setDeck(['Copper', ...coppers(5), 'Gold', ...coppers(10)]);

    await buyFarmhandsSettingAside(game, 'Workshop');

    // Start of Alice's turn: Workshop is played and gains a Silver
    await game.chooseCard('Silver');
    expect(game.alice.inPlay).toEqual(['Workshop']);
    expect(game.alice.hand).toEqual([...coppers(5), 'Gold']);
  });

  it('can set aside an Action–Treasure, a Treasure–Victory or an Action–Victory card, but not a Victory card', async () => {
    const game = createGame({ kingdom: ['Farmhands', 'Farm', 'Mill'] });
    game.alice.setHand(['Market', 'Coronet', 'Farm', 'Mill', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));

    await game.start();
    await game.playAction('Market');
    await game.endActionPhase();
    await game.playTreasure('Copper');
    await game.playTreasure('Copper');
    await game.playTreasure('Copper');
    await game.endTreasurePhase();
    await game.buy('Farmhands');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Farmhands');
    }
    game.expectDecision('chooseCard', 'Alice');
    expect(game.pending.cardChoices.map((choice) => choice.card.name).sort()).toEqual([
      'Copper',
      'Coronet',
      'Farm',
      'Mill',
    ]);
    await game.chooseCard('Farm');
    await game.endBuyPhase();
    await game.endTurn();

    // The Farm is played as a Treasure at the start of Alice's turn
    expect(game.alice.inPlay).toEqual(['Farm']);
    expect(game.alice.coins).toBe(2);
  });

  it('gained with nothing in hand, offers nothing to set aside', async () => {
    const game = createGame({ kingdom: ['Farmhands'] });
    game.alice.setHand(['Gold', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAllTreasures();
    await game.buy('Farmhands');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Farmhands');
    }

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.setAside).toEqual([]);
    expect(game.alice.discard).toContain('Farmhands');
  });
});
