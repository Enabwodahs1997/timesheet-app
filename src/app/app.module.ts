import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { DepartmentListComponent } from './components/department-list/department-list.component';
import { TimesheetEntryComponent } from './components/timesheet-entry/timesheet-entry.component';
import { AnalysisComponent } from './components/analysis/analysis.component';

@NgModule({
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    AppComponent,
    DepartmentListComponent,
    TimesheetEntryComponent,
    AnalysisComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
