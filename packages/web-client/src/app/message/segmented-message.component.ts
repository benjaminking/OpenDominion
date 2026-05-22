import { Component, computed, input } from '@angular/core';
import { MessageCards } from '@dominion/common';
import { MessageSegmenter } from './MessageSegmenter';
import { MessageSegment, MessageSegmentType } from './MessageSegment';
import { CardSegmentComponent } from './card-segment.component';
import { BoldSegmentComponent } from './bold-segment.component';
import { CoinComponent } from '../icons/coin.component';
import { VPSegmentComponent } from './vp-segment.component';
import { LineBreakSegmentComponent } from './line-break-segment.component';
import { HorizontalLineSegmentComponent } from './horizontal-line-segment.component';
import { ParagraphBreakSegmentComponent } from './paragraph-break-segment.component';
import { TextSegmentComponent } from './text-segment.component';

interface SizedMessageSegment extends MessageSegment {
  size: string;
}

@Component({
  selector: 'segmented-message',
  templateUrl: './segmented-message.component.html',
  styleUrls: ['./segmented-message.component.css'],
  imports: [
    CardSegmentComponent,
    BoldSegmentComponent,
    CoinComponent,
    VPSegmentComponent,
    LineBreakSegmentComponent,
    HorizontalLineSegmentComponent,
    ParagraphBreakSegmentComponent,
    TextSegmentComponent,
  ],
})
export class SegmentedMessageComponent {
  text = input.required<string>();
  cards = input<MessageCards[]>([]);
  size = input<string>('medium');

  segments = computed<SizedMessageSegment[]>(() => {
    const messageSegmenter = new MessageSegmenter(this.text(), this.cards());

    return this.assignSizes(messageSegmenter.segmentMessage());
  });

  MessageSegmentType = MessageSegmentType;

  assignSizes(segments: MessageSegment[]): SizedMessageSegment[] {
    const sizedSegments: SizedMessageSegment[] = [];
    for (let index = 0; index < segments.length; ++index) {
      const hasLeadingSegmentOnLine =
        index > 0 &&
        segments[index - 1].type !== MessageSegmentType.LINE_BREAK &&
        segments[index - 1].type !== MessageSegmentType.LINE_BREAK;
      const hasTrailingSegmentOnLine =
        index < segments.length - 1 &&
        segments[index + 1].type !== MessageSegmentType.LINE_BREAK &&
        segments[index + 1].type !== MessageSegmentType.LINE_BREAK;

      if (hasLeadingSegmentOnLine || hasTrailingSegmentOnLine) {
        sizedSegments.push({ ...segments[index], size: this.size() });
        continue;
      }

      // When a coin or VP appears on its own line, it should be "large" like
      // Astrolabe, Horn of Plenty, Mill, Farm, etc.
      // On basic cards like Copper, it's already "xlarge"
      if (
        this.size() === 'medium' &&
        (segments[index].type === MessageSegmentType.COIN || segments[index].type === MessageSegmentType.VP)
      ) {
        sizedSegments.push({ ...segments[index], size: 'large' });
        continue;
      }

      // basic bolded segments like "+1 Card" should never be smaller than "small"
      if (segments[index].type === MessageSegmentType.BOLD && this.size() === 'xsmall') {
        sizedSegments.push({ ...segments[index], size: 'small' });
        continue;
      }

      sizedSegments.push({ ...segments[index], size: this.size() });
    }
    return sizedSegments;
  }
}
