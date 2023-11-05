import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { TimeFrame } from './time-frame';

export interface StatsData {
  yearToDate: number,
  today: number,
  last30Days: number,
}

export interface MeasurementData {
  desc: SensorType,
  start: number,
  end: number,
  current: string,
  prev?: string,
  next?: string
  maxGapWidth?: number,
  data: Measurement[]
}

export interface Measurement {
  measurements: number,
  x: number,
  y: number
}

export interface SensorType {
  id: string;
  name: string,
  unit: string,
  min: number,
  max: number
}

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private loading = 0;

  constructor(private http: HttpClient) {
    //
  }

  public getLoadingCount() {
    return this.loading;
  }

  public getDeyeInverterStats(date?: string, id?: string): Observable<StatsData> {
    return this.getStats('deye-ac-power-' + id, date);
  }

  public getDeyeInverter(range: TimeFrame, date?: string, id?: string): Observable<MeasurementData> {
    return this.getData('deye-ac-power-' + id, range, date);
  }

  public getInverterStats(date?: string): Observable<StatsData> {
    return this.getStats('inverter-ac-power', date);
  }

  public getInverter(range: TimeFrame, date?: string): Observable<MeasurementData> {
    return this.getData('inverter-ac-power', range, date);
  }

  public getHeaterStats(date?: string): Observable<StatsData> {
    return this.getStats('heater-power', date);
  }

  public getHeaterPower(range: TimeFrame, date?: string): Observable<MeasurementData> {
    return this.getData('heater-power', range, date);
  }

  public getEmPowerOut(range: TimeFrame, date?: string): Observable<MeasurementData> {
    return this.getEmPower(false, range, date)
      .pipe(map(data => this.negateValues(data)))
      .pipe(map(data => { data.desc.min *= 0.5; return data; }));
  }

  public getEmPowerIn(range: TimeFrame, date?: string, idx?: number): Observable<MeasurementData> {
    return this.getEmPower(true, range, date, idx).pipe(map(mmtData => {
      mmtData.desc.max *= 0.4; // the sum is 3x the maximum = 7.5k, which is way too much
      return mmtData;
    }));
  }

  public getEmPower(isIn: boolean, range: TimeFrame, date?: string, idx?: number) {
    let id = 'em-power-';

    id += isIn ? 'in' : 'out';

    if (idx && idx >= 1 && idx <= 3) {
      id += '-l' + idx;
    }

    return this.getData(id, range, date);
  }

  public getEmPowerStats(dir: string, date?: string): Observable<StatsData> {
    return this.getStats('em-power-' + dir, date);
  }

  public getHeating(range: TimeFrame, id: string, date?: string): Observable<MeasurementData> {
    const fullId = 'heating-' + id;
    return this.getData(fullId, range, date)
      .pipe(map(data => {
        data.maxGapWidth = 2 * 3600 * 1000;
        return data;
      }));
  }

  private getData(id: string, range: TimeFrame, date?: string): Observable<MeasurementData> {
    const frame = TimeFrame[range].toLowerCase();

    this.loading++;

    let data$ = this.loadData(id, frame, date);

    if (range == TimeFrame.MONTHLY && !id.startsWith("heating-")) {
      data$ = data$.pipe(map(this.avgToSum));
    }

    data$.subscribe({
        error: () => this.loading--,
        complete: () => this.loading--
      });

    return data$;
  }

  private loadData(id: string, frame: string, date?: string): Observable<MeasurementData> {

    let params = new HttpParams();

    if (date) {
      params = params.set('date', date);
    }

    const url = 'data' + '/' + id + '/' + frame;

    return this.http.get<MeasurementData>(url, { params: params });
  }

  private getStats(id: string, date?: string): Observable<StatsData> {

    let params = new HttpParams();

    if (date) {
      params = params.set('date', date);
    }

    const url = 'data' + '/' + id + '/' + 'stats';

    return this.http.get<StatsData>(url, { params: params });
  }

  private avgToSum(obj: MeasurementData): MeasurementData {
    obj.data.forEach(msmt => {
      msmt.y *= msmt.measurements / 60;
    });
    obj.desc.max *= 24;
    obj.desc.max *= 0.25; // scale down for prettier display
    return obj;
  }

  private negateValues(obj: MeasurementData): MeasurementData {
    obj.data.forEach(msmt => { if (msmt.y != 0) msmt.y = - msmt.y; });  // don't negate zero values to avoid ugly "-0"
    const tmp = obj.desc.min;
    obj.desc.min = - obj.desc.max;
    obj.desc.max = tmp;
    return obj;
  }
}

