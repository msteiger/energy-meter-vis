import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BehaviorSubject, Observable, Subject} from "rxjs";
import { delay, map, shareReplay } from "rxjs/operators";

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

  public getDailyInverter(day: string): Observable<MeasurementData> {

    let params = new HttpParams();
    
    if (day) {
      params = params.set('date', day);
    }  

    return this.http
      .get<MeasurementData>('data/inverter-ac-power/daily', { params: params })
      .pipe(map(data => data));
  }
}

