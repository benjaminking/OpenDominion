import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'vp-segment',
  templateUrl: './vp-segment.component.html',
  styleUrls: ['./vp-segment.component.css'],
  imports: [CommonModule],
})
export class VPSegmentComponent {
  text = input.required<string>();
  size = input<string>('medium');
}
