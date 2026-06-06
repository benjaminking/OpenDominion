import { Component, computed, inject, input } from '@angular/core';

import { CardInfo, CardMetadata, CardType } from '@dominion/common';
import { CardInfoLookup } from '@dominion/card-info';
import { CommonModule } from '@angular/common';
import { convertToFileName } from '../util/NamingUtils';
import { SegmentedMessageComponent } from '../message/segmented-message.component';
import { CoinComponent } from '../icons/coin.component';
import { GlobalSettingsService } from '../settings/global-settings.service';

enum LayoutType {
  PORTRAIT,
  PORTRAIT_FULL,
  LANDSCAPE,
  TRAIT,
}

enum OverlayType {
  TREASURE,
  VICTORY,
  REACTION,
  CURSE,
  ACTION_VICTORY,
  TREASURE_VICTORY,
  DURATION,
  TREASURE_DURATION,
  DURATION_REACTION,
  TREASURE_CURSE,

  ACTION_TREASURE,
  TREASURE_REACTION,
  VICTORY_REACTION,
  RUINS,
  REACTION_SHELTER,
  ACTION_SHELTER,
  VICTORY_SHELTER,
  RESERVE,
  RESERVE_VICTORY,
  NIGHT,
  NIGHT_DURATION,
  ACTION_NIGHT,
  LANDMARK,
  BOON,
  HEX,
  STATE,
  PROJECT,
  ARTIFACT,
  WAY,
  ALLY,
  PROPHECY,

  NONE,
}

@Component({
  selector: 'card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css'],
  imports: [CommonModule, SegmentedMessageComponent, CoinComponent],
})
export class CardComponent {
  metadata = input.required<CardMetadata>();
  cardInfo = computed<CardInfo>(() => {
    return CardInfoLookup.lookUpCardInfo(this.metadata().name);
  });
  fileName = computed(() => convertToFileName(this.metadata().name));

  typesStr = computed<string>(() => {
    const sortedTypes: string[] = [...this.metadata().types].sort(typeScoringFunction);
    return sortedTypes.join(' - ');
  });
  typesSize = computed<string>(() => {
    if (this.metadata().types.length === 3) {
      return 'medium';
    }
    if (this.metadata().types.length === 4) {
      return 'small';
    }
    return 'large';
  });

  private readonly globalSettings = inject(GlobalSettingsService);
  cardAssetDirectory = computed<string>(() => {
    return this.globalSettings.assetDirectory();
  });

  LayoutType = LayoutType;
  fullLayoutCardNames: Set<string> = new Set([
    'Copper',
    'Silver',
    'Gold',
    'Platinum',
    'Estate',
    'Duchy',
    'Province',
    'Colony',
    'Curse',
    'Potion',
    'Charlatan Curse',
  ]);
  layoutType = computed<LayoutType>(() => {
    const cardName = this.metadata().name;
    if (this.fullLayoutCardNames.has(cardName)) {
      return LayoutType.PORTRAIT_FULL;
    }
    return LayoutType.PORTRAIT;
  });

  costSymbol = computed<string>(() => {
    let coins = this.metadata().cost.coins.toFixed();
    if (this.cardInfo().cost.has_asterisk && this.cardInfo().cost === this.metadata().cost) {
      coins += '*';
    }
    return coins;
  });

  productionSymbol = computed<string>(() => {
    if (this.cardInfo().production?.is_variable) {
      return '?';
    }
    let coins = this.cardInfo().production?.coins?.toFixed() ?? '';
    return coins;
  });

  OverlayType = OverlayType;
  overlayType = computed<OverlayType>(() => {
    const isAction = this.metadata().types.includes(CardType.ACTION);
    const isTreasure = this.metadata().types.includes(CardType.TREASURE);
    const isVictory = this.metadata().types.includes(CardType.VICTORY);
    const isCurse = this.metadata().types.includes(CardType.CURSE);
    const isReaction = this.metadata().types.includes(CardType.REACTION);
    const isDuration = this.metadata().types.includes(CardType.DURATION);

    if (isTreasure && !isVictory && !isDuration && !isCurse) {
      return OverlayType.TREASURE;
    }
    if (isVictory && !isTreasure && !isAction) {
      return OverlayType.VICTORY;
    }
    if (isReaction && !isTreasure && !isDuration) {
      return OverlayType.REACTION;
    }
    if (isCurse && !isTreasure) {
      return OverlayType.CURSE;
    }
    if (isAction && isVictory) {
      return OverlayType.ACTION_VICTORY;
    }
    if (isTreasure && isVictory) {
      return OverlayType.TREASURE_VICTORY;
    }
    if (isTreasure && isCurse) {
      return OverlayType.TREASURE_CURSE;
    }
    if (isDuration && !isTreasure && !isReaction) {
      return OverlayType.DURATION;
    }
    if (isDuration && isTreasure) {
      return OverlayType.TREASURE_DURATION;
    }
    if (isDuration && isReaction) {
      return OverlayType.DURATION_REACTION;
    }
    return OverlayType.NONE;
  });
}

function typeScoringFunction(type: CardType): number {
  switch (type) {
    case CardType.ACTION: {
      return 10;
    }
    case CardType.TREASURE: {
      return 9;
    }
    //case CardType.NIGHT: {
    //  return 8;
    //}
    case CardType.DURATION: {
      return 7;
    }
    //case CardType.RESERVE: {
    //  return 6;
    //}
    case CardType.ATTACK: {
      return 5;
    }
    //case CardType.KNIGHT: {
    //  return 4;
    //}
    case CardType.VICTORY: {
      return 3;
    }
    case CardType.REACTION: {
      return 2;
    }
    //case CardType.LIAISON: {
    //  return -10;
    //}
    default: {
      return 0;
    }
  }
}
