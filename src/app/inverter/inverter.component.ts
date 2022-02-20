import {AfterContentInit, AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {DataService, MeasurementData} from "../data-service.service";
import {ChartViewComponent} from "../chart-view/chart-view.component";
import { TimeFrame } from '../time-frame';
import {zip} from "rxjs";
import 'chartjs-adapter-date-fns';
import { ActivatedRoute, Router } from '@angular/router';
import { RangePickerComponent } from '../range-picker/range-picker.component';


@Component({
  selector: 'app-inverter',
  templateUrl: './inverter.component.html',
  styleUrls: ['./inverter.component.css']
})
export class InverterComponent implements OnInit, AfterContentInit, AfterViewInit  {

  @ViewChild('inverterChart') private inverterChartView!: ChartViewComponent;
  @ViewChild('electricChart') private electricChartView!: ChartViewComponent;
  @ViewChild('heatingChart') private heatingChartView!: ChartViewComponent;
  @ViewChild(RangePickerComponent) private rangePicker!: RangePickerComponent;

  error?: string;
  loading: boolean = true

  savedOtherDate? = "2022-02";
  currentDate?: string;
  prevDate?: string;
  nextDate?: string;

  range: TimeFrame = TimeFrame.DAILY;

  inverterColors = ['#dada15'];
  electricColors = ['#dada15', '#B1B15D', '#93D193', '#ee80a6'];
  heatingColors = ['#7373A1', '#6799ec', '#71bad5'];

  private regexDaily   = new RegExp('^(20[0-9]{2})-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$');
  private regexMonthly = new RegExp('^(20[0-9]{2})-(0[1-9]|1[012])$');

  constructor(private dataService: DataService, private router: Router, private route: ActivatedRoute) {

  }

  ngAfterViewInit(): void {
    // TODO: find a better way to update the selected range-picker button
    setTimeout(() => {
      this.rangePicker.selectedVal = TimeFrame[this.range];
    });
  }

  ngAfterContentInit() {
  }

  ngOnInit() {
    this.route.queryParams
      .subscribe(params => {
        this.gotoDate(0, params.date);
      }
    );
  }

  pickRange(range: TimeFrame) {
    if (range === this.range) {
      return;
    }

    this.range = range;

    const tmp = this.savedOtherDate;
    this.savedOtherDate = this.currentDate;

    this.gotoDate(0, tmp);
  }

  gotoDate(delta: number, date?: string) {

    const today = new Date().toISOString().substring(0, 10);

    if (!date) {
      date = today;
    }

    if (date == this.currentDate) {
      return;
    }

    if (this.regexDaily.test(date)) {
      this.pickRange(TimeFrame.DAILY);
    } else if (this.regexMonthly.test(date)) {
      this.pickRange(TimeFrame.MONTHLY);
    } else {
      date = today;
      this.pickRange(TimeFrame.DAILY);
    }

    this.router.navigate(['dashboard'], { queryParams: { date: date }})

    this.loadInverterData(date);
    this.loadElectricData(date);
    this.loadHeatingData(date);
  }

  private loadInverterData(date?: string) {
//    this.loading = true;

    const invData$ = this.dataService.getInverter(this.range, date);
    invData$.subscribe({
      next: value => this.updateView(value),
      error: error => this.error = error.statusText + " (" + error.status + ") - " + error.error,
      complete: () => this.loading = false
    });
  }

  private loadElectricData(date?: string) {
    let lOut$ = this.dataService.getEmPowerOut(this.range, date);
    let l1$ = this.dataService.getEmPowerIn(this.range, date, 1);
    let l2$ = this.dataService.getEmPowerIn(this.range, date, 2);
    let l3$ = this.dataService.getEmPowerIn(this.range, date, 3);

    zip(lOut$, l1$, l2$, l3$).subscribe({
        next: values => this.electricChartView.setDataArray(values, this.range, ['out', 'in', 'in', 'in']),
        error: error => this.error = error.statusText + " (" + error.status + ") - " + error.error,
        complete: () => this.loading = false
      });
  }

  private loadHeatingData(date?: string) {
    const data1$ = this.dataService.getHeating(this.range, 'extern', date);
    const data2$ = this.dataService.getHeating(this.range, 'boiler', date);
    const data3$ = this.dataService.getHeating(this.range, 'kessel', date);

    zip(data1$, data2$, data3$).subscribe({
      next: values => this.heatingChartView.setDataArray(values, this.range),
      error: error => this.error = error.statusText + " (" + error.status + ") - " + error.error,
      complete: () => this.loading = false
    });
  }

  private updateView(data?: MeasurementData) {
    if (data) {
      this.inverterChartView.setData(data, this.range);
      this.currentDate = data.current;
      this.nextDate = data.next;
      this.prevDate = data.prev;
    }
  }
}
