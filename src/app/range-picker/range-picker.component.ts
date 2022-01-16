import {Component, Input, ElementRef, OnInit, ViewChild, SimpleChanges, EventEmitter, Output} from '@angular/core';

export interface RangePickEvent {
  value: string;
}

@Component({
  selector: 'app-range-picker',
  templateUrl: './range-picker.component.html',
  styleUrls: ['./range-picker.component.css']
})
export class RangePickerComponent implements OnInit {

  public selectedVal: string = 'daily';

  
  @Output() pickRange: EventEmitter<RangePickEvent> = new EventEmitter();

  
  constructor() { }
  
  ngOnInit(): void {
  }

  public setDateRange(value: string) {
    this.selectedVal = value;
    this.pickRange.emit({ value: value });
  }
}
