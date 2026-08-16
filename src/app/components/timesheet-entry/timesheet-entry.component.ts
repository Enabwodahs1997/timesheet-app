import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TimesheetService } from '../../services/timesheet.service';
import { TimesheetEntry } from '../../models/timesheet';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-timesheet-entry',
  templateUrl: './timesheet-entry.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class TimesheetEntryComponent implements OnInit, OnDestroy {
  entry: TimesheetEntry = { date: '', hours: 0, departmentId: '' };
  private sub?: Subscription;

  constructor(public service: TimesheetService) {}

  ngOnInit() {
    this.service.getDepartments().subscribe();

    const sel = this.service.getSelectedDepartment();
    if (sel) {
      this.entry.departmentId = sel._id || sel.id || '';
    }
    this.sub = this.service.selectedDepartment$.subscribe(d => {
      if (d) this.entry.departmentId = d._id || d.id || '';
    });
  }

  save() {
    if (!this.entry.date || !this.entry.departmentId || this.entry.hours <= 0) {
      return;
    }

    this.service.addEntry({ ...this.entry }).subscribe(() => {
      this.entry = { date: '', hours: 0, departmentId: '' };
    });
  }
  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
