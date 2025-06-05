
import { type TransactionEntry, type CreateTransactionInput, type DeleteInput } from '../schema';

export declare function createTransaction(input: CreateTransactionInput): Promise<TransactionEntry>;
export declare function getTransactions(): Promise<TransactionEntry[]>;
export declare function getTransaction(input: { id: number }): Promise<TransactionEntry>;
export declare function getTransactionsByDateRange(input: { start_date: Date; end_date: Date }): Promise<TransactionEntry[]>;
export declare function correctTransaction(input: { id: number; correction_data: CreateTransactionInput }): Promise<TransactionEntry>;
export declare function deleteTransaction(input: DeleteInput): Promise<{ success: boolean }>;
