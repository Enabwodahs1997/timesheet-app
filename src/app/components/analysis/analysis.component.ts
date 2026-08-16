import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TimesheetService } from '../../services/timesheet.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analysis',
  templateUrl: './analysis.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AnalysisComponent implements OnInit {
  editingId?: string;
  draft: any = null;
  selectedRange: 'all' | 'week' | 'month' | '30d' | 'custom' = 'all';
  selectedDepartment = 'all';
  customStartDate = '';
  customEndDate = '';

  constructor(public service: TimesheetService) {}

  ngOnInit() {
    this.service.getAll().subscribe();
    this.service.getDepartments().subscribe();
    this.service.getEmployees().subscribe();
  }

  clearFilters(): void {
    this.selectedRange = 'all';
    this.selectedDepartment = 'all';
    this.customStartDate = '';
    this.customEndDate = '';
  }

  onCustomDateChange(): void {
    if (this.customStartDate || this.customEndDate) {
      this.selectedRange = 'custom';
    } else if (this.selectedRange === 'custom') {
      this.selectedRange = 'all';
    }
  }

  getCustomDateRange(): { start: Date; end: Date } | null {
    const hasStart = !!this.customStartDate;
    const hasEnd = !!this.customEndDate;

    if (!hasStart && !hasEnd) {
      return null;
    }

    const startDate = hasStart ? new Date(`${this.customStartDate}T00:00:00`) : new Date('2000-01-01T00:00:00');
    const endDate = hasEnd ? new Date(`${this.customEndDate}T23:59:59`) : new Date('2100-12-31T23:59:59');

    if (startDate > endDate) {
      return { start: endDate, end: startDate };
    }

    return { start: startDate, end: endDate };
  }

  getEntryRate(entry: any): number {
    return Number(entry?.payAmount ?? 0);
  }

  getEntryTotalPay(entry: any): number {
    return Number(entry?.totalPay ?? ((entry?.payAmount ?? 0) * (entry?.hours ?? 0)));
  }

  getDepartmentName(departmentId: string, departments: any[] = []): string {
    if (!departmentId) return 'Unassigned';
    const match = departments.find((department: any) => (department._id || department.id) === departmentId);
    return match?.name || departmentId;
  }

  getEmployeeName(employeeId: string, employees: any[] = []): string {
    if (!employeeId) return 'Unassigned employee';
    const match = employees.find((employee: any) => (employee._id || employee.id) === employeeId);
    return match?.name || employeeId;
  }

  getRangeStart(date: Date = new Date()) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    if (this.selectedRange === 'custom') {
      const customRange = this.getCustomDateRange();
      if (customRange) {
        return customRange.start;
      }
    }

    if (this.selectedRange === 'week') {
      start.setDate(start.getDate() - start.getDay());
    } else if (this.selectedRange === 'month') {
      start.setDate(1);
    } else if (this.selectedRange === '30d') {
      start.setDate(start.getDate() - 29);
    } else {
      start.setFullYear(2000, 0, 1);
    }

    return start;
  }

  getRangeEnd(date: Date = new Date()) {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    if (this.selectedRange === 'custom') {
      const customRange = this.getCustomDateRange();
      if (customRange) {
        return customRange.end;
      }
    }

    if (this.selectedRange === 'week') {
      end.setDate(end.getDate() + (6 - end.getDay()));
    } else if (this.selectedRange === 'month') {
      end.setMonth(end.getMonth() + 1, 0);
    } else if (this.selectedRange === '30d') {
      end.setDate(end.getDate());
    } else {
      end.setFullYear(2100, 11, 31);
    }

    return end;
  }

  getFilteredEntries(entries: any[] = []): any[] {
    const start = this.getRangeStart();
    const end = this.getRangeEnd();

    return entries.filter((entry: any) => {
      const dateValue = new Date(entry.date);
      const isInRange = !isNaN(dateValue.getTime()) && dateValue >= start && dateValue <= end;
      const isInDepartment = this.selectedDepartment === 'all' || (entry.departmentId ?? '') === this.selectedDepartment;
      return isInRange && isInDepartment;
    });
  }

  getGrandTotal(entries: any[] = []): number {
    return entries.reduce((sum, entry) => sum + this.getEntryTotalPay(entry), 0);
  }

  getDepartmentTotals(entries: any[] = [], departments: any[] = []): Array<{ name: string; hours: number; total: number }> {
    const totals = new Map<string, { name: string; hours: number; total: number }>();

    for (const entry of entries) {
      const key = entry.departmentId || 'unassigned';
      const label = this.getDepartmentName(key, departments);
      const previous = totals.get(key) || { name: label, hours: 0, total: 0 };
      previous.hours += Number(entry.hours ?? 0);
      previous.total += this.getEntryTotalPay(entry);
      totals.set(key, previous);
    }

    return Array.from(totals.values()).sort((a, b) => b.total - a.total);
  }

  getChartData(entries: any[] = [], departments: any[] = []): Array<{ label: string; value: number; total: number }> {
    const chart = this.getDepartmentTotals(entries, departments);
    const max = Math.max(...chart.map(item => item.total), 1);
    return chart.map(item => ({
      label: item.name,
      value: item.total === 0 ? 0 : (item.total / max) * 100,
      total: item.total
    }));
  }

  getMonthlyTrend(entries: any[] = []): Array<{ label: string; value: number; total: number }> {
    const grouped = new Map<string, { key: string; label: string; total: number }>();

    for (const entry of entries) {
      const entryDate = new Date(entry.date);
      if (isNaN(entryDate.getTime())) {
        continue;
      }

      const key = `${entryDate.getFullYear()}-${entryDate.getMonth()}`;
      const label = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' }).format(entryDate);
      const current = grouped.get(key) || { key, label, total: 0 };
      current.total += this.getEntryTotalPay(entry);
      grouped.set(key, current);
    }

    const ordered = Array.from(grouped.values()).sort((a, b) => {
      const [aYear, aMonth] = a.key.split('-').map(value => Number(value));
      const [bYear, bMonth] = b.key.split('-').map(value => Number(value));
      return (aYear * 12 + aMonth) - (bYear * 12 + bMonth);
    });

    const max = Math.max(...ordered.map(item => item.total), 1);
    return ordered.map(item => ({
      label: item.label,
      value: item.total === 0 ? 0 : (item.total / max) * 100,
      total: item.total
    }));
  }

  getWeeklySummary(entries: any[] = []): { hours: number; total: number } {
    const filtered = this.getFilteredEntries(entries);
    let hours = 0;
    let total = 0;

    for (const entry of filtered) {
      hours += Number(entry.hours ?? 0);
      total += this.getEntryTotalPay(entry);
    }

    return { hours, total };
  }

  exportCsv(entries: any[] = []): void {
    const filtered = this.getFilteredEntries(entries);
    const employeeList = this.service.employees$ ? (this.service as any).employeesSubject?.getValue?.() ?? [] : [];
    const header = ['date', 'employee', 'hours', 'hourlyRate', 'totalPay', 'departmentId'];
    const csvRows = [header.join(',')].concat(filtered.map((entry: any) => {
      const employeeName = this.getEmployeeName(entry.employeeId ?? '', employeeList);
      const values = [
        entry.date ?? '',
        employeeName,
        Number(entry.hours ?? 0),
        Number(entry.payAmount ?? 0),
        this.getEntryTotalPay(entry),
        entry.departmentId ?? ''
      ];

      return values.map((value: any) => `"${String(value).replace(/"/g, '""')}"`).join(',');
    }));

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timesheet-report-${this.selectedRange}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  startEdit(entry: any) {
    const id = entry?._id || entry?.id;
    if (!id) return;

    this.editingId = id;
    this.draft = {
      date: entry.date ?? '',
      hours: Number(entry.hours ?? 0),
      payAmount: Number(entry.payAmount ?? 0),
      departmentId: entry.departmentId ?? ''
    };
  }

  cancelEdit() {
    this.editingId = undefined;
    this.draft = null;
  }

  saveEdit(entry: any) {
    const id = entry?._id || entry?.id;
    if (!id || !this.draft) return;

    const updatedEntry = {
      date: this.draft.date,
      hours: Number(this.draft.hours ?? 0),
      payAmount: Number(this.draft.payAmount ?? 0),
      departmentId: this.draft.departmentId ?? entry.departmentId ?? '',
      totalPay: Number((Number(this.draft.hours ?? 0) * Number(this.draft.payAmount ?? 0)).toFixed(2))
    };

    this.service.updateEntry(id, updatedEntry).subscribe(() => {
      this.cancelEdit();
      this.service.getAll().subscribe();
    });
  }

  deleteEntry(entry: any) {
    const id = entry?._id || entry?.id;
    if (!id) return;

    this.service.deleteEntry(id).subscribe(() => {
      this.service.getAll().subscribe();
    });
  }
}
