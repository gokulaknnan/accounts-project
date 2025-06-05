
import { type Ledger, type CreateLedgerInput, type UpdateLedgerInput, type DeleteInput, type SearchInput } from '../schema';

export declare function createLedger(input: CreateLedgerInput): Promise<Ledger>;
export declare function getLedgers(): Promise<Ledger[]>;
export declare function getLedger(input: { id: number }): Promise<Ledger>;
export declare function updateLedger(input: UpdateLedgerInput): Promise<Ledger>;
export declare function deleteLedger(input: DeleteInput): Promise<{ success: boolean }>;
export declare function searchLedgers(input: SearchInput): Promise<Ledger[]>;
