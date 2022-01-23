import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { ChartViewComponent } from './chart-view/chart-view.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { HeatingComponent } from './heating/heating.component';
import { NgChartsModule } from 'ng2-charts';
import { ElectricityComponent } from './electricity/electricity.component';
import { BannerComponent } from './banner/banner.component';
import { InverterComponent } from './inverter/inverter.component';
import { DatePickerComponent } from './date-picker/date-picker.component';
import { MatTabsModule } from "@angular/material/tabs";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatInputModule } from "@angular/material/input";
import { RangePickerComponent } from './range-picker/range-picker.component';
import { HttpClientModule } from '@angular/common/http';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@NgModule({
  declarations: [
    AppComponent,
    ChartViewComponent,
    HeatingComponent,
    ElectricityComponent,
    BannerComponent,
    InverterComponent,
    DatePickerComponent,
    RangePickerComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatTabsModule,
    AppRoutingModule,
    NgChartsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    HttpClientModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }