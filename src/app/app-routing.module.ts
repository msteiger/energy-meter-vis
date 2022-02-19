import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {InverterComponent} from "./inverter/inverter.component";

const routes: Routes = [
  { path: 'inverter', component:  InverterComponent},
  { path: '**', redirectTo: '/inverter', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
