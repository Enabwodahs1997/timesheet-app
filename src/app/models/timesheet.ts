export interface TimesheetEntry {
  date: string;
  hours: number;
  payAmount: number;
  totalPay?: number;
  departmentId: string;
  employeeId?: string;
}
