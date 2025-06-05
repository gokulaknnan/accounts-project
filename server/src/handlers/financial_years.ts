
import { type FinancialYear, type CreateFinancialYearInput, type DeleteInput } from '../schema';

export declare function createFinancialYear(input: CreateFinancialYearInput): Promise<FinancialYear>;
export declare function getFinancialYears(): Promise<FinancialYear[]>;
export declare function getActiveFinancialYear(): Promise<FinancialYear | null>;
export declare function setActiveFinancialYear(input: { id: number }): Promise<FinancialYear>;
export declare function deleteFinancialYear(input: DeleteInput): Promise<{ success: boolean }>;
