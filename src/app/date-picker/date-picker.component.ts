import {Component, Input, ElementRef, OnInit, ViewChild, SimpleChanges, EventEmitter, Output} from '@angular/core';
import {MatButton} from "@angular/material/button";
import {MatInput} from "@angular/material/input";

export interface NavigateEvent {
  delta: number;
  value?: string;
}

@Component({
  selector: 'app-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.css']
})
export class DatePickerComponent implements OnInit {

  constructor() { }

  @Input() currentValue?: string;
  @Input() prevValue?: string;
  @Input() nextValue?: string;

  @Output() navigate: EventEmitter<NavigateEvent> = new EventEmitter();

  ngOnInit(): void {
  }

  gotoValue(delta: number) {
    this.navigate.emit({
      delta: Math.sign(delta),
      value: (delta > 0) ? this.nextValue : this.prevValue
    });
  }
}
