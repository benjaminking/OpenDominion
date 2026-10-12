import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';
import { limbo } from './baseGameHelpers';

const coppers = (n: number): string[] => Array<string>(n).fill('Copper');

const resolveStartOfTurnEffects = async (game: GameHarness, cardName: string): Promise<void> => {
  while (game.pending.kind === 'chooseFromMultipleEvents') {
    await game.chooseEffect(cardName);
  }
};

describe('Vassal', () => {
  it('may play a discarded Action card without using up an Action', async () => {
    const game = createGame({ kingdom: ['Vassal', 'Village'] });
    game.alice.setHand(['Vassal', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Village', ...coppers(10)]);

    await game.start();
    await game.playAction('Vassal');
    expect(game.alice.discard).toEqual(['Village']);
    expect(game.expectDecision('chooseOneOption', 'Alice').options).toEqual(['Yes', 'No']);
    await game.chooseOption('Yes');

    expect(game.alice.inPlay).toEqual(['Vassal', 'Village']);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.coins).toBe(2);
  });

  it('leaves the discarded Action card in the discard pile when declined', async () => {
    const game = createGame({ kingdom: ['Vassal', 'Smithy'] });
    game.alice.setHand(['Vassal', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Smithy', ...coppers(10)]);

    await game.start();
    await game.playAction('Vassal');
    await game.chooseOption('No');

    expect(game.alice.discard).toEqual(['Smithy']);
    expect(game.alice.inPlay).toEqual(['Vassal']);
    expect(game.alice.hand).toHaveLength(4);
  });

  it('shuffles the discard pile when the deck is empty, then discards the new top card', async () => {
    const game = createGame({ kingdom: ['Vassal', 'Village'] });
    game.alice.setHand(['Vassal', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDiscard(['Village']);

    await game.start();
    await game.playAction('Vassal');
    await game.chooseOption('Yes');

    expect(game.alice.inPlay).toEqual(['Vassal', 'Village']);
    expect(game.alice.actions).toBe(2);
  });

  it('plays a Duration that stays in play, while Vassal itself is discarded the same turn', async () => {
    const game = createGame({ kingdom: ['Vassal', 'Wharf'] });
    game.alice.setHand(['Vassal', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Wharf', ...coppers(30)]);

    await game.start();
    await game.playAction('Vassal');
    await game.chooseOption('Yes');
    expect(game.alice.hand).toHaveLength(4 + 2);
    expect(game.alice.buys).toBe(2);
    await game.endTurn();

    // A card that plays a Duration only once never stays in play with it (wiki, Duration)
    expect(game.alice.inPlay).toEqual(['Wharf']);
    expect(game.alice.discard).toContain('Vassal');

    await game.endTurn();
    await resolveStartOfTurnEffects(game, 'Wharf');
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(5 + 2);
    expect(game.alice.buys).toBe(2);
    await game.endTurn();
    expect(game.alice.inPlay).toEqual([]);
  });

  it('plays a discarded card that trashes itself', async () => {
    const game = createGame({ kingdom: ['Vassal', 'Mining Village'] });
    game.alice.setHand(['Vassal', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Mining Village', ...coppers(10)]);

    await game.start();
    await game.playAction('Vassal');
    await game.chooseOption('Yes');
    await game.chooseOption('Yes');

    expect(game.trash).toEqual(['Mining Village']);
    expect(game.alice.inPlay).toEqual(['Vassal']);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.coins).toBe(4);
    expect(game.alice.actions).toBe(2);
  });

  it('plays a discarded Throne Room, which then plays an Action card from hand twice', async () => {
    const game = createGame({ kingdom: ['Vassal', 'Throne Room', 'Village'] });
    game.alice.setHand(['Vassal', 'Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Throne Room', ...coppers(10)]);

    await game.start();
    await game.playAction('Vassal');
    await game.chooseOption('Yes');
    await game.chooseCard('Village');

    expect(game.alice.inPlay).toEqual(['Vassal', 'Throne Room', 'Village']);
    expect(game.alice.hand).toHaveLength(3 + 2);
    expect(game.alice.actions).toBe(4);
  });

  it('is played twice by Throne Room, discarding and playing a card each time', async () => {
    const game = createGame({ kingdom: ['Vassal', 'Throne Room', 'Village', 'Smithy'] });
    game.alice.setHand(['Throne Room', 'Vassal', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Village', 'Copper', 'Smithy', ...coppers(10)]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Vassal');
    // First play: discards Village and plays it (+1 Card: the Copper)
    await game.chooseOption('Yes');
    // Second play: discards Smithy and plays it
    await game.chooseOption('Yes');

    expect(game.alice.inPlay).toEqual(['Throne Room', 'Vassal', 'Village', 'Smithy']);
    expect(game.alice.hand).toHaveLength(3 + 1 + 3);
    expect(game.alice.coins).toBe(4);
    expect(game.alice.actions).toBe(2);
  });

  it('lets other players react to an Attack it plays', async () => {
    const game = createGame({ kingdom: ['Vassal', 'Militia', 'Beggar'] });
    game.alice.setHand(['Vassal', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Militia', ...coppers(10)]);
    game.bob.setHand(['Beggar', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(5));

    await game.start();
    await game.playAction('Vassal');
    await game.chooseOption('Yes');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Beggar']);
  });

  it('leaves the discarded card only in the discard pile, so it is counted once for scoring', async () => {
    const game = createGame({ kingdom: ['Vassal'] });
    game.alice.setHand(['Vassal', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...coppers(10)]);

    await game.start();
    await game.playAction('Vassal');

    expect(game.alice.discard).toEqual(['Estate']);
    expect(limbo(game.alice)).toEqual([]);
    // One Estate: 1 VP
    expect(game.alice.score).toBe(1);
  });

  it('leaves the played card only in play, so it is counted once for scoring', async () => {
    const game = createGame({ kingdom: ['Vassal', 'Nobles'] });
    game.alice.setHand(['Vassal', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Nobles', ...coppers(10)]);

    await game.start();
    await game.playAction('Vassal');
    await game.chooseOption('Yes');
    await game.chooseOption('+3 Cards');

    expect(game.alice.inPlay).toEqual(['Vassal', 'Nobles']);
    expect(limbo(game.alice)).toEqual([]);
    // Nobles is worth 2 VP
    expect(game.alice.score).toBe(2);
  });

  it('plays a discarded Throne Room that has no Action card in hand to play: nothing else happens', async () => {
    const game = createGame({ kingdom: ['Vassal', 'Throne Room'] });
    game.alice.setHand(['Vassal', 'Copper', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(['Throne Room', ...coppers(10)]);

    await game.start();
    await game.playAction('Vassal');
    await game.chooseOption('Yes');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.inPlay).toEqual(['Vassal', 'Throne Room']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Estate', 'Estate']);
    expect(game.alice.coins).toBe(2);
  });

  it('plays a discarded Moat as an Action for +2 Cards', async () => {
    const game = createGame({ kingdom: ['Vassal', 'Moat'] });
    game.alice.setHand(['Vassal', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Moat', 'Silver', 'Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Vassal');
    expect(game.expectDecision('chooseOneOption', 'Alice').prompt).toContain('Moat');
    await game.chooseOption('Yes');

    expect(game.alice.inPlay).toEqual(['Vassal', 'Moat']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver', 'Gold']);
  });

  it('does not offer to play a discarded card that is not an Action', async () => {
    const game = createGame({ kingdom: ['Vassal'] });
    game.alice.setHand(['Vassal', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Vassal');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.discard).toEqual(['Gold']);
    expect(game.alice.coins).toBe(2);
  });

  it('gives only +$2 when the deck and discard pile are both empty', async () => {
    const game = createGame({ kingdom: ['Vassal'] });
    game.alice.setHand(['Vassal', 'Copper']);

    await game.start();
    await game.playAction('Vassal');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.coins).toBe(2);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Vassal']);
  });

  it('triggers a "when discarded" reaction on the discarded card (Tunnel)', async () => {
    const game = createGame({ kingdom: ['Vassal', 'Tunnel'] });
    game.alice.setHand(['Vassal', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Tunnel', ...coppers(10)]);

    await game.start();
    await game.playAction('Vassal');
    // Tunnel: when you discard this other than during Clean-up, you may reveal it to gain a Gold
    await game.chooseEffect('Tunnel');

    expect(game.alice.discard.sort()).toEqual(['Gold', 'Tunnel']);
  });

  it('offers to play a discarded Action that has already played itself (Weaver), then loses track of it', async () => {
    const game = createGame({ kingdom: ['Vassal', 'Weaver'] });
    game.alice.setHand(['Vassal', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Weaver', ...coppers(10)]);

    await game.start();
    await game.playAction('Vassal');
    // Weaver: when you discard this other than during Clean-up, you may play it
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain two Silvers');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.declineEffects();
    }

    // Weaver has left the discard pile, so Vassal has lost track of it (wiki, Vassal: playing a self-moving Action
    // discarded by Vassal is no longer possible). It is still offered; choosing it does nothing to Weaver.
    expect(game.expectDecision('chooseOneOption', 'Alice').prompt).toContain('Weaver');
    await game.chooseOption('Yes');

    expect(game.alice.log).toContain('Alice has lost track of Weaver');
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.inPlay).toEqual(['Vassal', 'Weaver']);
    expect(game.alice.discard).toEqual(['Silver', 'Silver']);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(0);
  });

  it('offers to play a discarded Trail that has played itself, then loses track of it', async () => {
    const game = createGame({ kingdom: ['Vassal', 'Trail'] });
    game.alice.setHand(['Vassal', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Trail', 'Silver', ...coppers(10)]);

    await game.start();
    await game.playAction('Vassal');
    // Trail: when you discard this other than during Clean-up, you may play it (+1 Card, +1 Action)
    await game.chooseEffect('Trail');
    expect(game.alice.inPlay).toEqual(['Vassal', 'Trail']);
    expect(game.alice.hand).toContain('Silver');

    await game.chooseOption('Yes');

    expect(game.alice.log).toContain('Alice has lost track of Trail');
    // Trail isn't played a second time: no further card or Action
    expect(game.alice.inPlay).toEqual(['Vassal', 'Trail']);
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.coins).toBe(2);
  });

  it('plays a discarded Vassal, which discards and may play the next card', async () => {
    const game = createGame({ kingdom: ['Vassal', 'Village'] });
    game.alice.setHand(['Vassal', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Vassal', 'Village', ...coppers(10)]);

    await game.start();
    await game.playAction('Vassal');
    await game.chooseOption('Yes');
    await game.chooseOption('Yes');

    expect(game.alice.inPlay).toEqual(['Vassal', 'Vassal', 'Village']);
    expect(game.alice.coins).toBe(4);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.hand).toHaveLength(5);
  });

  it('when played by Throne Room, can play a discarded Throne Room that plays a card from hand twice', async () => {
    const game = createGame({ kingdom: ['Vassal', 'Throne Room', 'Village', 'Smithy'] });
    game.alice.setHand(['Throne Room', 'Vassal', 'Village', 'Copper', 'Copper']);
    game.alice.setDeck(['Throne Room', 'Copper', 'Copper', 'Smithy', ...coppers(20)]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Vassal');
    // First Vassal play: discards Throne Room and plays it on Village (+2 Cards, +4 Actions)
    await game.chooseOption('Yes');
    await game.chooseCard('Village');
    // Second Vassal play: discards Smithy and plays it
    expect(game.expectDecision('chooseOneOption', 'Alice').prompt).toContain('Smithy');
    await game.chooseOption('Yes');

    expect(game.alice.inPlay).toEqual(['Throne Room', 'Vassal', 'Throne Room', 'Village', 'Smithy']);
    expect(game.alice.coins).toBe(4);
    expect(game.alice.actions).toBe(4);
    expect(game.alice.hand).toHaveLength(2 + 2 + 3);
  });

  it('played twice by Throne Room, plays a Duration once: only the Duration stays in play', async () => {
    const game = createGame({ kingdom: ['Vassal', 'Throne Room', 'Wharf'] });
    game.alice.setHand(['Throne Room', 'Vassal', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Wharf', 'Copper', 'Copper', 'Estate', ...coppers(20)]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Vassal');
    await game.chooseOption('Yes');
    // Second Vassal play discards the Estate
    game.expectDecision('treasurePhase', 'Alice');
    await game.endTurn();

    // Throne Room played Vassal (not a Duration) twice; Vassal played Wharf only once
    expect(game.alice.inPlay).toEqual(['Wharf']);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Throne Room', 'Vassal', 'Estate']));
  });

  it('plays a discarded Throne Room on a Duration: that Throne Room stays in play with it, Vassal does not', async () => {
    const game = createGame({ kingdom: ['Vassal', 'Throne Room', 'Wharf'] });
    game.alice.setHand(['Vassal', 'Wharf', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Throne Room', ...coppers(30)]);

    await game.start();
    await game.playAction('Vassal');
    await game.chooseOption('Yes');
    await game.chooseCard('Wharf');
    expect(game.alice.buys).toBe(3);
    await game.endTurn();

    expect(game.alice.inPlay.sort()).toEqual(['Throne Room', 'Wharf']);
    expect(game.alice.discard).toContain('Vassal');
    await game.endTurn();
    await resolveStartOfTurnEffects(game, 'Wharf');
    expect(game.alice.hand).toHaveLength(5 + 4);
    await game.endTurn();
    expect(game.alice.inPlay).toEqual([]);
  });

  it('may play a discarded Action-Treasure (Coronet), which then plays cards from hand twice', async () => {
    const game = createGame({ kingdom: ['Vassal', 'Village'] });
    game.alice.setHand(['Vassal', 'Village', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(['Coronet', ...coppers(10)]);

    await game.start();
    await game.playAction('Vassal');
    expect(game.expectDecision('chooseOneOption', 'Alice').prompt).toContain('Coronet');
    await game.chooseOption('Yes');
    await game.chooseCard('Village');
    await game.chooseCard('Copper');

    expect(game.alice.inPlay).toEqual(['Vassal', 'Coronet', 'Village', 'Copper']);
    expect(game.alice.coins).toBe(2 + 2);
    expect(game.alice.actions).toBe(4);
    expect(game.alice.hand.sort()).toEqual(['Copper', 'Copper', 'Copper', 'Estate']);
  });
});
