import {
  AfterViewChecked,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { MessageDecoderService } from '../message-decoder.service';
import { LogMessage, LogMessageType } from '@dominion/common';
import { MessageSegmenter } from '../message/MessageSegmenter';
import { MessageSegment, MessageSegmentType } from '../message/MessageSegment';
import { CommonModule } from '@angular/common';
import { CardSegmentComponent } from '../message/card-segment.component';

interface ReadableLogMessage {
  orderIndex: number;
  name: string;
  message: MessageSegment[];
  type: LogMessageType;
}

@Component({
  selector: 'log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.css'],
  imports: [CommonModule, CardSegmentComponent],
})
export class LogComponent implements OnInit, AfterViewChecked {
  playerNames = input<string[]>([]);
  playerIndices = computed<Map<string, number>>(() => {
    const playerIndexMap = new Map<string, number>();
    this.playerNames()
      .sort()
      .forEach((name, index) => {
        playerIndexMap.set(name, index);
      });
    return playerIndexMap;
  });

  rawLogMessages = signal<LogMessage[]>([]);
  logMessages = computed<ReadableLogMessage[]>(() =>
    this.rawLogMessages().map((msg: LogMessage) => {
      if (msg.type === LogMessageType.TURN_START) {
        return {
          orderIndex: msg.orderIndex,
          name: msg.playerName,
          message: [{ id: 1, text: msg.text, type: MessageSegmentType.ORDINARY }],
          type: msg.type,
        };
      }
      const messageSegmenter = new MessageSegmenter(msg.text, [
        {
          knownCards: msg.knownCards,
          numUnknownCards: msg.numUnknownCards,
        },
      ]);
      return {
        orderIndex: msg.orderIndex,
        name: msg.playerName,
        message: messageSegmenter.segmentMessage(),
        type: msg.type,
      };
    }),
  );

  @ViewChild('logScroller') private logContainer!: ElementRef;

  private readonly webSocketMessageDecoder = inject(MessageDecoderService);

  ngOnInit(): void {
    this.webSocketMessageDecoder.subscribeToLogMessage((logMessage: LogMessage) => {
      this.rawLogMessages.update((messages) => [...messages, logMessage]);
      this.scrollLogToBottom();
    });
    this.scrollLogToBottom();
  }

  ngAfterViewChecked() {
    this.scrollLogToBottom();
  }

  private scrollLogToBottom(): void {
    window.requestAnimationFrame(() => {
      try {
        this.logContainer.nativeElement.scrollTop = this.logContainer.nativeElement.scrollHeight;
      } catch (_e) {}
    });
  }
}
