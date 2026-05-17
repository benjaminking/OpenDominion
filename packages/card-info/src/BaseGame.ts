import { CardInfo, CardType, Expansion } from '@dominion/common';

export const base_game: CardInfo[] = [
  {
    name: 'Artisan',
    text: 'Gain a card to your hand\ncosting up to $5.\n\nPut a card from your hand\nonto your deck.',
    font_size: 'medium',
    cost: {
      coins: 6,
    },
    types: [CardType.ACTION],
    expansion: Expansion.BASE,
  },
  {
    name: 'Bandit',
    text: 'Gain a Gold. Each other\nplayer reveals the top 2 cards\nof their deck, trashes a revealed\nTreasure other than Copper,\nand discards the rest.',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION, CardType.ATTACK],
    expansion: Expansion.BASE,
  },
  {
    name: 'Bureaucrat',
    text: 'Gain a Silver onto your deck.\nEach other player reveals a\nVictory card from their hand\nand puts it onto their deck\n(or reveals a hand with no\nVictory cards).',
    font_size: 'medium',
    cost: {
      coins: 4,
    },
    types: [CardType.ACTION, CardType.ATTACK],
    expansion: Expansion.BASE,
  },
  {
    name: 'Cellar',
    text: '+1 Action\n\nDiscard any number of cards.\n+1 Card per card discarded.',
    font_size: 'medium',
    cost: {
      coins: 2,
    },
    types: [CardType.ACTION, CardType.ATTACK],
    expansion: Expansion.BASE,
  },
  {
    name: 'Chapel',
    text: 'Trash up to 4 cards\nfrom your hand.',
    font_size: 'medium',
    cost: {
      coins: 2,
    },
    types: [CardType.ACTION],
    expansion: Expansion.BASE,
  },
  {
    name: 'Council Room',
    text: '+4 Cards\n+1 Buy\n\nEach other player draws a card.',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION],
    expansion: Expansion.BASE,
  },
  {
    name: 'Festival',
    text: '+2 Actions\n+1 Buy\n+$2',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION],
    expansion: Expansion.BASE,
  },
  {
    name: 'Gardens',
    text: 'Worth 1VP per 10 cards you\nhave (round down).',
    font_size: 'medium',
    cost: {
      coins: 4,
    },
    types: [CardType.VICTORY],
    expansion: Expansion.BASE,
  },
  {
    name: 'Harbinger',
    text: '+1 Card\n+1 Action\n\nLook through your discard pile.\nYou may put a card from it\nonto your deck.',
    font_size: 'medium',
    cost: {
      coins: 3,
    },
    types: [CardType.ACTION],
    expansion: Expansion.BASE,
  },
  {
    name: 'Laboratory',
    text: '+2 Cards\n+1 Action',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION],
    expansion: Expansion.BASE,
  },
  {
    name: 'Library',
    text: 'Draw until you have 7 cards\nin hand, skipping any Action\ncards you choose to;\nset those aside, discarding\nthem afterwards.',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION],
    expansion: Expansion.BASE,
  },
  {
    name: 'Market',
    text: '+1 Card\n+1 Action\n+1 Buy\n+$1',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION],
    expansion: Expansion.BASE,
  },
  {
    name: 'Merchant',
    text: '+1 Card\n+1 Action\n\nThe first time you play a Silver this turn, +$1.',
    font_size: 'medium',
    cost: {
      coins: 3,
    },
    types: [CardType.ACTION],
    expansion: Expansion.BASE,
  },
  {
    name: 'Militia',
    text: '+$2\n\nEach other player discards down to 3 cards in hand.',
    font_size: 'medium',
    cost: {
      coins: 4,
    },
    types: [CardType.ACTION, CardType.ATTACK],
    expansion: Expansion.BASE,
  },
  {
    name: 'Mine',
    text: 'You may trash a Treasure from\nyour hand. Gain a Treasure to\nyour hand costing up to $3\nmore than it.',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION],
    expansion: Expansion.BASE,
  },
  {
    name: 'Moat',
    text: '+2 Cards\n-\nWhen another player plays\nan Attack card, you may first\nreveal this from your hand, to\nbe unaffected by it.',
    font_size: 'medium',
    cost: {
      coins: 2,
    },
    types: [CardType.ACTION, CardType.REACTION],
    expansion: Expansion.BASE,
  },
  {
    name: 'Moneylender',
    text: 'You may trash a Copper from\nyour hand for +$3.',
    font_size: 'medium',
    cost: {
      coins: 4,
    },
    types: [CardType.ACTION],
    expansion: Expansion.BASE,
  },
  {
    name: 'Poacher',
    text: '+1 Card\n+1 Action\n+$1\n\nDiscard a card per empty\nSupply pile.',
    font_size: 'medium',
    cost: {
      coins: 4,
    },
    types: [CardType.ACTION],
    expansion: Expansion.BASE,
  },
  {
    name: 'Remodel',
    text: 'Trash a card from your hand.\nGain a card costing up to\n$2 more than it.',
    font_size: 'medium',
    cost: {
      coins: 4,
    },
    types: [CardType.ACTION],
    expansion: Expansion.BASE,
  },
  {
    name: 'Sentry',
    text: '+1 Card\n+1 Action\n\nLook at the top 2 cards of your\ndeck. Trash and/or discard any\nnumber of them. Put the rest\nback on top in any order.',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION],
    expansion: Expansion.BASE,
  },
  {
    name: 'Smithy',
    text: '+3 Cards',
    font_size: 'medium',
    cost: {
      coins: 4,
    },
    types: [CardType.ACTION],
    expansion: Expansion.BASE,
  },
  {
    name: 'Throne Room',
    text: 'You may play an Action card\nfrom your hand twice.',
    font_size: 'medium',
    cost: {
      coins: 4,
    },
    types: [CardType.ACTION],
    expansion: Expansion.BASE,
  },
  {
    name: 'Vassal',
    text: "+$2\n\nDiscard the top card of your\ndeck. If it's an Action card,\nyou may play it.",
    font_size: 'medium',
    cost: {
      coins: 3,
    },
    types: [CardType.ACTION],
    expansion: Expansion.BASE,
  },
  {
    name: 'Village',
    text: '+1 Card\n+2 Actions',
    font_size: 'medium',
    cost: {
      coins: 3,
    },
    types: [CardType.ACTION],
    expansion: Expansion.BASE,
  },
  {
    name: 'Witch',
    text: '+2 Cards\n\nEach other player\ngains a Curse.',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION, CardType.ATTACK],
    expansion: Expansion.BASE,
  },
  {
    name: 'Workshop',
    text: 'Gain a card costing up to $4.',
    font_size: 'medium',
    cost: {
      coins: 3,
    },
    types: [CardType.ACTION],
    expansion: Expansion.BASE,
  },
];
