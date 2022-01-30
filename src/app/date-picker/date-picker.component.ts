import { Component, Input, ElementRef, OnInit, ViewChild, SimpleChanges, EventEmitter, Output } from '@angular/core';
import { DateFnsAdapter } from '@angular/material-date-fns-adapter';
import { DateAdapter } from '@angular/material/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

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

  minCalendarValue = new Date(2021, 8, 11);
  maxCalendarValue = new Date();

  ngOnInit(): void {
  }

  pickValue(event: MatDatepickerInputEvent<Date>) {
    this.navigate.emit({
      delta: 0,
      value: event.value?.toISOString().substring(0, 10)
    });
  }

  gotoValue(delta: number) {
    this.navigate.emit({
      delta: Math.sign(delta),
      value: (delta > 0) ? this.nextValue : this.prevValue
    });
  }
}
