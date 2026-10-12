import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const KINGDOM = ['Urchin', 'Band Of Misfits', 'Militia', 'Throne Room', 'Rogue', 'Beggar'];
const COPPERS = Array<string>(10).fill('Copper');

describe('Urchin', () => {
  it('may be trashed for a Mercenary when Band of Misfits plays an Attack from the Supply', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Urchin', 'Band Of Misfits', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(COPPERS);
    const militias = game.pileSize('Militia');
    const mercenaries = game.pileSize('Mercenary');

    await game.start();
    await game.playAction('Urchin');
    await game.chooseCards(['Estate']);
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Militia');

    // Before Militia resolves, Alice may trash Urchin
    const trigger = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(trigger.optionalEffects.map((effect) => effect.effectName)).toEqual(['Urchin']);
    expect(game.bob.hand).toHaveLength(4);
    await game.chooseEffect('Urchin');

    // Then Militia resolves
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Estate']);

    expect(game.trash).toEqual(['Urchin']);
    expect(game.alice.discard).toEqual(['Mercenary']);
    expect(game.pileSize('Mercenary')).toBe(mercenaries - 1);
    expect(game.alice.inPlay).toEqual(['Band Of Misfits']);
    expect(game.alice.coins).toBe(2);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
    expect(game.pileSize('Militia')).toBe(militias);
  });

  it('cannot be trashed when Band of Misfits played it from the Supply, since it is not in play', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Village'] });
    game.alice.setHand(['Village', 'Band Of Misfits', 'Militia', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(COPPERS);
    const urchins = game.pileSize('Urchin');

    await game.start();
    await game.playAction('Village');
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Urchin');
    await game.chooseCards(['Estate']);
    await game.playAction('Militia');

    // No Urchin prompt: Bob goes straight to discarding for Militia
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Estate']);
    expect(game.pileSize('Urchin')).toBe(urchins);
    expect(game.trash).toEqual([]);
    expect(game.alice.discard).toEqual([]);
  });

  it('does not offer to trash itself when it is played', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Urchin', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Urchin');
    await game.chooseCards(['Estate']);

    // Straight on to Alice's treasures: no Urchin prompt
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.inPlay).toEqual(['Urchin']);
    expect(game.alice.hand).toHaveLength(5);
    expect(game.trash).toEqual([]);
  });

  it('does not let an Urchin trash itself when it is played a second time by Throne Room', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Throne Room', 'Urchin', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Urchin');
    await game.chooseCards(['Estate']);

    // The second play draws again and attacks again (Bob already has 4), with no Urchin prompt
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.inPlay).toEqual(['Throne Room', 'Urchin']);
    expect(game.trash).toEqual([]);
  });

  it('is offered only once for an Attack after Throne Room played it twice', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Throne Room', 'Urchin', 'Militia', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Urchin');
    await game.playAction('Militia');

    const trigger = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(trigger.optionalEffects.map((effect) => effect.effectName)).toEqual(['Urchin']);
    await game.chooseEffect('Urchin');
    await game.chooseCards(['Copper']);

    expect(game.trash).toEqual(['Urchin']);
    expect(game.alice.discard).toEqual(['Mercenary']);
  });

  it('lets an Urchin be trashed when a second, different Urchin is played', async () => {
    const game = createGame({ kingdom: KINGDOM });
    const [firstUrchin] = game.alice.setHand(['Urchin', 'Urchin', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction(firstUrchin);
    await game.chooseCards(['Estate']);
    await game.playAction('Urchin');

    const trigger = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(trigger.optionalEffects).toHaveLength(1);
    await game.chooseEffect('Urchin');

    expect(game.trash.map((name) => name)).toEqual(['Urchin']);
    expect(game.state.trash.asCardArray()[0].getId()).toBe(firstUrchin.getId());
    expect(game.alice.inPlay).toEqual(['Urchin']);
    expect(game.alice.discard).toEqual(['Mercenary']);
  });

  it('lets each of two Urchins in play be trashed for a Mercenary when another Attack is played', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Urchin', 'Urchin', 'Militia', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Urchin');
    await game.chooseCards(['Estate']);
    await game.playAction('Urchin');
    // Keep the first Urchin when the second is played
    await game.declineEffects();
    await game.playAction('Militia');

    const trigger = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(trigger.optionalEffects.map((effect) => effect.effectName)).toEqual(['Urchin', 'Urchin']);
    await game.chooseEffect('Urchin');
    const secondTrigger = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(secondTrigger.optionalEffects.map((effect) => effect.effectName)).toEqual(['Urchin']);
    await game.chooseEffect('Urchin');
    await game.chooseCards(['Estate']);

    expect(game.trash).toEqual(['Urchin', 'Urchin']);
    expect(game.alice.discard).toEqual(['Mercenary', 'Mercenary']);
    expect(game.alice.inPlay).toEqual(['Militia']);
    expect(game.bob.hand).toHaveLength(3);
  });

  it('is offered for each play of an Attack played twice by Throne Room, until it is trashed', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Urchin', 'Throne Room', 'Militia', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Urchin');
    await game.chooseCards(['Estate']);
    await game.playAction('Throne Room');
    await game.chooseCard('Militia');

    // First play of Militia: decline
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.declineEffects();
    await game.chooseCards(['Estate']);
    expect(game.alice.coins).toBe(2);

    // Second play of Militia: Urchin is still in play, so it is offered again
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Urchin');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.coins).toBe(4);
    expect(game.trash).toEqual(['Urchin']);
    expect(game.alice.discard).toEqual(['Mercenary']);
    expect(game.alice.inPlay).toEqual(['Throne Room', 'Militia']);
  });

  it('is trashed before the Attack resolves, so Rogue can gain it from the trash', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Urchin', 'Rogue', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Urchin');
    await game.playAction('Rogue');
    await game.chooseEffect('Urchin');

    // Rogue finds Urchin ($3) in the trash and must gain it instead of attacking
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.noneAllowed).toBe(false);
    await game.chooseCard('Urchin');

    expect(game.trash).toEqual([]);
    expect(game.alice.discard).toEqual(['Mercenary', 'Urchin']);
    expect(game.alice.coins).toBe(2);
    expect(game.bob.deck.slice(0, 2)).toEqual(['Silver', 'Gold']);
  });

  it('is offered before other players react to the Attack', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Urchin', 'Militia', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Beggar', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Urchin');
    // Bob may react to Urchin itself with Beggar; he keeps it
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.declineEffects();
    await game.playAction('Militia');

    // The player whose turn it is resolves "when you play" abilities first
    expect(game.describePending()).toMatch(/^Alice: chooseFromMultipleEvents/);
    expect(game.pending.optionalEffects.map((effect) => effect.effectName)).toEqual(['Urchin']);
  });

  it('may be trashed when a Duration Attack is played, and the Duration still resolves next turn', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Sea Witch'] });
    game.alice.setHand(['Urchin', 'Sea Witch', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck([...COPPERS, ...COPPERS]);
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Urchin');
    await game.playAction('Sea Witch');
    await game.chooseEffect('Urchin');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Urchin']);
    expect(game.alice.discard).toEqual(['Mercenary']);
    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.alice.hand).toHaveLength(6);

    await game.endTurn();
    expect(game.alice.inPlay).toEqual(['Sea Witch']);
    await game.endTurn();

    // Sea Witch's start-of-turn draw and discard
    game.expectDecision('chooseCards', 'Alice');
    expect(game.alice.hand).toHaveLength(7);
    await game.chooseCards(['Copper', 'Copper']);
    expect(game.alice.hand).toHaveLength(5);
  });

  it('is offered for each different Attack played, and can be kept for a later one', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Village', 'Witch'] });
    game.alice.setHand(['Urchin', 'Village', 'Militia', 'Witch', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Urchin');
    await game.playAction('Village');
    await game.playAction('Militia');
    // Keep Urchin for now
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.declineEffects();
    expect(game.alice.coins).toBe(2);

    await game.playAction('Witch');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Urchin');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Urchin']);
    expect(game.alice.discard).toEqual(['Mercenary']);
    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.alice.inPlay).toEqual(['Village', 'Militia', 'Witch']);
  });

  it('is still trashed when the Mercenary pile is empty, gaining nothing', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Urchin', 'Militia', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);
    game.setPileSize('Mercenary', 0);

    await game.start();
    await game.playAction('Urchin');
    await game.playAction('Militia');
    await game.chooseEffect('Urchin');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Urchin']);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Militia']);
    expect(game.alice.coins).toBe(2);
  });
  it("is not offered when another player plays an Attack (Berserker) during its owner's turn", async () => {
    const game = createGame({ kingdom: ['Urchin', 'Highway', 'Weaver', 'Berserker'] });
    game.alice.setHand(['Highway', 'Urchin', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Estate', ...COPPERS]);
    game.bob.setHand(['Weaver', 'Copper', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Urchin');
    await game.chooseCards(['Weaver']);

    // Bob plays the discarded Weaver and gains a Berserker (costing $4 with Highway), which he then plays
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain a card costing up to $4');
    await game.chooseCard('Berserker');

    // Straight to Bob's Berserker gain: Alice's Urchin is not offered for Bob's Attack
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Silver');
    game.expectDecision('chooseCards', 'Alice');
    await game.chooseCards(['Estate', 'Copper']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.inPlay).toEqual(['Highway', 'Urchin']);
    expect(game.trash).toEqual([]);
    expect(game.alice.discard).toEqual(['Estate', 'Copper']);
    expect(game.bob.inPlay).toEqual(['Weaver', 'Berserker']);
  });

  it('is offered when a Knight (Action-Attack-Knight-Victory) is played, and the Knight still attacks', async () => {
    const game = createGame({ kingdom: ['Urchin', 'Knights'] });
    game.alice.setHand(['Urchin', 'Dame Josephine', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Urchin');
    await game.playAction('Dame Josephine');
    const trigger = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(trigger.optionalEffects.map((effect) => effect.effectName)).toEqual(['Urchin']);
    await game.chooseEffect('Urchin');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Urchin', 'Silver']);
    expect(game.alice.discard).toEqual(['Mercenary']);
    expect(game.alice.inPlay).toEqual(['Dame Josephine']);
  });

  it('is offered when Coronet plays an Attack in the Buy phase, before each play', async () => {
    const game = createGame({ kingdom: ['Urchin', 'Militia'] });
    game.alice.setHand(['Urchin', 'Coronet', 'Militia', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Urchin');
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('Militia');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.declineEffects();
    // Second play of Militia: still offered
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Urchin');
    // Coronet: no Treasure to play twice
    await game.chooseNone();

    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
    expect(game.trash).toEqual(['Urchin']);
    expect(game.alice.discard).toEqual(['Mercenary']);
    expect(game.alice.coins).toBe(4);
  });

  it('makes each other player discard down to 4 in turn order in a 4-player game, and Moat blocks it for one of them', async () => {
    const game = createGame({ kingdom: ['Urchin', 'Moat'], players: ['Alice', 'Bob', 'Cara', 'Dan'] });
    const cara = game.player('Cara');
    const dan = game.player('Dan');
    game.alice.setHand(['Urchin', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Copper', 'Copper']);
    cara.setHand(['Moat', 'Estate', 'Copper', 'Copper', 'Copper']);
    dan.setHand(['Estate', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Urchin');
    game.expectDecision('chooseFromMultipleEvents', 'Cara');
    await game.chooseEffect('Moat');

    const bobDiscard = game.expectDecision('chooseCards', 'Bob');
    expect(bobDiscard.numSelectedEligibility).toEqual([2]);
    await game.chooseCards(['Estate', 'Estate']);
    game.expectDecision('chooseCards', 'Dan');
    await game.chooseCards(['Estate']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.hand).toHaveLength(4);
    expect(cara.hand).toHaveLength(5);
    expect(dan.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper']);
  });
});
