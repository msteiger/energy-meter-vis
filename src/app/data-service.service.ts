import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BehaviorSubject, Observable, Subject} from "rxjs";
import { delay, map, shareReplay } from "rxjs/operators";
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

  constructor(private http: HttpClient) {
    //
  }

  public getInverter(range: TimeFrame, date?: string): Observable<MeasurementData> {
    return this.getData('inverter-ac-power', range, date);
  }

  public getEmPowerIn(range: TimeFrame, date: string, idx?: number) {
    let id = 'em-power-in';
    
    if (idx && idx >= 1 && idx <= 3) {
      id += '-l' + idx;
    }

    return this.getData(id, range, date);
  }

  private getData(id: string, range: TimeFrame, date?: string): Observable<MeasurementData> {

    let params = new HttpParams();
    
    if (date) {
      params = params.set('date', date);
    }

    const root = 'data'
    const frame = TimeFrame[range].toLowerCase();

    const url = root + '/' + id + '/' + frame;

    return this.http
      .get<MeasurementData>(url, { params: params })
      .pipe(map(data => data));
  }

}

