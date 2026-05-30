import { CardInfo, CardType, Expansion } from '@dominion/common';

export const basic_cards: CardInfo[] = [
  {
    name: 'Copper',
    text: '$1',
    font_size: 'xlarge',
    cost: {
      coins: 0,
    },
    production: {
      coins: 1,
    },
    types: [CardType.TREASURE],
    expansion: Expansion.BASE,
    is_kingdom: false,
  },

  {
    name: 'Silver',
    text: '$2',
    font_size: 'xxlarge',
    cost: {
      coins: 3,
    },
    production: {
      coins: 2,
    },
    types: [CardType.TREASURE],
    expansion: Expansion.BASE,
    is_kingdom: false,
  },

  {
    name: 'Gold',
    text: '$3',
    font_size: 'xxlarge',
    cost: {
      coins: 6,
    },
    production: {
      coins: 3,
    },
    types: [CardType.TREASURE],
    expansion: Expansion.BASE,
    is_kingdom: false,
  },

  {
    name: 'Platinum',
    text: '$5',
    font_size: 'xlarge',
    cost: {
      coins: 9,
    },
    production: {
      coins: 5,
    },
    types: [CardType.TREASURE],
    expansion: Expansion.PROSPERITY,
    is_kingdom: false,
  },

  {
    name: 'Potion',
    text: '1P',
    font_size: 'xlarge',
    cost: {
      coins: 4,
    },
    production: {
      coins: 0,
      potions: 1,
    },
    types: [CardType.TREASURE],
    expansion: Expansion.ALCHEMY,
    is_kingdom: false,
  },

  {
    name: 'Estate',
    text: '1VP',
    font_size: 'xlarge',
    cost: {
      coins: 2,
    },
    types: [CardType.VICTORY],
    expansion: Expansion.BASE,
    is_kingdom: false,
  },

  {
    name: 'Duchy',
    text: '3VP',
    font_size: 'xlarge',
    cost: {
      coins: 5,
    },
    types: [CardType.VICTORY],
    expansion: Expansion.BASE,
    is_kingdom: false,
  },

  {
    name: 'Province',
    text: '6VP',
    font_size: 'xlarge',
    cost: {
      coins: 8,
    },
    types: [CardType.VICTORY],
    expansion: Expansion.BASE,
    is_kingdom: false,
  },

  {
    name: 'Colony',
    text: '10VP',
    font_size: 'xlarge',
    cost: {
      coins: 11,
    },
    types: [CardType.VICTORY],
    expansion: Expansion.PROSPERITY,
    is_kingdom: false,
  },

  {
    name: 'Curse',
    text: '-1VP',
    font_size: 'xlarge',
    cost: {
      coins: 0,
    },
    types: [CardType.CURSE],
    expansion: Expansion.BASE,
    is_kingdom: false,
  },
];
