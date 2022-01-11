import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HeatingComponent} from "./heating/heating.component";
import {ElectricityComponent} from "./electricity/electricity.component";
import {InverterComponent} from "./inverter/inverter.component";

const routes: Routes = [
  { path: 'heating', component:  HeatingComponent},
  { path: 'inverter', component:  InverterComponent},
  { path: 'electricity', component:  ElectricityComponent},
  { path: '**', redirectTo: '/inverter', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
