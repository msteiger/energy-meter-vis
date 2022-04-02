import {AfterContentInit, AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {DataService, MeasurementData, StatsData} from "../data-service.service";
import {ChartViewComponent} from "../chart-view/chart-view.component";
import { TimeFrame } from '../time-frame';
import {zip} from "rxjs";
import 'chartjs-adapter-date-fns';
import { ActivatedRoute, Router } from '@angular/router';
import { RangePickerComponent } from '../range-picker/range-picker.component';


@Component({
  selector: 'app-inverter',
  templateUrl: './inverter.component.html',
  styleUrls: ['./inverter.component.scss']
})
export class InverterComponent implements OnInit, AfterContentInit, AfterViewInit  {

  @ViewChild('inverterChart') private inverterChartView!: ChartViewComponent;
  @ViewChild('electricChart') private electricChartView!: ChartViewComponent;
  @ViewChild('heatingChart') private heatingChartView!: ChartViewComponent;
  @ViewChild(RangePickerComponent) private rangePicker!: RangePickerComponent;

  error?: string;

  savedDates = new Map<TimeFrame, string>();

  currentDate: string = '';
  prevDate?: string;
  nextDate?: string;

  range: TimeFrame = TimeFrame.DAILY;

  inverterColors = ['#9fdaba', '#dada15'];
  electricColors = ['#dada15', '#B1B15D', '#93D193', '#ee80a6'];
  heatingColors = ['#7373A1', '#6799ec', '#71bad5'];

  private regexHourly  = new RegExp('^(20[0-9]{2})-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])T([0-2][0-9]):([0-5][0-9]):([0-5][0-9])Z$');
  private regexDaily   = new RegExp('^(20[0-9]{2})-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$');
  private regexMonthly = new RegExp('^(20[0-9]{2})-(0[1-9]|1[012])$');

  inverterInfo = new Map();
  electricInfo = new Map();

  constructor(public dataService: DataService, private router: Router,  private route: ActivatedRoute) {
      // empty
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
        this.gotoDateAndRange(params.date);
      }
    );
  }

  gotoDateAndRange(date: string) {
    if (this.regexHourly.test(date)) {
      this.range = TimeFrame.HOURLY;
    } else if (this.regexDaily.test(date)) {
      this.range = TimeFrame.DAILY;
    } else if (this.regexMonthly.test(date)) {
      this.range = TimeFrame.MONTHLY;
    } else {
      date = '';
      this.range = TimeFrame.DAILY;
    }

    this.currentDate = date;

    this.loadData(this.currentDate);
  }

  pickRange(range: TimeFrame) {
    if (range === this.range) {
      return;
    }

    this.savedDates.set(this.range, this.currentDate);
    this.currentDate = this.savedDates.get(range) || '';

    this.range = range;

    this.loadData(this.currentDate);
  }

  gotoDate(delta: number, date?: string) {
    if (date === this.currentDate) {
      return;
    }

    this.currentDate = date || '';
    this.loadData(this.currentDate);
  }

  loadData(date?: string) {
    this.loadInverterAndHeaterData(date);
    this.loadElectricData(date);
    this.loadHeatingData(date);
    this.loadInfoBoxData(date);
  }

  loadInfoBoxData(date?: string) {
    this.inverterInfo.clear();
    const inv$ = this.dataService.getInverterStats(date);

    inv$.subscribe( {
      next: value => this.updateInverterInfoBox(value) });

    this.electricInfo.clear();
    const in$ = this.dataService.getEmPowerStats('in', date);
    const out$ = this.dataService.getEmPowerStats('out', date);

    zip(in$, out$).subscribe( {
        next: value => this.updateElectricInfoBox(value[0], value[1]) });
  }

  private loadInverterAndHeaterData(date?: string) {
    const invData$ = this.dataService.getInverter(this.range, date);
    const heaterData$ = this.dataService.getHeaterPower(this.range, date);

    zip(heaterData$, invData$).subscribe({
      next: value => {
        this.inverterChartView.setDataArray(value, this.range);
        this.updateView(value[0]);
      },
      error: error => this.error = error.statusText + " (" + error.status + ") - " + error.error,
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
      });
  }

  private loadHeatingData(date?: string) {
    const data1$ = this.dataService.getHeating(this.range, 'extern', date);
    const data2$ = this.dataService.getHeating(this.range, 'boiler', date);
    const data3$ = this.dataService.getHeating(this.range, 'kessel', date);

    zip(data1$, data2$, data3$).subscribe({
      next: values => this.heatingChartView.setDataArray(values, this.range),
      error: error => this.error = error.statusText + " (" + error.status + ") - " + error.error
    });
  }

  private updateView(data?: MeasurementData) {
    if (data) {
      this.router.navigate(['dashboard'], { queryParams: { date: data.current }})

//      this.currentDate = data.current;
      this.nextDate = data.next;
      this.prevDate = data.prev;
    }
  }

  private updateInverterInfoBox(stats: StatsData) {
    this.inverterInfo.set('Today', this.toKwh(stats.today));
    this.inverterInfo.set('30 Days', this.toKwh(stats.last30Days));
    this.inverterInfo.set('This Year', this.toKwh(stats.yearToDate));
  };

  private updateElectricInfoBox(statsIn: StatsData, statsOut: StatsData) {
    this.electricInfo.set('Today', this.toKwh(statsIn.today) + ' / ' + this.toKwh(statsOut.today));
    this.electricInfo.set('30 Days', this.toKwh(statsIn.last30Days) + ' / ' + this.toKwh(statsOut.last30Days));
    this.electricInfo.set('This Year', this.toKwh(statsIn.yearToDate) + ' / ' + this.toKwh(statsOut.yearToDate));
  };

  private toKwh(watt: number) {
    return (watt / 1000).toFixed(1) + ' kWh';
  }

  public getLoadingFactor(): number {
    const count = this.dataService.getLoadingCount();
    const maxCount = 8;
    return 100 * (1 - count / maxCount);
  }

}
