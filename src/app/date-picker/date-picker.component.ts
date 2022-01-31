import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { format } from 'date-fns'

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

    //  we get the date in local TZ and just use the local date
    const isoDate = format(event.value!, "yyyy-MM-dd");

    this.navigate.emit({
      delta: 0,
      value: isoDate
    });
  }

  gotoValue(delta: number) {
    this.navigate.emit({
      delta: Math.sign(delta),
      value: (delta > 0) ? this.nextValue : this.prevValue
    });
  }
}
