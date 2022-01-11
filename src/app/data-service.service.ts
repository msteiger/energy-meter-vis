import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, Subject} from "rxjs";
import { delay, map, shareReplay } from "rxjs/operators";

interface Image {

}

@Injectable({
  providedIn: 'root'
})
export class DataServiceService {

  private cache$!: Observable<Image[]>;

  constructor(private http: HttpClient) {
    //
  }
  /*
    getImages(): Observable<Image[]> {
      if (!this.cache$) {
        this.cache$ = this.downloadImages().pipe(
          shareReplay(1)
        );
      }
      return this.cache$;
    }

    downloadImages(): Observable<Image[]> {
      return this.http.get<ServiceImage[]>('api/json-report')
        .pipe(map(serviceImgs => serviceImgs));
    }

   */
}
