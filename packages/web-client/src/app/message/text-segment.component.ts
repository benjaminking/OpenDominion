import { Component, input } from '@angular/core';

@Component({
  selector: 'text-segment',
  templateUrl: './text-segment.component.html',
  styleUrls: ['./text-segment.component.css'],
})
export class TextSegmentComponent {
  text = input.required<string>();
  size = input<string>('medium');
}
