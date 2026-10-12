import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const copies = (name: string, count: number): string[] => Array<string>(count).fill(name);

describe('Scrying Pool', () => {
  it("lets the player decide each player's top card in turn order, starting with their own", async () => {
    const game = createGame({ kingdom: ['Scrying Pool'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Scrying Pool', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Silver', ...copies('Copper', 5)]);
    game.bob.setDeck(['Gold', 'Copper']);
    cara.setDeck(['Curse', 'Copper']);

    await game.start();
    await game.playAction('Scrying Pool');

    // Every decision is the player's, even for the other players' cards
    expect(game.expectDecision('chooseOneOption', 'Alice').prompt).toContain("Alice's Estate");
    expect(game.pending.options).toEqual(['Discard it', 'Put it back']);
    await game.chooseOption('Discard it');
    expect(game.expectDecision('chooseOneOption', 'Alice').prompt).toContain("Bob's Gold");
    await game.chooseOption('Discard it');
    expect(game.expectDecision('chooseOneOption', 'Alice').prompt).toContain("Cara's Curse");
    await game.chooseOption('Put it back');

    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.bob.discard).toEqual(['Gold']);
    expect(game.bob.deck).toEqual(['Copper']);
    expect(cara.discard).toEqual([]);
    expect(cara.deck).toEqual(['Curse', 'Copper']);
    // Then Alice reveals until a non-Action: the Silver
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
    expect(game.alice.actions).toBe(1);
  });

  it('puts a long run of Actions into hand, shuffling the discard pile when the deck runs out', async () => {
    const game = createGame({ kingdom: ['Scrying Pool', 'Village', 'Smithy', 'Market', 'Laboratory'] });
    game.alice.setHand(['Scrying Pool', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Village', 'Smithy', 'Market', 'Laboratory', 'Scrying Pool']);
    game.alice.setDiscard(['Silver', 'Silver']);
    game.bob.setDeck(['Copper']);

    await game.start();
    await game.playAction('Scrying Pool');
    await game.chooseOption('Put it back');
    await game.chooseOption('Put it back');

    expect(game.alice.hand).toEqual([
      'Copper',
      'Copper',
      'Copper',
      'Copper',
      'Village',
      'Smithy',
      'Market',
      'Laboratory',
      'Scrying Pool',
      'Silver',
    ]);
    expect(game.alice.deck).toEqual(['Silver']);
    expect(game.alice.discard).toEqual([]);
  });

  it('shuffles the discard pile to reveal its top card when the deck is empty', async () => {
    const game = createGame({ kingdom: ['Scrying Pool'] });
    game.alice.setHand(['Scrying Pool', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDiscard(['Gold']);
    game.bob.setDeck(['Copper']);

    await game.start();
    await game.playAction('Scrying Pool');

    expect(game.expectDecision('chooseOneOption', 'Alice').prompt).toContain("Alice's Gold");
    await game.chooseOption('Discard it');
    await game.chooseOption('Put it back');

    // The discarded Gold is shuffled back in to be revealed again, and goes into hand
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Gold']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
  });

  it("only asks about other players' cards when its owner has no cards to reveal", async () => {
    const game = createGame({ kingdom: ['Scrying Pool'] });
    game.alice.setHand(['Scrying Pool', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Estate', 'Copper']);

    await game.start();
    await game.playAction('Scrying Pool');

    expect(game.expectDecision('chooseOneOption', 'Alice').prompt).toContain("Bob's Estate");
    await game.chooseOption('Discard it');

    expect(game.bob.discard).toEqual(['Estate']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper']);
    expect(game.alice.actions).toBe(1);
    expect(game.pending.playerName).toBe('Alice');
  });

  it('reveals again from where the first play stopped when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Scrying Pool', 'Throne Room', 'Village'] });
    game.alice.setHand(['Throne Room', 'Scrying Pool', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Village', 'Copper', 'Estate', 'Silver', 'Gold']);
    game.bob.setDeck(['Copper', 'Copper']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Scrying Pool');
    // First play: keep Village on top, reveal Village and Copper
    await game.chooseOption('Put it back');
    await game.chooseOption('Put it back');
    // Second play: discard the Estate, reveal the Silver
    expect(game.expectDecision('chooseOneOption', 'Alice').prompt).toContain("Alice's Estate");
    await game.chooseOption('Discard it');
    await game.chooseOption('Put it back');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Village', 'Copper', 'Silver']);
    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.alice.deck).toEqual(['Gold']);
    expect(game.alice.actions).toBe(2);
  });

  it('keeps revealing past Action-Treasure and Action-Victory cards such as Coronet and Mill', async () => {
    const game = createGame({ kingdom: ['Scrying Pool', 'Mill'] });
    game.alice.setHand(['Scrying Pool', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Coronet', 'Mill', 'Silver', 'Gold']);
    game.bob.setDeck(['Copper']);

    await game.start();
    await game.playAction('Scrying Pool');
    await game.chooseOption('Put it back');
    await game.chooseOption('Put it back');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Coronet', 'Mill', 'Silver']);
    expect(game.alice.deck).toEqual(['Gold']);
  });

  it('puts every revealed card into hand when the deck and discard pile hold only Actions', async () => {
    const game = createGame({ kingdom: ['Scrying Pool', 'Village', 'Smithy'] });
    game.alice.setHand(['Scrying Pool', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Village', 'Smithy']);
    game.alice.setDiscard(['Village']);
    game.bob.setDeck(['Copper']);

    await game.start();
    await game.playAction('Scrying Pool');
    await game.chooseOption('Put it back');
    await game.chooseOption('Put it back');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Village', 'Smithy', 'Village']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    expect(game.pending.kind).toBe('actionPhase');
  });

  it("skips a player who blocks it with Moat, but still asks about its owner's own card", async () => {
    const game = createGame({ kingdom: ['Scrying Pool', 'Moat'] });
    game.alice.setHand(['Scrying Pool', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Silver', ...copies('Copper', 5)]);
    game.bob.setHand(['Moat', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(['Gold', 'Copper']);

    await game.start();
    await game.playAction('Scrying Pool');
    await game.chooseEffect('Moat');

    expect(game.expectDecision('chooseOneOption', 'Alice').prompt).toContain("Alice's Estate");
    await game.chooseOption('Discard it');

    // No decision about Bob's Gold
    expect(game.bob.deck).toEqual(['Gold', 'Copper']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
    game.expectDecision('treasurePhase', 'Alice');
  });

  it('shuffles a card discarded by its first play back in for its second play under Throne Room', async () => {
    const game = createGame({ kingdom: ['Scrying Pool', 'Throne Room', 'Village'] });
    game.alice.setHand(['Throne Room', 'Scrying Pool', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Village', 'Silver']);
    game.bob.setDeck(['Copper', 'Copper']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Scrying Pool');
    // First play: discard Alice's Estate, keep Bob's Copper; reveal Village and Silver into hand
    await game.chooseOption('Discard it');
    await game.chooseOption('Put it back');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Village', 'Silver']);

    // Second play: the deck is empty, so the discarded Estate is shuffled back in to be revealed
    expect(game.expectDecision('chooseOneOption', 'Alice').prompt).toContain("Alice's Estate");
    expect(game.alice.deck).toEqual(['Estate']);
    expect(game.alice.discard).toEqual([]);
    await game.chooseOption('Put it back');
    await game.chooseOption('Put it back');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Village', 'Silver', 'Estate']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.actions).toBe(2);
  });

  it("lets another player play a Weaver it discards from their deck, on its owner's turn", async () => {
    const game = createGame({ kingdom: ['Scrying Pool', 'Weaver'] });
    game.alice.setHand(['Scrying Pool', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Silver', ...copies('Copper', 10)]);
    game.bob.setDeck(['Weaver', ...copies('Copper', 10)]);

    await game.start();
    await game.playAction('Scrying Pool');
    await game.chooseOption('Put it back');
    expect(game.expectDecision('chooseOneOption', 'Alice').prompt).toContain("Bob's Weaver");
    await game.chooseOption('Discard it');

    // Bob may play the discarded Weaver
    expect(game.expectDecision('chooseFromMultipleEvents', 'Bob').optionalEffects.map((e) => e.effectName)).toEqual([
      'Weaver',
    ]);
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain two Silvers');

    expect(game.bob.inPlay).toEqual(['Weaver']);
    expect(game.bob.discard).toEqual(['Silver', 'Silver']);
    // Scrying Pool carries on: Alice reveals the Estate into hand
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Estate']);
    await game.endTurn();

    // Bob's Weaver is discarded in Alice's Clean-up
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.bob.inPlay).toEqual([]);
    expect(game.bob.discard).toContain('Weaver');
  });

  it('lets another player reveal a Tunnel it discards from their deck to gain a Gold', async () => {
    const game = createGame({ kingdom: ['Scrying Pool', 'Tunnel'] });
    game.alice.setHand(['Scrying Pool', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', ...copies('Copper', 10)]);
    game.bob.setDeck(['Tunnel', ...copies('Copper', 10)]);

    await game.start();
    await game.playAction('Scrying Pool');
    await game.chooseOption('Put it back');
    await game.chooseOption('Discard it');
    await game.chooseEffect('Tunnel');

    expect(game.bob.discard.sort()).toEqual(['Gold', 'Tunnel']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
  });

  it('lets another player play Guard Dog first, so the top card it reveals is the one after the Guard Dog draw', async () => {
    const game = createGame({ kingdom: ['Scrying Pool', 'Guard Dog'] });
    game.alice.setHand(['Scrying Pool', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', ...copies('Copper', 5)]);
    game.bob.setHand(['Guard Dog', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(['Copper', 'Copper', 'Gold', 'Copper']);

    await game.start();
    await game.playAction('Scrying Pool');

    // Bob reacts before anything is revealed
    expect(game.expectDecision('chooseFromMultipleEvents', 'Bob').optionalEffects.map((e) => e.effectName)).toEqual([
      'Guard Dog',
    ]);
    await game.chooseEffect('Guard Dog');
    expect(game.bob.hand).toEqual(['Estate', 'Estate', 'Estate', 'Estate', 'Copper', 'Copper']);

    expect(game.expectDecision('chooseOneOption', 'Alice').prompt).toContain("Alice's Silver");
    await game.chooseOption('Put it back');
    expect(game.expectDecision('chooseOneOption', 'Alice').prompt).toContain("Bob's Gold");
    await game.chooseOption('Discard it');

    expect(game.bob.discard).toEqual(['Gold']);
    expect(game.bob.inPlay).toEqual(['Guard Dog']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
  });

  it('keeps revealing past a Knight that is also a Victory card (Dame Josephine) and stops at a Treasure-Victory (Farm)', async () => {
    const game = createGame({ kingdom: ['Scrying Pool', 'Knights', 'Farm'] });
    game.alice.setHand(['Scrying Pool', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Dame Josephine', 'Farm', 'Gold']);
    game.bob.setDeck(['Copper']);

    await game.start();
    await game.playAction('Scrying Pool');
    await game.chooseOption('Put it back');
    await game.chooseOption('Put it back');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Dame Josephine', 'Farm']);
    expect(game.alice.deck).toEqual(['Gold']);
  });
});
