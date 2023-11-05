import {AfterContentInit, AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {DataService, Measurement, MeasurementData, StatsData} from "../data-service.service";
import {ChartViewComponent} from "../chart-view/chart-view.component";
import { TimeFrame } from '../time-frame';
import {zip} from "rxjs";
import 'chartjs-adapter-date-fns';
import { ActivatedRoute, Router } from '@angular/router';
import { RangePickerComponent } from '../range-picker/range-picker.component';
import { delay } from 'rxjs/operators';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterContentInit, AfterViewInit  {

  @ViewChild('inverterChart') private inverterChartView!: ChartViewComponent;
  @ViewChild('electricChart') private electricChartView!: ChartViewComponent;
  @ViewChild('heatingChart') private heatingChartView!: ChartViewComponent;
  @ViewChild(RangePickerComponent) private rangePicker!: RangePickerComponent;

  error?: string;

  maxLoadingCount = 0;

  savedDates = new Map<TimeFrame, string>();

  currentDate: string = 'trigger-reload';
  prevDate?: string;
  nextDate?: string;

  range: TimeFrame = TimeFrame.DAILY;

  inverterColors = ['#9fdaba', '#dada15', '#da9a15', '#9ada15'];
  electricColors = ['#dada15', '#B1B15D', '#93D193', '#ee80a6'];
  heatingColors = ['#7373A1', '#6799ec', '#71bad5'];

  private regexHourly  = new RegExp('^(20[0-9]{2})-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])T([0-2][0-9]):([0-5][0-9])');
  private regexDaily   = new RegExp('^(20[0-9]{2})-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$');
  private regexMonthly = new RegExp('^(20[0-9]{2})-(0[1-9]|1[012])$');

  inverterInfo = new Map();
  heaterInfo = new Map();
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

  gotoDateAndRange(date?: string) {
    if (date === undefined) {
      date = '';
    }

    date = date.substring(0, 16); // cut off after minute

    if (this.currentDate === date) {
      // the first load of the page will trigger setting a date param and a reload
      // the current date is already set so we can exit early in that case
      return;
    }

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

    this.loadData(0, this.currentDate);
  }

  pickRange(range: TimeFrame) {
    if (range === this.range) {
      return;
    }

    this.savedDates.set(this.range, this.currentDate);
    this.currentDate = this.savedDates.get(range) || '';

    this.range = range;

    this.loadData(0, this.currentDate);
  }

  gotoDate(delta: number, date?: string) {
    if (date === this.currentDate) {
      return;
    }

    this.currentDate = date || '';
    this.loadData(delta, this.currentDate);
  }

  loadData(delta: number, date?: string) {
    this.loadInverterAndHeaterData(delta, date);
    this.loadElectricData(delta, date);
    this.loadHeatingData(delta, date);
    this.loadInfoBoxData(date);
  }

  loadInfoBoxData(date?: string) {
    this.inverterInfo.clear();
    this.heaterInfo.clear();
    this.electricInfo.clear();

    if (this.range != TimeFrame.DAILY) {
      // we have stats only for daily frames
      return;
    }

    const inv$ = this.dataService.getInverterStats(date);
    const deye1$ = this.dataService.getDeyeInverterStats(date, "east");
    const deye2$ = this.dataService.getDeyeInverterStats(date, "west");

    zip(inv$, deye1$, deye2$).subscribe( {
      next: value => this.updateInverterInfoBox(value[0], value[1], value[2])
    });

    const heater$ = this.dataService.getHeaterStats(date);

    heater$.subscribe( {
        next: value => this.updateHeaterInfoBox(value) });

    this.electricInfo.clear();
    const in$ = this.dataService.getEmPowerStats('in', date);
    const out$ = this.dataService.getEmPowerStats('out', date);

    zip(in$, out$).subscribe( {
        next: value => this.updateElectricInfoBox(value[0], value[1]) });
  }

  private loadInverterAndHeaterData(delta: number, date?: string) {
    this.inverterChartView?.clearData(-delta);

    const invData$ = this.dataService.getInverter(this.range, date);
    const deyeData1$ = this.dataService.getDeyeInverter(this.range, date, "east");
    const deyeData2$ = this.dataService.getDeyeInverter(this.range, date, "west");
    const heaterData$ = this.dataService.getHeaterPower(this.range, date);

    zip(heaterData$, invData$, deyeData1$, deyeData2$).subscribe({
      next: value => {
        this.inverterChartView.setDataArray(value, this.range, delta, ['heater', 'inv', 'inv', 'inv']);
        this.updateView(value[1]); // use invData to compute next/prev time range
      },
      error: error => this.error = error.statusText + " (" + error.status + ") - " + error.error,
    });
  }

  private loadElectricData(delta: number, date?: string) {
    this.electricChartView?.clearData(-delta);

    let lOut$ = this.dataService.getEmPowerOut(this.range, date);
    let l1$ = this.dataService.getEmPowerIn(this.range, date, 1);
    let l2$ = this.dataService.getEmPowerIn(this.range, date, 2);
    let l3$ = this.dataService.getEmPowerIn(this.range, date, 3);
    let lIn$ = this.dataService.getEmPowerIn(this.range, date);

    zip(lOut$, l1$, l2$, l3$).subscribe({
        next: values => this.electricChartView.setDataArray(values, this.range, delta, ['out', 'in', 'in', 'in']),
        error: error => this.error = error.statusText + " (" + error.status + ") - " + error.error,
    });

    zip(lOut$, lIn$).pipe(delay(1000)).subscribe({       // delay 1000ms to ensure that the slide-in animation has finished
        next: values => this.electricChartView.setOverlayData(this.combine(values[0].data, values[1].data), "Absolute"),
        error: error => this.error = error.statusText + " (" + error.status + ") - " + error.error,
    });
  }

  private loadHeatingData(delta: number, date?: string) {
    this.heatingChartView?.clearData(-delta);

    const data1$ = this.dataService.getHeating(this.range, 'extern', date);
    const data2$ = this.dataService.getHeating(this.range, 'boiler', date);
    const data3$ = this.dataService.getHeating(this.range, 'kessel', date);

    zip(data1$, data2$, data3$).subscribe({
      next: values => this.heatingChartView.setDataArray(values, this.range, delta),
      error: error => this.error = error.statusText + " (" + error.status + ") - " + error.error
    });
  }

  private updateView(data?: MeasurementData) {
    if (data) {
      this.router.navigate([], { queryParams: { date: data.current }})
      this.currentDate = data.current.substring(0, 16); // cut off seconds
      this.nextDate = data.next ? data.next : '';
      this.prevDate = data.prev ? data.prev : '';
    }
  }

  private updateInverterInfoBox(stats: StatsData, statsExtra1 : StatsData, statsExtra2: StatsData) {
    this.inverterInfo.set('Today', this.toKwhExtra(stats.today, statsExtra1.today + statsExtra2.today));
    this.inverterInfo.set('30 Days', this.toKwhExtra(stats.last30Days, statsExtra1.last30Days + statsExtra2.last30Days, 0));
    this.inverterInfo.set('This Year', this.toKwhExtra(stats.yearToDate, statsExtra1.yearToDate + statsExtra2.yearToDate, 0));
  };

  private updateHeaterInfoBox(stats: StatsData) {
    this.heaterInfo.set('Today', this.toKwh(stats.today));
    this.heaterInfo.set('30 Days', this.toKwh(stats.last30Days));
    this.heaterInfo.set('This Year', this.toKwh(stats.yearToDate));
  };

  private updateElectricInfoBox(statsIn: StatsData, statsOut: StatsData) {
    this.electricInfo.set('Today', this.toKwh(statsIn.today) + ' / ' + this.toKwh(statsOut.today));
    this.electricInfo.set('30 Days', this.toKwh(statsIn.last30Days) + ' / ' + this.toKwh(statsOut.last30Days));
    this.electricInfo.set('This Year', this.toKwh(statsIn.yearToDate) + ' / ' + this.toKwh(statsOut.yearToDate));
  };

  private toKwhShort(watt: number, precision?: number) {
    return (watt / 1000).toFixed(precision ?? 1);
  }

  private toKwh(watt: number, precision?: number) {
    return this.toKwhShort(watt, precision) + ' kWh';
  }

  private toKwhExtra(watt: number, wattExtra: number, precision?: number) {
    return this.toKwhShort(watt, precision) + ' + ' + this.toKwh(wattExtra, precision);
  }

  public getLoadingFactor(): number {
    const count = this.dataService.getLoadingCount();
    if (count > this.maxLoadingCount) {
      this.maxLoadingCount = count;
    }
    return 100 * (1 - count / this.maxLoadingCount);
  }

  private combine(dataA: Measurement[], dataB: Measurement[]): Measurement[] {
    // fails if X is different or number of elements is different
    return dataA.map((a, i) => {
      const b = dataB[i];
      return {x: a.x, y:a.y + b.y, measurements: a.measurements + b.measurements };
    });
  }
}
