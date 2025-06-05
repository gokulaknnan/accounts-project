
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionEntriesTable, transactionDetailsTable, groupsTable, ledgersTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { 
  createTransaction, 
  getTransactions, 
  getTransaction, 
  getTransactionsByDateRange, 
  correctTransaction, 
  deleteTransaction 
} from '../handlers/transactions';
import { eq } from 'drizzle-orm';

describe('Transaction Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test ledgers
  const createTestLedgers = async () => {
    // Create a test group first
    const groupResult = await db.insert(groupsTable)
      .values({
        name: 'Test Group',
        description: 'Group for testing'
      })
      .returning()
      .execute();

    const group = groupResult[0];

    // Create test ledgers
    const cashLedger = await db.insert(ledgersTable)
      .values({
        name: 'Cash',
        group_id: group.id,
        opening_balance: '1000.00',
        balance_type: 'debit'
      })
      .returning()
      .execute();

    const salesLedger = await db.insert(ledgersTable)
      .values({
        name: 'Sales',
        group_id: group.id,
        opening_balance: '0.00',
        balance_type: 'credit'
      })
      .returning()
      .execute();

    return {
      cashLedger: cashLedger[0],
      salesLedger: salesLedger[0]
    };
  };

  describe('createTransaction', () => {
    it('should create a transaction with valid details', async () => {
      const { cashLedger, salesLedger } = await createTestLedgers();
      
      const testInput: CreateTransactionInput = {
        entry_date: new Date('2024-01-15'),
        description: 'Cash sale transaction',
        details: [
          {
            ledger_id: cashLedger.id,
            debit_amount: 500.00,
            credit_amount: 0,
            description: 'Cash received'
          },
          {
            ledger_id: salesLedger.id,
            debit_amount: 0,
            credit_amount: 500.00,
            description: 'Sales revenue'
          }
        ]
      };

      const result = await createTransaction(testInput);

      expect(result.description).toEqual('Cash sale transaction');
      expect(result.total_amount).toEqual(500.00);
      expect(typeof result.total_amount).toBe('number');
      expect(result.is_correction).toBe(false);
      expect(result.original_entry_id).toBeNull();
      expect(result.entry_number).toMatch(/^TXN-/);
      expect(result.id).toBeDefined();
      expect(result.entry_date).toBeInstanceOf(Date);
    });

    it('should save transaction details to database', async () => {
      const { cashLedger, salesLedger } = await createTestLedgers();
      
      const testInput: CreateTransactionInput = {
        entry_date: new Date('2024-01-15'),
        description: 'Test transaction',
        details: [
          {
            ledger_id: cashLedger.id,
            debit_amount: 300.00,
            credit_amount: 0
          },
          {
            ledger_id: salesLedger.id,
            debit_amount: 0,
            credit_amount: 300.00
          }
        ]
      };

      const result = await createTransaction(testInput);

      // Check transaction entry in database
      const entries = await db.select()
        .from(transactionEntriesTable)
        .where(eq(transactionEntriesTable.id, result.id))
        .execute();

      expect(entries).toHaveLength(1);
      expect(entries[0].description).toEqual('Test transaction');
      expect(parseFloat(entries[0].total_amount)).toEqual(300.00);

      // Check transaction details in database
      const details = await db.select()
        .from(transactionDetailsTable)
        .where(eq(transactionDetailsTable.entry_id, result.id))
        .execute();

      expect(details).toHaveLength(2);
      expect(details.some(d => d.ledger_id === cashLedger.id && parseFloat(d.debit_amount) === 300.00)).toBe(true);
      expect(details.some(d => d.ledger_id === salesLedger.id && parseFloat(d.credit_amount) === 300.00)).toBe(true);
    });

    it('should reject transaction when debits do not equal credits', async () => {
      const { cashLedger, salesLedger } = await createTestLedgers();
      
      const testInput: CreateTransactionInput = {
        entry_date: new Date('2024-01-15'),
        description: 'Unbalanced transaction',
        details: [
          {
            ledger_id: cashLedger.id,
            debit_amount: 500.00,
            credit_amount: 0
          },
          {
            ledger_id: salesLedger.id,
            debit_amount: 0,
            credit_amount: 300.00
          }
        ]
      };

      await expect(createTransaction(testInput)).rejects.toThrow(/Total debits must equal total credits/);
    });

    it('should reject transaction with non-existent ledger', async () => {
      const { salesLedger } = await createTestLedgers();
      
      const testInput: CreateTransactionInput = {
        entry_date: new Date('2024-01-15'),
        description: 'Invalid ledger transaction',
        details: [
          {
            ledger_id: 99999, // Non-existent ledger
            debit_amount: 500.00,
            credit_amount: 0
          },
          {
            ledger_id: salesLedger.id,
            debit_amount: 0,
            credit_amount: 500.00
          }
        ]
      };

      await expect(createTransaction(testInput)).rejects.toThrow(/does not exist/i);
    });
  });

  describe('getTransactions', () => {
    it('should return all transactions', async () => {
      const { cashLedger, salesLedger } = await createTestLedgers();
      
      // Create two transactions
      await createTransaction({
        entry_date: new Date('2024-01-15'),
        description: 'First transaction',
        details: [
          { ledger_id: cashLedger.id, debit_amount: 100, credit_amount: 0 },
          { ledger_id: salesLedger.id, debit_amount: 0, credit_amount: 100 }
        ]
      });

      await createTransaction({
        entry_date: new Date('2024-01-16'),
        description: 'Second transaction',
        details: [
          { ledger_id: cashLedger.id, debit_amount: 200, credit_amount: 0 },
          { ledger_id: salesLedger.id, debit_amount: 0, credit_amount: 200 }
        ]
      });

      const results = await getTransactions();

      expect(results).toHaveLength(2);
      expect(results[0].description).toEqual('Second transaction'); // Should be ordered by date desc
      expect(results[1].description).toEqual('First transaction');
      expect(typeof results[0].total_amount).toBe('number');
      expect(typeof results[1].total_amount).toBe('number');
    });

    it('should return empty array when no transactions exist', async () => {
      const results = await getTransactions();
      expect(results).toHaveLength(0);
    });
  });

  describe('getTransaction', () => {
    it('should return specific transaction by id', async () => {
      const { cashLedger, salesLedger } = await createTestLedgers();
      
      const created = await createTransaction({
        entry_date: new Date('2024-01-15'),
        description: 'Test transaction',
        details: [
          { ledger_id: cashLedger.id, debit_amount: 150, credit_amount: 0 },
          { ledger_id: salesLedger.id, debit_amount: 0, credit_amount: 150 }
        ]
      });

      const result = await getTransaction({ id: created.id });

      expect(result.id).toEqual(created.id);
      expect(result.description).toEqual('Test transaction');
      expect(result.total_amount).toEqual(150);
      expect(typeof result.total_amount).toBe('number');
    });

    it('should throw error for non-existent transaction', async () => {
      await expect(getTransaction({ id: 99999 })).rejects.toThrow(/not found/i);
    });
  });

  describe('getTransactionsByDateRange', () => {
    it('should return transactions within date range', async () => {
      const { cashLedger, salesLedger } = await createTestLedgers();
      
      // Create transactions on different dates
      await createTransaction({
        entry_date: new Date('2024-01-10'),
        description: 'Before range',
        details: [
          { ledger_id: cashLedger.id, debit_amount: 100, credit_amount: 0 },
          { ledger_id: salesLedger.id, debit_amount: 0, credit_amount: 100 }
        ]
      });

      await createTransaction({
        entry_date: new Date('2024-01-15'),
        description: 'In range',
        details: [
          { ledger_id: cashLedger.id, debit_amount: 200, credit_amount: 0 },
          { ledger_id: salesLedger.id, debit_amount: 0, credit_amount: 200 }
        ]
      });

      await createTransaction({
        entry_date: new Date('2024-01-20'),
        description: 'After range',
        details: [
          { ledger_id: cashLedger.id, debit_amount: 300, credit_amount: 0 },
          { ledger_id: salesLedger.id, debit_amount: 0, credit_amount: 300 }
        ]
      });

      const results = await getTransactionsByDateRange({
        start_date: new Date('2024-01-12'),
        end_date: new Date('2024-01-17')
      });

      expect(results).toHaveLength(1);
      expect(results[0].description).toEqual('In range');
      expect(typeof results[0].total_amount).toBe('number');
    });
  });

  describe('correctTransaction', () => {
    it('should create correction transaction', async () => {
      const { cashLedger, salesLedger } = await createTestLedgers();
      
      // Create original transaction
      const original = await createTransaction({
        entry_date: new Date('2024-01-15'),
        description: 'Original transaction',
        details: [
          { ledger_id: cashLedger.id, debit_amount: 100, credit_amount: 0 },
          { ledger_id: salesLedger.id, debit_amount: 0, credit_amount: 100 }
        ]
      });

      // Create correction
      const correctionData: CreateTransactionInput = {
        entry_date: new Date('2024-01-16'),
        description: 'Corrected transaction',
        details: [
          { ledger_id: cashLedger.id, debit_amount: 150, credit_amount: 0 },
          { ledger_id: salesLedger.id, debit_amount: 0, credit_amount: 150 }
        ]
      };

      const result = await correctTransaction({
        id: original.id,
        correction_data: correctionData
      });

      expect(result.description).toEqual('Corrected transaction');
      expect(result.total_amount).toEqual(150);
      expect(result.is_correction).toBe(true);
      expect(result.original_entry_id).toEqual(original.id);
      expect(result.entry_number).toMatch(/^COR-/);
      expect(typeof result.total_amount).toBe('number');
    });

    it('should throw error for non-existent original transaction', async () => {
      const correctionData: CreateTransactionInput = {
        entry_date: new Date('2024-01-16'),
        description: 'Correction',
        details: [
          { ledger_id: 1, debit_amount: 100, credit_amount: 0 },
          { ledger_id: 2, debit_amount: 0, credit_amount: 100 }
        ]
      };

      await expect(correctTransaction({
        id: 99999,
        correction_data: correctionData
      })).rejects.toThrow(/not found/i);
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction and its details', async () => {
      const { cashLedger, salesLedger } = await createTestLedgers();
      
      const created = await createTransaction({
        entry_date: new Date('2024-01-15'),
        description: 'To be deleted',
        details: [
          { ledger_id: cashLedger.id, debit_amount: 100, credit_amount: 0 },
          { ledger_id: salesLedger.id, debit_amount: 0, credit_amount: 100 }
        ]
      });

      const result = await deleteTransaction({ id: created.id });

      expect(result.success).toBe(true);

      // Verify transaction entry is deleted
      const entries = await db.select()
        .from(transactionEntriesTable)
        .where(eq(transactionEntriesTable.id, created.id))
        .execute();

      expect(entries).toHaveLength(0);

      // Verify transaction details are deleted
      const details = await db.select()
        .from(transactionDetailsTable)
        .where(eq(transactionDetailsTable.entry_id, created.id))
        .execute();

      expect(details).toHaveLength(0);
    });

    it('should throw error for non-existent transaction', async () => {
      await expect(deleteTransaction({ id: 99999 })).rejects.toThrow(/not found/i);
    });
  });
});
