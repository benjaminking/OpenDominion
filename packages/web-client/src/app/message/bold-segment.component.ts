import { Component, input } from '@angular/core';

@Component({
  selector: 'bold-segment',
  templateUrl: './bold-segment.component.html',
  styleUrls: ['./bold-segment.component.css'],
})
export class BoldSegmentComponent {
  text = input.required<string>();
  size = input<string>('medium');
}
