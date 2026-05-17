import { CardInfo, CardType, Expansion, Mechanic } from '@dominion/common';

export const darkAges: CardInfo[] = [
  {
    name: 'Poor House',
    text: "+$4\n\nReveal your hand. –$1 per\nTreasure card in your hand.\n(You can't go below $0.)",
    font_size: 'medium',
    cost: {
      coins: 1,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Beggar',
    text: 'Gain 3 Coppers to your\nhand.\n-\nWhen another player plays\nan Attack card, you may first\ndiscard this to gain 2 Silvers,\nputting one onto your deck.',
    font_size: 'medium',
    cost: {
      coins: 2,
    },
    types: [CardType.ACTION, CardType.REACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Squire',
    text: '+$1\nChoose one: +2 Actions; or\n+2 Buys; or gain a Silver.\n-\nWhen you trash this, gain an\nAttack card.',
    font_size: 'medium',
    cost: {
      coins: 2,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Vagrant',
    text: '+1 Card\n+1 Action\n\nReveal the top card of your\ndeck. If it’s a Curse, Ruins,\nShelter, or Victory card, put\nit into your hand.',
    font_size: 'medium',
    cost: {
      coins: 2,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Forager',
    text: '+1 Action\n+1 Buy\n\nTrash a card from your hand,\nthen +$1 per differently\nnamed Treasure in the trash.',
    font_size: 'medium',
    cost: {
      coins: 3,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Hermit',
    text: "Look through your discard pile.\nYou may trash a non-Treasure\nfrom it or from your hand.\nGain a card costing up to $3.\nAt the end of your Buy phase\nthis turn, if you didn't gain\nany cards in it, exchange\nthis for a Madman.",
    font_size: 'small',
    cost: {
      coins: 3,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
    mechanics: [Mechanic.MADMAN],
  },
  {
    name: 'Market Square',
    text: '+1 Card\n+1 Action\n+1 Buy\n-\nWhen one of your cards is\ntrashed, you may discard\nthis from your hand to gain\na Gold.',
    font_size: 'medium',
    cost: {
      coins: 3,
    },
    types: [CardType.ACTION, CardType.REACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Sage',
    text: '+1 Action\nReveal cards from the top of\nyour deck until you reveal\none costing $3 or more. Put\nthat card into your hand and\ndiscard the rest.',
    font_size: 'medium',
    cost: {
      coins: 3,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Storeroom',
    text: '+1 Buy\nDiscard any number of\ncards, then draw that many.\nThen discard any number of\ncards for +$1 each.',
    font_size: 'medium',
    cost: {
      coins: 3,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Urchin',
    text: '+1 Card\n+1 Action\nEach other player discards down to\n4 cards in hand.\n-\nWhen you play another Attack card\nwith this in play, you may first trash\nthis, to gain a Mercenary from the\nMercenary pile.',
    font_size: 'small',
    cost: {
      coins: 3,
    },
    types: [CardType.ACTION, CardType.ATTACK],
    expansion: Expansion.DARK_AGES,
    mechanics: [Mechanic.MERCENARY],
  },
  {
    name: 'Armory',
    text: 'Gain a card onto your deck costing up to $4.',
    font_size: 'medium',
    cost: {
      coins: 4,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Death Cart',
    text: 'You may trash this or an Action\ncard from your hand, for +$5.\n-\nWhen you gain this,\ngain 2 Ruins.',
    font_size: 'medium',
    cost: {
      coins: 4,
    },
    types: [CardType.ACTION, CardType.LOOTER],
    expansion: Expansion.DARK_AGES,
    mechanics: [Mechanic.RUINS],
  },
  {
    name: 'Feodum',
    text: 'Worth 1 VP per 3 Silvers\nyou have (round down).\n-\nWhen you trash this, gain 3\nSilvers.',
    font_size: 'medium',
    cost: {
      coins: 4,
    },
    types: [CardType.VICTORY],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Fortress',
    text: '+1 Card\n+2 Actions\n-\nWhen you trash this, put it\ninto your hand.',
    font_size: 'medium',
    cost: {
      coins: 4,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Ironmonger',
    text: '+1 Card\n+1 Action\nReveal the top card of your deck; you\nmay discard it. Either way, if it is an...\n\nAction card, +1 Action\nTreasure card, +$1\nVictory card, +1 Card',
    font_size: 'small',
    cost: {
      coins: 4,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Marauder',
    text: 'Gain a Spoils from the Spoils\npile. Each other player gains\na Ruins.',
    font_size: 'medium',
    cost: {
      coins: 4,
    },
    types: [CardType.ACTION, CardType.ATTACK, CardType.LOOTER],
    expansion: Expansion.DARK_AGES,
    mechanics: [Mechanic.SPOILS, Mechanic.RUINS],
  },
  {
    name: 'Procession',
    text: 'You may play a non-Duration\nAction card from your hand\ntwice. Trash it. Gain an Action card\ncosting exactly $1\nmore than it.	',
    font_size: 'medium',
    cost: {
      coins: 4,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Rats',
    text: '+1 Card\n+1 Action\nGain a Rats. Trash a card from\nyour hand other than a Rats (or\nreveal a hand of all Rats).\n-\nWhen you trash this,\n+1 Card.',
    font_size: 'medium',
    cost: {
      coins: 4,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Scavenger',
    text: '+$2\nYou may put your deck\ninto your discard pile. Look\nthrough your discard pile\nand put one card from it onto\nyour deck.	',
    font_size: 'medium',
    cost: {
      coins: 4,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Wandering Minstrel',
    text: '+1 Card\n+2 Actions\n\nReveal the top 3 cards of\nyour deck. Put the Action\ncards back in any order\nand discard the rest.',
    font_size: 'medium',
    cost: {
      coins: 4,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Band of Misfits',
    text: 'Play a non-Command Action\ncard from the Supply that costs\nless than this, leaving it there.',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION, CardType.COMMAND],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Bandit Camp',
    text: '+1 Card\n+2 Actions\nGain a Spoils from the\nSpoils pile.',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
    mechanics: [Mechanic.SPOILS],
  },
  {
    name: 'Catacombs',
    text: 'Look at the top 3 cards of\nyour deck. Choose one: Put\nthem into your hand; or\ndiscard them and +3 Cards.\n-\nWhen you trash this, gain a\ncheaper card.',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Count',
    text: 'Choose one: Discard 2 cards;\nor put a card from your hand\nonto your deck; or gain a\nCopper.\nChoose one: +$3; or trash\nyour hand; or gain a Duchy.',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Counterfeit',
    text: '$1\n+1 Buy\nYou may play a non-Duration\nTreasure from your hand twice.\nTrash it.',
    font_size: 'small',
    cost: {
      coins: 5,
    },
    production: {
      coins: 1,
    },
    types: [CardType.TREASURE],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Cultist',
    text: '+2 Cards. Each other player gains\na Ruins. You may play a\nCultist from your hand.\n-\nWhen you trash this,\n+3 Cards.',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION, CardType.ATTACK, CardType.LOOTER],
    expansion: Expansion.DARK_AGES,
    mechanics: [Mechanic.RUINS],
  },
  {
    name: 'Graverobber',
    text: 'Choose one: Gain a card\nfrom the trash costing from\n$3 to $6, onto your deck;\nor trash an Action card from\nyour hand and gain a card\ncosting up to $3 more than it.',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Junk Dealer',
    text: '+1 Card\n+1 Action\n+$1.\n\nTrash a card from your hand.',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Mystic',
    text: '+1 Action\n+$2\nName a card, then reveal the\ntop card of your deck. If you\nnamed it, put it into your\nhand.',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Pillage',
    text: 'Trash this. If you did, gain 2\nSpoils, and each other player\nwith 5 or more cards in hand\nreveals their hand and discards\na card that you choose.',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION, CardType.ATTACK],
    expansion: Expansion.DARK_AGES,
    mechanics: [Mechanic.SPOILS],
  },
  {
    name: 'Rebuild',
    text: '+1 Action\nName a card. Reveal cards from\nyour deck until you reveal a Victory\ncard you did not name. Discard the\nrest, trash the Victory card, and gain\na Victory card costing up to $3\nmore than it.',
    font_size: 'small',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Rogue',
    text: '+$2\nIf there are any cards in the trash\ncosting from $3 to $6, gain\none of them. Otherwise, each other\nplayer reveals the top 2 cards of\ntheir deck, trashes one of them\ncosting from $3 to $6, and\ndiscards the rest.',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION, CardType.ATTACK],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Altar',
    text: 'Trash a card from your hand. Gain a card costing up to $5.',
    font_size: 'medium',
    cost: {
      coins: 6,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Hunting Grounds',
    text: '+4 Cards\n-\nWhen you trash this,\ngain a Duchy or 3 Estates.',
    font_size: 'medium',
    cost: {
      coins: 6,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Abandoned Mine',
    text: '+$1',
    font_size: 'medium',
    cost: {
      coins: 0,
    },
    types: [CardType.ACTION, CardType.RUINS],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Ruined Library',
    text: '+1 Card',
    font_size: 'medium',
    cost: {
      coins: 0,
    },
    types: [CardType.ACTION, CardType.RUINS],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Ruined Market',
    text: '+1 Buy',
    font_size: 'medium',
    cost: {
      coins: 0,
    },
    types: [CardType.ACTION, CardType.RUINS],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Ruined Village',
    text: '+1 Action',
    font_size: 'medium',
    cost: {
      coins: 0,
    },
    types: [CardType.ACTION, CardType.RUINS],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Survivors',
    text: 'Look at the top 2 cards of\nyour deck. Discard them or\nput them back in any order.',
    font_size: 'medium',
    cost: {
      coins: 0,
    },
    types: [CardType.ACTION, CardType.RUINS],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Dame Anna',
    text: 'You may trash up to 2 cards from\n your hand. Each other player reveals\nthe top 2 cards of their deck, trashes\none of them costing from $3 to\n$6, and discards the rest. If a\nKnight is trashed by this, trash this.',
    font_size: 'small',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION, CardType.ATTACK, CardType.KNIGHT],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Dame Josephine',
    text: 'Each other player reveals the top\n2 cards of their deck, trashes one\nof them costing from $3 to $6,\nand discards the rest. If a Knight is\ntrashed by this, trash this.\n-\n2 VP',
    font_size: 'small',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION, CardType.ATTACK, CardType.KNIGHT],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Dame Molly',
    text: '+2 Actions\nEach other player reveals\nthe top 2 cards of their deck,\ntrashes one of them costing\nfrom $3 to $6, and discards\nthe rest. If a Knight is trashed\nby this, trash this.',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION, CardType.ATTACK, CardType.KNIGHT],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Dame Natalie',
    text: 'You may gain a card costing up to\n$3. Each other player reveals the\ntop 2 cards of their deck, trashes one\nof them costing from $3 to $6,\nand discards the rest. If a Knight is\ntrashed by this, trash this.',
    font_size: 'small',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION, CardType.ATTACK, CardType.KNIGHT],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Dame Sylvia',
    text: '+$2\nEach other player reveals\nthe top 2 cards of their deck,\ntrashes one of them costing\nfrom $3 to $6, and discards\nthe rest. If a Knight is trashed\nby this, trash this.',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION, CardType.ATTACK, CardType.KNIGHT],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Sir Bailey',
    text: '+1 Card\n+1 Action\nEach other player reveals the top\n2 cards of their deck, trashes one\nof them costing from $3 to $6,\nand discards the rest. If a Knight is\ntrashed by this, trash this.',
    font_size: 'small',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION, CardType.ATTACK, CardType.KNIGHT],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Sir Destry',
    text: '+2 Cards\nEach other player reveals\nthe top 2 cards of their deck,\ntrashes one of them costing\nfrom $3 to $6, and discards\nthe rest. If a Knight is trashed\nby this, trash this.',
    font_size: 'medium',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION, CardType.ATTACK, CardType.KNIGHT],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Sir Martin',
    text: '+2 Buys\nEach other player reveals\nthe top 2 cards of their deck,\ntrashes one of them costing\nfrom $3 to $6, and discards\nthe rest. If a Knight is trashed\nby this, trash this.',
    font_size: 'medium',
    cost: {
      coins: 4,
    },
    types: [CardType.ACTION, CardType.ATTACK, CardType.KNIGHT],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Sir Michael',
    text: 'Each other player discards down to\n3 cards in hand. Each other player\nreveals the top 2 cards of their deck,\ntrashes one of them costing from\n$3 to $6, and discards the rest.\nIf a Knight is trashed by this, trash\nthis.',
    font_size: 'small',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION, CardType.ATTACK, CardType.KNIGHT],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Sir Vander',
    text: 'Each other player reveals the top\n2 cards of their deck, trashes one\nof them costing from $3 to $6,\nand discards the rest. If a Knight is\ntrashed by this, trash this.\n-\nWhen you trash this, gain a Gold',
    font_size: 'small',
    cost: {
      coins: 5,
    },
    types: [CardType.ACTION, CardType.ATTACK, CardType.KNIGHT],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Madman',
    text: '+2 Actions\n\nReturn this to the Madman\npile. If you do, +1 Card per\ncard in your hand.\n(This is not in the Supply.)',
    font_size: 'medium',
    cost: {
      coins: 0,
      has_asterisk: true,
    },
    types: [CardType.ACTION],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Mercenary',
    text: 'You may trash 2 cards\nfrom your hand. If you did,\n+2 Cards, +$2, and each\nother player discards down\nto 3 cards in hand.\n(This is not in the Supply.)',
    font_size: 'medium',
    cost: {
      coins: 0,
      has_asterisk: true,
    },
    types: [CardType.ACTION, CardType.ATTACK],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Spoils',
    text: '$3\nWhen you play this, return it\nto the Spoils pile.\n(This is not in the Supply.)',
    font_size: 'medium',
    cost: {
      coins: 0,
      has_asterisk: true,
    },
    production: {
      coins: 3,
    },
    types: [CardType.TREASURE],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Hovel',
    text: 'When you gain a Victory card,\nyou may trash this from your\nhand.',
    font_size: 'medium',
    cost: {
      coins: 1,
    },
    types: [CardType.REACTION, CardType.SHELTER],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Necropolis',
    text: '+2 Actions',
    font_size: 'medium',
    cost: {
      coins: 1,
    },
    types: [CardType.ACTION, CardType.SHELTER],
    expansion: Expansion.DARK_AGES,
  },
  {
    name: 'Overgrown Estate',
    text: '0 VP\n-\nWhen you trash this, +1 Card.',
    font_size: 'medium',
    cost: {
      coins: 1,
    },
    types: [CardType.VICTORY, CardType.SHELTER],
    expansion: Expansion.DARK_AGES,
  },
];
