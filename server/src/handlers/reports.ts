
import { type DaybookReportInput, type LedgerReportInput, type TrialBalanceInput } from '../schema';

export declare function getDaybookReport(input: DaybookReportInput): Promise<any[]>;
export declare function getLedgerReport(input: LedgerReportInput): Promise<any[]>;
export declare function getTrialBalance(input: TrialBalanceInput): Promise<any[]>;
export declare function getProfitAndLoss(input: { start_date: Date; end_date: Date }): Promise<any>;
export declare function getBalanceSheet(input: { as_on_date: Date }): Promise<any>;
