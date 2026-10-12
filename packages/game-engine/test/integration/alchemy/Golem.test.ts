import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const copies = (name: string, count: number): string[] => Array<string>(count).fill(name);

describe('Golem', () => {
  it('skips revealed Golems, discards the other cards and plays both Actions in the chosen order', async () => {
    const game = createGame({ kingdom: ['Golem', 'Smithy', 'Village'] });
    game.alice.setHand(['Golem', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Golem', 'Estate', 'Smithy', 'Golem', 'Village', 'Silver', ...copies('Estate', 8)]);

    await game.start();
    await game.playAction('Golem');

    // Both Actions must be played: the order is chosen, but declining isn't offered
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Smithy', 'Village']);
    expect(decision.noneAllowed).toBe(false);
    await game.chooseCard('Village');

    // Village drew the Silver; Smithy then drew 3 Estates
    expect(game.alice.inPlay).toEqual(['Golem', 'Village', 'Smithy']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver', 'Estate', 'Estate', 'Estate']);
    expect(game.alice.discard.sort()).toEqual(['Estate', 'Golem', 'Golem']);
    expect(game.alice.actions).toBe(2);
  });

  it('shuffles the discard pile mid-reveal without shuffling in the cards already revealed', async () => {
    const game = createGame({ kingdom: ['Golem', 'Festival'] });
    game.alice.setHand(['Golem', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Festival']);
    game.alice.setDiscard(['Festival', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Golem');

    // Two Festivals: nothing to choose between
    expect(game.alice.inPlay).toEqual(['Golem', 'Festival', 'Festival']);
    expect(game.alice.actions).toBe(4);
    expect(game.alice.buys).toBe(3);
    expect(game.alice.coins).toBe(4);
    // The Estate revealed before the shuffle is discarded afterwards, not shuffled into the new deck
    expect(game.alice.discard).toContain('Estate');
    expect(game.alice.deck).not.toContain('Estate');
    expect([...game.alice.deck, ...game.alice.discard].filter((name) => name === 'Copper')).toHaveLength(3);
  });

  it('plays the only Action it finds after revealing the whole deck and discard pile', async () => {
    const game = createGame({ kingdom: ['Golem', 'Festival'] });
    game.alice.setHand(['Golem', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Festival', 'Estate']);
    game.alice.setDiscard(['Silver']);

    await game.start();
    await game.playAction('Golem');

    expect(game.alice.inPlay).toEqual(['Golem', 'Festival']);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard.sort()).toEqual(['Copper', 'Estate', 'Silver']);
    // Play carries on in the same turn
    expect(game.pending.playerName).toBe('Alice');
  });

  it('discards everything it reveals and carries on with the turn when there are no other Actions', async () => {
    const game = createGame({ kingdom: ['Golem'] });
    game.alice.setHand(['Golem', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Golem', 'Estate', 'Silver']);

    await game.start();
    await game.playAction('Golem');

    expect(game.alice.inPlay).toEqual(['Golem']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard.sort()).toEqual(['Estate', 'Golem', 'Silver']);
    expect(game.alice.actions).toBe(0);
    game.expectDecision('treasurePhase', 'Alice');
  });

  it('plays a Duration card, which stays in play and does its thing at the start of the next turn', async () => {
    const game = createGame({ kingdom: ['Golem', 'Wharf', 'Festival'] });
    game.alice.setHand(['Golem', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Wharf', 'Festival', ...copies('Copper', 20)]);
    game.bob.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Golem');
    await game.chooseCard('Wharf');

    // Wharf: +2 Cards, +1 Buy; Festival: +2 Actions, +1 Buy, +$2
    expect(game.alice.hand).toHaveLength(6);
    expect(game.alice.buys).toBe(3);
    expect(game.alice.actions).toBe(2);
    await game.endTurn();

    // Golem played the Wharf only once, so Golem itself is discarded as usual
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Wharf']);
    expect(game.alice.discard).toContain('Golem');
    await game.endTurn();

    while (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Wharf');
    }
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(7);
    expect(game.alice.buys).toBe(2);
  });

  it("plays a revealed Throne Room, which can't choose the other revealed Action because it isn't in hand", async () => {
    const game = createGame({ kingdom: ['Golem', 'Throne Room', 'Smithy', 'Village'] });
    game.alice.setHand(['Golem', 'Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Throne Room', 'Smithy', ...copies('Estate', 10)]);

    await game.start();
    await game.playAction('Golem');
    await game.chooseCard('Throne Room');

    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.cardChoices.map((choice) => choice.card.name)).toEqual(['Village']);
    await game.chooseCard('Village');

    // Village twice (+2 Cards, +4 Actions), then Smithy (+3 Cards)
    expect(game.alice.inPlay).toEqual(['Golem', 'Throne Room', 'Village', 'Smithy']);
    expect(game.alice.actions).toBe(4);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', ...copies('Estate', 5)]);
  });

  it('reveals and plays two Actions each time when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Golem', 'Throne Room', 'Festival'] });
    game.alice.setHand(['Throne Room', 'Golem', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck([
      'Festival',
      'Estate',
      'Festival',
      'Golem',
      'Festival',
      'Copper',
      'Festival',
      ...copies('Estate', 5),
    ]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Golem');

    expect(game.alice.inPlay).toEqual(['Throne Room', 'Golem', 'Festival', 'Festival', 'Festival', 'Festival']);
    expect(game.alice.actions).toBe(8);
    expect(game.alice.buys).toBe(5);
    expect(game.alice.coins).toBe(8);
    expect(game.alice.discard.sort()).toEqual(['Copper', 'Estate', 'Golem']);
    expect(game.alice.deck).toEqual(copies('Estate', 5));
  });

  it('lets other players react to an Attack it plays', async () => {
    const game = createGame({ kingdom: ['Golem', 'Familiar', 'Festival', 'Guard Dog'] });
    game.alice.setHand(['Golem', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Familiar', 'Festival', ...copies('Estate', 10)]);
    game.bob.setHand(['Guard Dog', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(copies('Silver', 10));

    await game.start();
    await game.playAction('Golem');
    await game.chooseCard('Familiar');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Guard Dog']);
  });

  it('plays a revealed Throne Room on a Duration from hand, then the revealed Duration once; only Golem is discarded', async () => {
    const game = createGame({ kingdom: ['Golem', 'Throne Room', 'Wharf', 'Fishing Village'] });
    game.alice.setHand(['Golem', 'Fishing Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Throne Room', 'Wharf', ...copies('Copper', 20)]);
    game.bob.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Golem');
    await game.chooseCard('Throne Room');
    // Throne Room can't take the revealed Wharf: only the Fishing Village in hand is offered
    const throneRoomChoice = game.expectDecision('chooseCard', 'Alice');
    expect(throneRoomChoice.cardChoices.map((choice) => choice.card.name)).toEqual(['Fishing Village']);
    await game.chooseCard('Fishing Village');

    // Fishing Village twice (+4 Actions, +$2), then Wharf once (+2 Cards, +1 Buy)
    expect(game.alice.inPlay).toEqual(['Golem', 'Throne Room', 'Fishing Village', 'Wharf']);
    expect(game.alice.actions).toBe(4);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.buys).toBe(2);
    expect(game.alice.hand).toHaveLength(5);
    await game.endTurn();

    // Throne Room stays with the Fishing Village it played twice; the Wharf stays by itself
    expect(game.alice.inPlay).toEqual(['Throne Room', 'Fishing Village', 'Wharf']);
    expect(game.alice.discard).toContain('Golem');
    await game.endTurn();

    while (game.pending.kind === 'chooseFromMultipleEvents') {
      const effect = game.pending.mandatoryEffects[0];
      await game.chooseEffect(effect.effectName);
    }
    expect(game.currentPlayerName).toBe('Alice');
    // Fishing Village twice: +2 Actions, +$2; Wharf once: +2 Cards, +1 Buy
    expect(game.alice.actions).toBe(3);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.buys).toBe(2);
    expect(game.alice.hand).toHaveLength(7);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
  });

  it("plays a revealed Band of Misfits, which can't play a Potion-cost Action from the Supply", async () => {
    // The card data names it 'Band Of Misfits'
    const game = createGame({ kingdom: ['Golem', 'Band Of Misfits', 'Familiar', 'Festival', 'Village'] });
    game.alice.setHand(['Golem', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Band Of Misfits', 'Festival', ...copies('Estate', 10)]);
    const villagesBefore = game.pileSize('Village');

    await game.start();
    await game.playAction('Golem');
    await game.chooseCard('Band Of Misfits');

    // Band of Misfits costs $5: a $3P Familiar or $4P Golem doesn't cost less than it
    const offered = game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Village');
    expect(offered).not.toContain('Familiar');
    expect(offered).not.toContain('Golem');
    expect(offered).not.toContain('Festival');
    await game.chooseCard('Village');

    // Village (+1 Card, +2 Actions) from the Supply, then Festival (+2 Actions, +1 Buy, +$2)
    expect(game.pileSize('Village')).toBe(villagesBefore);
    expect(game.alice.inPlay).toEqual(['Golem', 'Band Of Misfits', 'Festival']);
    expect(game.alice.actions).toBe(4);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Estate']);
  });

  it('lets a Moat block an Attack it plays', async () => {
    const game = createGame({ kingdom: ['Golem', 'Militia', 'Festival', 'Moat'] });
    game.alice.setHand(['Golem', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Militia', 'Festival', ...copies('Estate', 10)]);
    game.bob.setHand(['Moat', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Golem');
    await game.chooseCard('Militia');
    await game.chooseEffect('Moat');

    // Bob doesn't discard down to 3; Golem goes on to play the Festival
    expect(game.bob.hand).toHaveLength(5);
    expect(game.alice.inPlay).toEqual(['Golem', 'Militia', 'Festival']);
    expect(game.alice.coins).toBe(4);
    expect(game.pending.playerName).toBe('Alice');
  });

  it('reveals the whole deck and the shuffled discard pile when there are only Golems, then discards everything', async () => {
    const game = createGame({ kingdom: ['Golem'] });
    game.alice.setHand(['Golem', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Golem', 'Estate']);
    game.alice.setDiscard(['Golem', 'Silver']);

    await game.start();
    await game.playAction('Golem');

    // One shuffle only: the revealed cards are discarded at the end, not shuffled in to be revealed again
    expect(game.alice.log.filter((line) => line === 'Alice shuffles.')).toHaveLength(1);
    expect(game.alice.inPlay).toEqual(['Golem']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard.sort()).toEqual(['Estate', 'Golem', 'Golem', 'Silver']);
    game.expectDecision('treasurePhase', 'Alice');
  });

  it('plays a revealed Scrying Pool first, then still plays the other revealed Action', async () => {
    const game = createGame({ kingdom: ['Golem', 'Scrying Pool', 'Smithy', 'Village'] });
    game.alice.setHand(['Golem', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Scrying Pool', 'Smithy', 'Estate', 'Village', 'Silver', ...copies('Gold', 5)]);
    game.bob.setDeck(['Copper', 'Copper']);

    await game.start();
    await game.playAction('Golem');
    await game.chooseCard('Scrying Pool');
    await game.chooseOption('Discard it');
    await game.chooseOption('Put it back');

    // Scrying Pool discarded the Estate and revealed Village and Silver into hand; then Smithy drew 3 Golds
    expect(game.alice.inPlay).toEqual(['Golem', 'Scrying Pool', 'Smithy']);
    expect(game.alice.hand).toEqual([
      'Copper',
      'Copper',
      'Copper',
      'Copper',
      'Village',
      'Silver',
      'Gold',
      'Gold',
      'Gold',
    ]);
    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.alice.deck).toEqual(['Gold', 'Gold']);
  });

  it('plays a revealed Coronet as an Action, which can play an Action and a Treasure from hand twice', async () => {
    const game = createGame({ kingdom: ['Golem', 'Village'] });
    game.alice.setHand(['Golem', 'Village', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(['Coronet', ...copies('Estate', 10)]);

    await game.start();
    await game.playAction('Golem');

    // Coronet is the only Action revealed (it is an Action-Treasure), so it is played
    expect(game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name)).toEqual([
      'Village',
    ]);
    await game.chooseCard('Village');
    await game.chooseCard('Silver');

    expect(game.alice.inPlay).toEqual(['Golem', 'Coronet', 'Village', 'Silver']);
    expect(game.alice.actions).toBe(4);
    expect(game.alice.coins).toBe(4);
    // The 10 revealed Estates were discarded, then shuffled back in for the Villages' draws
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Estate', 'Estate']);
    expect(game.alice.deck).toEqual(copies('Estate', 8));
  });

  it('lets a revealed Tunnel be revealed for a Gold when Golem discards it', async () => {
    const game = createGame({ kingdom: ['Golem', 'Tunnel', 'Festival'] });
    game.alice.setHand(['Golem', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Tunnel', 'Festival', 'Estate', 'Festival', ...copies('Estate', 5)]);

    await game.start();
    await game.playAction('Golem');

    // The revealed Tunnel and Estate are discarded before the Festivals are played
    const decision = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(decision.optionalEffects.map((effect) => effect.effectName)).toEqual(['Tunnel']);
    expect(game.alice.inPlay).toEqual(['Golem']);
    await game.chooseEffect('Tunnel');

    expect(game.alice.discard.sort()).toEqual(['Estate', 'Gold', 'Tunnel']);
    expect(game.alice.inPlay).toEqual(['Golem', 'Festival', 'Festival']);
  });

  it('played twice by Throne Room, leaves the Durations it played in play but Throne Room and Golem are discarded', async () => {
    const game = createGame({ kingdom: ['Golem', 'Throne Room', 'Wharf', 'Festival'] });
    game.alice.setHand(['Throne Room', 'Golem', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Wharf', 'Festival', 'Copper', 'Copper', 'Festival', 'Wharf', ...copies('Copper', 20)]);
    game.bob.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Golem');
    await game.chooseCard('Wharf');
    await game.chooseCard('Wharf');

    expect(game.alice.inPlay).toEqual(['Throne Room', 'Golem', 'Wharf', 'Festival', 'Wharf', 'Festival']);
    expect(game.alice.hand).toEqual(copies('Copper', 7));
    await game.endTurn();

    // Throne Room played Golem (not a Duration) twice; Golem played each Wharf only once
    expect(game.alice.inPlay).toEqual(['Wharf', 'Wharf']);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Throne Room', 'Golem', 'Festival', 'Festival']));
  });

  it('still counts both revealed Actions as owned (for Vineyard) while the order to play them is chosen', async () => {
    const game = createGame({ kingdom: ['Golem', 'Vineyard', 'Village', 'Smithy'] });
    game.alice.setHand(['Golem', 'Vineyard', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Village', 'Copper', 'Smithy', ...copies('Copper', 10)]);

    await game.start();
    await game.playAction('Golem');

    // Golem in play, Village and Smithy revealed: 3 Action cards
    game.expectDecision('chooseCard', 'Alice');
    expect(game.alice.score).toBe(1);
  });

  it('plays a Duration-Attack (Sea Witch): it attacks, stays in play for its next-turn ability, and Golem is discarded', async () => {
    const game = createGame({ kingdom: ['Golem', 'Sea Witch', 'Village'] });
    game.alice.setHand(['Golem', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Sea Witch', 'Village', ...copies('Silver', 20)]);
    game.bob.setHand(copies('Copper', 5));
    game.bob.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Golem');
    await game.chooseCard('Village');

    // Village: +1 Card, +2 Actions; Sea Witch: +2 Cards, and Bob gains a Curse
    expect(game.alice.inPlay).toEqual(['Golem', 'Village', 'Sea Witch']);
    expect(game.alice.hand).toHaveLength(7);
    expect(game.bob.discard).toEqual(['Curse']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Sea Witch']);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Golem', 'Village']));
    await game.endTurn();

    // Sea Witch at the start of Alice's next turn: +2 Cards, then discard 2
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(7);
    await game.chooseCards(['Silver', 'Silver']);
    expect(game.alice.hand).toHaveLength(5);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Sea Witch');
  });

  it("doesn't shuffle the second revealed Action in when the first one it plays shuffles the discard pile", async () => {
    const game = createGame({ kingdom: ['Golem', 'Smithy', 'Village'] });
    game.alice.setHand(['Golem', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Smithy', 'Estate', 'Village']);
    game.alice.setDiscard(['Gold', 'Gold']);

    await game.start();
    await game.playAction('Golem');
    await game.chooseCard('Smithy');

    // Smithy found an empty deck and shuffled the 2 Golds and the Estate Golem discarded; Village then drew nothing
    expect(game.alice.inPlay).toEqual(['Golem', 'Smithy', 'Village']);
    expect(game.alice.hand.sort()).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Estate', 'Gold', 'Gold']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.actions).toBe(2);
  });
});
