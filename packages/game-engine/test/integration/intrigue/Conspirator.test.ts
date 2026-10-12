import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Conspirator', () => {
  it('gives the bonus only on the second play when played by Throne Room (the third Action played)', async () => {
    const game = createGame({ kingdom: ['Conspirator', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Conspirator', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', 'Copper', ...Array<string>(10).fill('Copper')]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Conspirator');

    expect(game.alice.coins).toBe(4);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Gold']);
  });

  it('does not give the bonus as the second Action played', async () => {
    const game = createGame({ kingdom: ['Conspirator'] });
    game.alice.setHand(['Village', 'Conspirator', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Gold', ...Array<string>(10).fill('Copper')]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Conspirator');

    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.hand).not.toContain('Gold');
  });

  it('counts Actions played this turn that are no longer in play', async () => {
    const game = createGame({ kingdom: ['Conspirator', 'Mining Village'] });
    game.alice.setHand(['Mining Village', 'Village', 'Conspirator', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Copper', 'Gold', ...Array<string>(10).fill('Copper')]);

    await game.start();
    await game.playAction('Mining Village');
    await game.chooseOption('Yes');
    await game.playAction('Village');
    await game.playAction('Conspirator');

    expect(game.alice.inPlay).toEqual(['Village', 'Conspirator']);
    expect(game.alice.coins).toBe(4);
    // 1 - 1 + 2 - 1 + 2 - 1 + 1
    expect(game.alice.actions).toBe(3);
    expect(game.alice.hand).toContain('Gold');
  });

  it('does not count Actions played on a previous turn', async () => {
    const game = createGame({ kingdom: ['Conspirator'] });
    game.alice.setHand(['Village', 'Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck([
      'Copper',
      'Copper',
      'Conspirator',
      'Village',
      'Copper',
      'Copper',
      'Copper',
      'Copper',
      'Gold',
      ...Array<string>(10).fill('Copper'),
    ]);
    game.bob.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Village');
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Village');
    await game.playAction('Conspirator');
    expect(game.alice.coins).toBe(2);
    expect(game.alice.hand).not.toContain('Gold');
  });

  it('counts Golem and both Actions it plays', async () => {
    const game = createGame({ kingdom: ['Conspirator', 'Golem'] });
    game.alice.setHand(['Golem', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Village', 'Conspirator', 'Gold', 'Silver', ...coppers(10)]);

    await game.start();
    await game.playAction('Golem');
    await game.chooseCard('Village');

    // Golem, Village, Conspirator: the third Action played
    expect(game.alice.inPlay).toEqual(['Golem', 'Village', 'Conspirator']);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(3);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Gold', 'Silver']);
  });

  it('counts Band of Misfits and the card it plays from the Supply as two Actions played', async () => {
    const game = createGame({ kingdom: ['Conspirator', 'Band Of Misfits'] });
    game.alice.setHand(['Village', 'Band Of Misfits', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', 'Silver', ...coppers(10)]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Conspirator');

    // Village, Band of Misfits, Conspirator (left in the Supply)
    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Gold', 'Silver']);
    expect(game.alice.inPlay).toEqual(['Village', 'Band Of Misfits']);
  });

  it('counts Vassal and the Action it plays from the discard pile', async () => {
    const game = createGame({ kingdom: ['Conspirator', 'Vassal'] });
    game.alice.setHand(['Village', 'Vassal', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', 'Conspirator', 'Silver', ...coppers(10)]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Vassal');
    await game.chooseOption('Yes');

    expect(game.alice.inPlay).toEqual(['Village', 'Vassal', 'Conspirator']);
    expect(game.alice.coins).toBe(4);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Gold', 'Silver']);
  });

  it('does not count a Duration still in play from the previous turn', async () => {
    const game = createGame({ kingdom: ['Conspirator', 'Fishing Village'] });
    game.alice.setHand(['Fishing Village', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Village', 'Conspirator', 'Copper', 'Copper', 'Copper', 'Gold', 'Silver', ...coppers(10)]);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Fishing Village');
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.inPlay).toEqual(['Fishing Village']);
    await game.playAction('Village');
    await game.playAction('Conspirator');

    // Only Village and Conspirator were played this turn
    expect(game.alice.coins).toBe(3);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Gold']);
  });

  it('counts Coronet played in the Buy phase, so the second play of an Action it plays twice is the third', async () => {
    const game = createGame({ kingdom: ['Conspirator'] });
    game.alice.setHand(['Coronet', 'Conspirator', 'Copper']);
    game.alice.setDeck(['Gold', ...coppers(10)]);

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('Conspirator');
    // Decline Coronet's optional Treasure play
    if (game.pending.kind === 'chooseCard') {
      await game.chooseNone();
    }

    expect(game.alice.coins).toBe(4);
    expect(game.alice.hand).toEqual(['Copper', 'Gold']);
  });

  it('does not count Actions played on the turn before an Outpost extra turn', async () => {
    const game = createGame({ kingdom: ['Conspirator', 'Outpost'] });
    game.alice.setHand(['Village', 'Village', 'Outpost', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Copper', 'Conspirator', 'Copper', 'Copper', 'Gold', ...coppers(10)]);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Village');
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(['Conspirator', 'Copper', 'Copper']);
    await game.playAction('Conspirator');
    expect(game.alice.coins).toBe(2);
    expect(game.alice.hand).toEqual(['Copper', 'Copper']);
  });

  it("does not count another player's Guard Dog played during this turn", async () => {
    const game = createGame({ kingdom: ['Conspirator', 'Militia', 'Guard Dog'] });
    game.alice.setHand(['Militia', 'Conspirator', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', ...coppers(10)]);
    game.bob.setHand(['Guard Dog', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start(() => {
      game.alice.player.getStatistics().addActions(1);
    });
    await game.playAction('Militia');
    await game.chooseEffect('Guard Dog');
    await game.chooseCards(['Estate', 'Estate', 'Copper']);
    expect(game.bob.inPlay).toEqual(['Guard Dog']);
    await game.playAction('Conspirator');

    // Alice has played only Militia and Conspirator this turn
    expect(game.alice.coins).toBe(4);
    expect(game.alice.actions).toBe(0);
    expect(game.alice.hand).not.toContain('Gold');
  });

  it("does not count the player's own Guard Dog played during another player's turn", async () => {
    const game = createGame({ kingdom: ['Conspirator', 'Militia', 'Guard Dog'] });
    game.alice.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck([
      'Guard Dog',
      'Village',
      'Conspirator',
      'Copper',
      'Copper',
      'Copper',
      'Copper',
      'Gold',
      ...coppers(10),
    ]);
    game.bob.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endTurn();
    await game.playAction('Militia');
    await game.chooseEffect('Guard Dog');
    await game.chooseCards(['Copper', 'Copper', 'Copper']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(['Village', 'Conspirator', 'Copper']);
    await game.playAction('Village');
    await game.playAction('Conspirator');

    // Only Village and Conspirator count on Alice's own turn
    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.hand).toEqual(['Copper', 'Gold']);
  });

  it('counts a Weaver that the player played on their own turn because Mill discarded it', async () => {
    const game = createGame({ kingdom: ['Conspirator', 'Mill', 'Weaver'] });
    game.alice.setHand(['Mill', 'Weaver', 'Estate', 'Conspirator']);
    game.alice.setDeck(['Copper', 'Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Mill');
    await game.chooseCards(['Weaver', 'Estate']);
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain two Silvers');
    await game.playAction('Conspirator');

    // Mill, Weaver, Conspirator
    expect(game.alice.inPlay).toEqual(['Mill', 'Weaver', 'Conspirator']);
    expect(game.alice.coins).toBe(4);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.hand).toEqual(['Copper', 'Gold']);
  });

  it('counts a Pirate the player played from hand on their own turn when they gained a Treasure', async () => {
    const game = createGame({ kingdom: ['Conspirator', 'Ironworks', 'Pirate'] });
    game.alice.setHand(['Ironworks', 'Pirate', 'Conspirator', 'Copper']);
    game.alice.setDeck(['Gold', ...coppers(10)]);

    await game.start(() => {
      game.alice.player.getStatistics().addActions(1);
    });
    await game.playAction('Ironworks');
    await game.chooseCard('Silver');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Pirate');
    await game.playAction('Conspirator');

    // Ironworks, Pirate, Conspirator; Ironworks gave +$1 for the Silver
    expect(game.alice.inPlay).toEqual(['Ironworks', 'Pirate', 'Conspirator']);
    expect(game.alice.coins).toBe(3);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.hand).toEqual(['Copper', 'Gold']);
  });

  it("gives the bonus on the second and third plays by King's Court", async () => {
    const game = createGame({ kingdom: ['Conspirator', "King's Court"] });
    game.alice.setHand(["King's Court", 'Conspirator', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', ...coppers(10)]);

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Conspirator');

    expect(game.alice.coins).toBe(6);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.hand).toEqual(['Copper', 'Silver', 'Gold']);
  });

  it('still gives +1 Action when there is no card to draw', async () => {
    const game = createGame({ kingdom: ['Conspirator'] });
    game.alice.setHand(['Village', 'Village', 'Conspirator']);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Village');
    await game.playAction('Conspirator');

    expect(game.alice.hand).toEqual([]);
    expect(game.alice.coins).toBe(2);
    // 1 - 1 + 2 - 1 + 2 - 1 + 1
    expect(game.alice.actions).toBe(3);
  });
});
