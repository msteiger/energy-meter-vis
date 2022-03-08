import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { TimeFrame } from './time-frame';

export interface MeasurementData {
  desc: SensorType,
  start: number,
  end: number,
  current: string,
  prev?: string,
  next?: string
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

  public getInverter(range: TimeFrame, date?: string): Observable<MeasurementData> {
    return this.getData('inverter-ac-power', range, date);
  }

  public getHeaterPower(range: TimeFrame, date?: string): Observable<MeasurementData> {
    return this.getData('heater-power', range, date);
  }

  public getEmPowerOut(range: TimeFrame, date?: string): Observable<MeasurementData> {
    return this.getEmPower(false, range, date).pipe(map(data => this.negateValues(data)));
  }

  public getEmPowerIn(range: TimeFrame, date?: string, idx?: number): Observable<MeasurementData> {
    return this.getEmPower(true, range, date, idx).pipe(map(mmtData => {
      mmtData.desc.max *= 0.5; // the sum is 3x the maximum = 7.5k, which is way too much
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

  public getHeating(range: TimeFrame, id: string, date?: string): Observable<MeasurementData> {
    const fullId = 'heating-' + id;
    return this.getData(fullId, range, date);
  }

  private getData(id: string, range: TimeFrame, date?: string): Observable<MeasurementData> {
    const frame = TimeFrame[range].toLowerCase();

    this.loading++;

    let data$ = this.getRealData(id, frame, date);

    if (range == TimeFrame.MONTHLY && !id.startsWith("heating-")) {
      data$ = data$.pipe(map(this.avgToSum));
    }

    data$.subscribe({
        error: () => this.loading--,
        complete: () => this.loading--
      });

    return data$;
  }

  private getMockData(id: string, frame: string, date?: string): Observable<MeasurementData> {
    const root = 'assets/data'

    if (date) {
      date = '_' + date;
    }

    const url = root + '/' + frame + '/' + id + date + '.json';

    return this.http.get<MeasurementData>(url);
  }

  private getRealData(id: string, frame: string, date?: string): Observable<MeasurementData> {

    let params = new HttpParams();

    if (date) {
      params = params.set('date', date);
    }

    const root = 'data'

    const url = root + '/' + id + '/' + frame;

    return this.http.get<MeasurementData>(url, { params: params });
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

