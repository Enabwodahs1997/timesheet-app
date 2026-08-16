import { Component, OnInit } from '@angular/core';
import { TimesheetService } from '../../services/timesheet.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analysis',
  templateUrl: './analysis.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class AnalysisComponent implements OnInit {
  constructor(public service: TimesheetService) {}

  ngOnInit() {
    this.service.getAll().subscribe();
  }
}
