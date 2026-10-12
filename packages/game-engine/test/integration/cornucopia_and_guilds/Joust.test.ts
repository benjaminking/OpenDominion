import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

const REWARDS = ['Coronet', 'Courser', 'Demesne', 'Housecarl', 'Huge Turnip', 'Renown'];

describe('Joust', () => {
  it('uses one of each Reward with 2 players and two of each with 3 or more', () => {
    const twoPlayerGame = createGame({ kingdom: ['Joust'] });
    const threePlayerGame = createGame({ kingdom: ['Joust'], players: ['Alice', 'Bob', 'Cara'] });

    expect(twoPlayerGame.pileSize('Rewards')).toBe(6);
    expect(threePlayerGame.pileSize('Rewards')).toBe(12);
  });

  it('gains the chosen Reward to hand, where it can be played, and discards the Province in Clean-up', async () => {
    const game = createGame({ kingdom: ['Joust'] });
    game.alice.setHand(['Joust', 'Province', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    const rewardsBefore = game.pileSize('Rewards');

    await game.start();
    await game.playAction('Joust');
    await game.chooseCard('Province');
    expect(game.pending.cardChoices.map((choice) => choice.card.name).sort()).toEqual(REWARDS);
    await game.chooseCard('Courser');

    expect(game.alice.hand).toContain('Courser');
    expect(game.alice.setAside).toEqual(['Province']);
    expect(game.pileSize('Rewards')).toBe(rewardsBefore - 1);

    await game.playAction('Courser');
    await game.chooseOptions(['+2 Cards', '+$2']);
    expect(game.alice.coins).toBe(3);
    await game.endTurn();

    expect(game.alice.setAside).toEqual([]);
    expect(game.alice.discard).toContain('Province');
    expect(game.alice.discard).toContain('Courser');
  });

  it('can still set aside a Province when the Rewards pile is empty, and discards it in Clean-up', async () => {
    const game = createGame({ kingdom: ['Joust'] });
    game.alice.setHand(['Joust', 'Province', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.setPileSize('Rewards', 0);

    await game.start();
    await game.playAction('Joust');
    await game.chooseCard('Province');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.setAside).toEqual(['Province']);
    expect(game.alice.hand).not.toContain('Province');

    await game.endTurn();
    expect(game.alice.setAside).toEqual([]);
    expect(game.alice.discard).toContain('Province');
  });

  it('when played twice by Coronet, discards both set-aside Provinces in Clean-up', async () => {
    const game = createGame({ kingdom: ['Joust'] });
    game.alice.setHand(['Coronet', 'Joust', 'Province', 'Province', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setDeck(coppers(5));

    await game.start();
    await game.playAction('Coronet');
    await game.chooseCard('Joust');
    await game.chooseCard('Province');
    await game.chooseCard('Courser');
    await game.chooseCard('Province');
    await game.chooseCard('Demesne');
    expect(game.alice.setAside).toEqual(['Province', 'Province']);
    // Decline Coronet's optional Treasure play
    await game.chooseNone();
    await game.endTurn();

    expect(game.alice.setAside).toEqual([]);
    expect(game.alice.discard.filter((name) => name === 'Province')).toHaveLength(2);
  });

  it('Rewards are not in the Supply, so they cannot be bought', async () => {
    const game = createGame({ kingdom: ['Joust'] });
    game.alice.setHand(['Gold', 'Gold', 'Gold']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAllTreasures();

    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Gold');
    for (const reward of REWARDS) {
      expect(offered).not.toContain(reward);
    }
  });

  it('played twice by Throne Room, offers each Reward left once per name, so a second copy can be taken', async () => {
    const game = createGame({ kingdom: ['Joust', 'Throne Room'], players: ['Alice', 'Bob', 'Cara'] });
    game.setPile('Rewards', ['Courser', 'Courser', 'Renown']);
    game.alice.setHand(['Throne Room', 'Joust', 'Province', 'Province', 'Copper']);
    game.alice.setDeck(coppers(20));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Joust');
    await game.chooseCard('Province');
    expect(game.pending.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Courser', 'Renown']);
    await game.chooseCard('Courser');
    await game.chooseCard('Province');
    expect(game.pending.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Courser', 'Renown']);
    await game.chooseCard('Courser');

    expect(game.alice.hand.filter((name) => name === 'Courser')).toHaveLength(2);
    expect(game.pileCards('Rewards')).toEqual(['Renown']);
    expect(game.alice.coins).toBe(2);
    await game.endTurn();

    expect(game.alice.setAside).toEqual([]);
    expect(game.alice.discard.filter((name) => name === 'Province')).toHaveLength(2);
  });

  it('an empty Rewards pile is not a Supply pile, so it does not count towards the game end', async () => {
    const game = createGame({ kingdom: ['Joust'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(coppers(10));
    game.setPileSize('Rewards', 0);
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);

    await game.start();
    await game.endTurn();

    expect(game.isFinished).toBe(false);
    expect(game.currentPlayerName).toBe('Bob');
  });

  it('draws before setting aside, so the Province it draws can be set aside', async () => {
    const game = createGame({ kingdom: ['Joust'] });
    game.alice.setHand(['Joust', 'Copper']);
    game.alice.setDeck(['Province', ...coppers(10)]);

    await game.start();
    await game.playAction('Joust');
    game.expectDecision('chooseCard', 'Alice');
    await game.chooseCard('Province');
    await game.chooseCard('Renown');

    expect(game.alice.setAside).toEqual(['Province']);
    expect(game.alice.hand).toEqual(['Copper', 'Renown']);
    // The set-aside Province is still Alice's, so it still scores
    expect(game.alice.score).toBe(6);
  });

  it('played twice by Throne Room with one Province, gains only one Reward', async () => {
    const game = createGame({ kingdom: ['Joust', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Joust', 'Province']);
    game.alice.setDeck(coppers(10));
    const rewards = game.pileSize('Rewards');

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Joust');
    await game.chooseCard('Province');
    await game.chooseCard('Courser');

    // Second play: no Province left in hand
    game.expectDecision('actionPhase', 'Alice');
    expect(game.pileSize('Rewards')).toBe(rewards - 1);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.hand).toEqual(['Copper', 'Courser', 'Copper']);
    await game.endTurn();

    expect(game.alice.setAside).toEqual([]);
    expect(game.alice.discard.filter((name) => name === 'Province')).toHaveLength(1);
  });
});
