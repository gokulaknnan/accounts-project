
import { db } from '../db';
import { transactionEntriesTable, transactionDetailsTable, ledgersTable } from '../db/schema';
import { type CreateTransactionInput, type TransactionEntry, type DeleteInput } from '../schema';
import { eq, and, gte, lte, desc, SQL } from 'drizzle-orm';

export const createTransaction = async (input: CreateTransactionInput): Promise<TransactionEntry> => {
  try {
    // Validate that all ledgers exist
    for (const detail of input.details) {
      const ledgerExists = await db.select({ id: ledgersTable.id })
        .from(ledgersTable)
        .where(eq(ledgersTable.id, detail.ledger_id))
        .execute();
      
      if (ledgerExists.length === 0) {
        throw new Error(`Ledger with id ${detail.ledger_id} does not exist`);
      }
    }

    // Validate that debits equal credits
    const totalDebits = input.details.reduce((sum, detail) => sum + detail.debit_amount, 0);
    const totalCredits = input.details.reduce((sum, detail) => sum + detail.credit_amount, 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error('Total debits must equal total credits');
    }

    // Calculate total amount (sum of all debits or credits)
    const totalAmount = totalDebits;

    // Generate entry number (simple timestamp-based for now)
    const entryNumber = `TXN-${Date.now()}`;

    // Insert transaction entry
    const entryResult = await db.insert(transactionEntriesTable)
      .values({
        entry_number: entryNumber,
        entry_date: input.entry_date,
        description: input.description,
        total_amount: totalAmount.toString(),
        is_correction: false,
        original_entry_id: null
      })
      .returning()
      .execute();

    const entry = entryResult[0];

    // Insert transaction details
    for (const detail of input.details) {
      await db.insert(transactionDetailsTable)
        .values({
          entry_id: entry.id,
          ledger_id: detail.ledger_id,
          debit_amount: detail.debit_amount.toString(),
          credit_amount: detail.credit_amount.toString(),
          description: detail.description || null
        })
        .execute();
    }

    // Return the transaction entry with numeric conversion
    return {
      ...entry,
      total_amount: parseFloat(entry.total_amount)
    };
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
};

export const getTransactions = async (): Promise<TransactionEntry[]> => {
  try {
    const results = await db.select()
      .from(transactionEntriesTable)
      .orderBy(desc(transactionEntriesTable.entry_date), desc(transactionEntriesTable.id))
      .execute();

    return results.map(entry => ({
      ...entry,
      total_amount: parseFloat(entry.total_amount)
    }));
  } catch (error) {
    console.error('Failed to get transactions:', error);
    throw error;
  }
};

export const getTransaction = async (input: { id: number }): Promise<TransactionEntry> => {
  try {
    const results = await db.select()
      .from(transactionEntriesTable)
      .where(eq(transactionEntriesTable.id, input.id))
      .execute();

    if (results.length === 0) {
      throw new Error(`Transaction with id ${input.id} not found`);
    }

    const entry = results[0];
    return {
      ...entry,
      total_amount: parseFloat(entry.total_amount)
    };
  } catch (error) {
    console.error('Failed to get transaction:', error);
    throw error;
  }
};

export const getTransactionsByDateRange = async (input: { start_date: Date; end_date: Date }): Promise<TransactionEntry[]> => {
  try {
    const results = await db.select()
      .from(transactionEntriesTable)
      .where(
        and(
          gte(transactionEntriesTable.entry_date, input.start_date),
          lte(transactionEntriesTable.entry_date, input.end_date)
        )
      )
      .orderBy(desc(transactionEntriesTable.entry_date), desc(transactionEntriesTable.id))
      .execute();

    return results.map(entry => ({
      ...entry,
      total_amount: parseFloat(entry.total_amount)
    }));
  } catch (error) {
    console.error('Failed to get transactions by date range:', error);
    throw error;
  }
};

export const correctTransaction = async (input: { id: number; correction_data: CreateTransactionInput }): Promise<TransactionEntry> => {
  try {
    // Verify original transaction exists
    const originalResults = await db.select()
      .from(transactionEntriesTable)
      .where(eq(transactionEntriesTable.id, input.id))
      .execute();

    if (originalResults.length === 0) {
      throw new Error(`Original transaction with id ${input.id} not found`);
    }

    // Validate that all ledgers exist for correction
    for (const detail of input.correction_data.details) {
      const ledgerExists = await db.select({ id: ledgersTable.id })
        .from(ledgersTable)
        .where(eq(ledgersTable.id, detail.ledger_id))
        .execute();
      
      if (ledgerExists.length === 0) {
        throw new Error(`Ledger with id ${detail.ledger_id} does not exist`);
      }
    }

    // Validate that debits equal credits for correction
    const totalDebits = input.correction_data.details.reduce((sum, detail) => sum + detail.debit_amount, 0);
    const totalCredits = input.correction_data.details.reduce((sum, detail) => sum + detail.credit_amount, 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error('Total debits must equal total credits');
    }

    // Calculate total amount
    const totalAmount = totalDebits;

    // Generate correction entry number
    const entryNumber = `COR-${input.id}-${Date.now()}`;

    // Insert correction entry
    const correctionResult = await db.insert(transactionEntriesTable)
      .values({
        entry_number: entryNumber,
        entry_date: input.correction_data.entry_date,
        description: input.correction_data.description,
        total_amount: totalAmount.toString(),
        is_correction: true,
        original_entry_id: input.id
      })
      .returning()
      .execute();

    const correctionEntry = correctionResult[0];

    // Insert correction details
    for (const detail of input.correction_data.details) {
      await db.insert(transactionDetailsTable)
        .values({
          entry_id: correctionEntry.id,
          ledger_id: detail.ledger_id,
          debit_amount: detail.debit_amount.toString(),
          credit_amount: detail.credit_amount.toString(),
          description: detail.description || null
        })
        .execute();
    }

    // Return the correction entry with numeric conversion
    return {
      ...correctionEntry,
      total_amount: parseFloat(correctionEntry.total_amount)
    };
  } catch (error) {
    console.error('Transaction correction failed:', error);
    throw error;
  }
};

export const deleteTransaction = async (input: DeleteInput): Promise<{ success: boolean }> => {
  try {
    // Check if transaction exists
    const transactionExists = await db.select({ id: transactionEntriesTable.id })
      .from(transactionEntriesTable)
      .where(eq(transactionEntriesTable.id, input.id))
      .execute();

    if (transactionExists.length === 0) {
      throw new Error(`Transaction with id ${input.id} not found`);
    }

    // Delete transaction details first (due to foreign key constraint)
    await db.delete(transactionDetailsTable)
      .where(eq(transactionDetailsTable.entry_id, input.id))
      .execute();

    // Delete the transaction entry
    await db.delete(transactionEntriesTable)
      .where(eq(transactionEntriesTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Transaction deletion failed:', error);
    throw error;
  }
};
