
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ledgersTable, groupsTable, contactsTable } from '../db/schema';
import { type CreateLedgerInput, type UpdateLedgerInput, type SearchInput } from '../schema';
import { createLedger, getLedgers, getLedger, updateLedger, deleteLedger, searchLedgers } from '../handlers/ledgers';
import { eq } from 'drizzle-orm';

describe('Ledgers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createLedger', () => {
    it('should create a ledger with minimal data', async () => {
      // Create prerequisite group
      const group = await db.insert(groupsTable)
        .values({
          name: 'Assets',
          description: 'Asset accounts'
        })
        .returning()
        .execute();

      const testInput: CreateLedgerInput = {
        name: 'Cash Account',
        group_id: group[0].id,
        opening_balance: 1000.50,
        balance_type: 'debit'
      };

      const result = await createLedger(testInput);

      expect(result.name).toEqual('Cash Account');
      expect(result.group_id).toEqual(group[0].id);
      expect(result.contact_id).toBeNull();
      expect(result.opening_balance).toEqual(1000.50);
      expect(typeof result.opening_balance).toBe('number');
      expect(result.balance_type).toEqual('debit');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a ledger with contact', async () => {
      // Create prerequisite group and contact
      const group = await db.insert(groupsTable)
        .values({
          name: 'Accounts Receivable',
          description: 'Customer accounts'
        })
        .returning()
        .execute();

      const contact = await db.insert(contactsTable)
        .values({
          name: 'John Doe',
          contact_type: 'customer',
          email: 'john@example.com'
        })
        .returning()
        .execute();

      const testInput: CreateLedgerInput = {
        name: 'John Doe Account',
        group_id: group[0].id,
        contact_id: contact[0].id,
        opening_balance: 500.00,
        balance_type: 'debit'
      };

      const result = await createLedger(testInput);

      expect(result.name).toEqual('John Doe Account');
      expect(result.group_id).toEqual(group[0].id);
      expect(result.contact_id).toEqual(contact[0].id);
      expect(result.opening_balance).toEqual(500.00);
      expect(result.balance_type).toEqual('debit');
    });

    it('should save ledger to database', async () => {
      // Create prerequisite group
      const group = await db.insert(groupsTable)
        .values({
          name: 'Liabilities',
          description: 'Liability accounts'
        })
        .returning()
        .execute();

      const testInput: CreateLedgerInput = {
        name: 'Accounts Payable',
        group_id: group[0].id,
        opening_balance: 2000.00,
        balance_type: 'credit'
      };

      const result = await createLedger(testInput);

      const ledgers = await db.select()
        .from(ledgersTable)
        .where(eq(ledgersTable.id, result.id))
        .execute();

      expect(ledgers).toHaveLength(1);
      expect(ledgers[0].name).toEqual('Accounts Payable');
      expect(ledgers[0].group_id).toEqual(group[0].id);
      expect(parseFloat(ledgers[0].opening_balance)).toEqual(2000.00);
      expect(ledgers[0].balance_type).toEqual('credit');
    });

    it('should throw error for non-existent group', async () => {
      const testInput: CreateLedgerInput = {
        name: 'Test Ledger',
        group_id: 999,
        opening_balance: 100.00,
        balance_type: 'debit'
      };

      await expect(createLedger(testInput)).rejects.toThrow(/group not found/i);
    });

    it('should throw error for non-existent contact', async () => {
      // Create prerequisite group
      const group = await db.insert(groupsTable)
        .values({
          name: 'Test Group',
          description: 'Test group'
        })
        .returning()
        .execute();

      const testInput: CreateLedgerInput = {
        name: 'Test Ledger',
        group_id: group[0].id,
        contact_id: 999,
        opening_balance: 100.00,
        balance_type: 'debit'
      };

      await expect(createLedger(testInput)).rejects.toThrow(/contact not found/i);
    });
  });

  describe('getLedgers', () => {
    it('should return all ledgers', async () => {
      // Create prerequisite group
      const group = await db.insert(groupsTable)
        .values({
          name: 'Test Group',
          description: 'Test group'
        })
        .returning()
        .execute();

      // Create test ledgers
      await db.insert(ledgersTable)
        .values([
          {
            name: 'Cash',
            group_id: group[0].id,
            opening_balance: '1000.00',
            balance_type: 'debit'
          },
          {
            name: 'Bank',
            group_id: group[0].id,
            opening_balance: '5000.50',
            balance_type: 'debit'
          }
        ])
        .execute();

      const result = await getLedgers();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBeDefined();
      expect(typeof result[0].opening_balance).toBe('number');
      expect(result[1].name).toBeDefined();
      expect(typeof result[1].opening_balance).toBe('number');
    });

    it('should return empty array when no ledgers exist', async () => {
      const result = await getLedgers();
      expect(result).toEqual([]);
    });
  });

  describe('getLedger', () => {
    it('should return specific ledger', async () => {
      // Create prerequisite group
      const group = await db.insert(groupsTable)
        .values({
          name: 'Test Group',
          description: 'Test group'
        })
        .returning()
        .execute();

      // Create test ledger
      const ledger = await db.insert(ledgersTable)
        .values({
          name: 'Petty Cash',
          group_id: group[0].id,
          opening_balance: '200.75',
          balance_type: 'debit'
        })
        .returning()
        .execute();

      const result = await getLedger({ id: ledger[0].id });

      expect(result.id).toEqual(ledger[0].id);
      expect(result.name).toEqual('Petty Cash');
      expect(result.group_id).toEqual(group[0].id);
      expect(result.opening_balance).toEqual(200.75);
      expect(typeof result.opening_balance).toBe('number');
      expect(result.balance_type).toEqual('debit');
    });

    it('should throw error for non-existent ledger', async () => {
      await expect(getLedger({ id: 999 })).rejects.toThrow(/ledger not found/i);
    });
  });

  describe('updateLedger', () => {
    it('should update ledger fields', async () => {
      // Create prerequisite groups
      const group1 = await db.insert(groupsTable)
        .values({
          name: 'Original Group',
          description: 'Original group'
        })
        .returning()
        .execute();

      const group2 = await db.insert(groupsTable)
        .values({
          name: 'New Group',
          description: 'New group'
        })
        .returning()
        .execute();

      // Create test ledger
      const ledger = await db.insert(ledgersTable)
        .values({
          name: 'Original Name',
          group_id: group1[0].id,
          opening_balance: '100.00',
          balance_type: 'debit'
        })
        .returning()
        .execute();

      const updateInput: UpdateLedgerInput = {
        id: ledger[0].id,
        name: 'Updated Name',
        group_id: group2[0].id,
        opening_balance: 250.50,
        balance_type: 'credit'
      };

      const result = await updateLedger(updateInput);

      expect(result.id).toEqual(ledger[0].id);
      expect(result.name).toEqual('Updated Name');
      expect(result.group_id).toEqual(group2[0].id);
      expect(result.opening_balance).toEqual(250.50);
      expect(typeof result.opening_balance).toBe('number');
      expect(result.balance_type).toEqual('credit');
    });

    it('should throw error for non-existent ledger', async () => {
      const updateInput: UpdateLedgerInput = {
        id: 999,
        name: 'Updated Name'
      };

      await expect(updateLedger(updateInput)).rejects.toThrow(/ledger not found/i);
    });

    it('should throw error for non-existent group', async () => {
      // Create prerequisite group
      const group = await db.insert(groupsTable)
        .values({
          name: 'Test Group',
          description: 'Test group'
        })
        .returning()
        .execute();

      // Create test ledger
      const ledger = await db.insert(ledgersTable)
        .values({
          name: 'Test Ledger',
          group_id: group[0].id,
          opening_balance: '100.00',
          balance_type: 'debit'
        })
        .returning()
        .execute();

      const updateInput: UpdateLedgerInput = {
        id: ledger[0].id,
        group_id: 999
      };

      await expect(updateLedger(updateInput)).rejects.toThrow(/group not found/i);
    });
  });

  describe('deleteLedger', () => {
    it('should delete existing ledger', async () => {
      // Create prerequisite group
      const group = await db.insert(groupsTable)
        .values({
          name: 'Test Group',
          description: 'Test group'
        })
        .returning()
        .execute();

      // Create test ledger
      const ledger = await db.insert(ledgersTable)
        .values({
          name: 'To Delete',
          group_id: group[0].id,
          opening_balance: '100.00',
          balance_type: 'debit'
        })
        .returning()
        .execute();

      const result = await deleteLedger({ id: ledger[0].id });

      expect(result.success).toBe(true);

      // Verify deletion
      const deletedLedger = await db.select()
        .from(ledgersTable)
        .where(eq(ledgersTable.id, ledger[0].id))
        .execute();

      expect(deletedLedger).toHaveLength(0);
    });

    it('should return false for non-existent ledger', async () => {
      const result = await deleteLedger({ id: 999 });
      expect(result.success).toBe(false);
    });
  });

  describe('searchLedgers', () => {
    it('should search ledgers by name', async () => {
      // Create prerequisite group
      const group = await db.insert(groupsTable)
        .values({
          name: 'Test Group',
          description: 'Test group'
        })
        .returning()
        .execute();

      // Create test ledgers
      await db.insert(ledgersTable)
        .values([
          {
            name: 'Cash Account',
            group_id: group[0].id,
            opening_balance: '1000.00',
            balance_type: 'debit'
          },
          {
            name: 'Bank Account',
            group_id: group[0].id,
            opening_balance: '5000.00',
            balance_type: 'debit'
          },
          {
            name: 'Credit Card',
            group_id: group[0].id,
            opening_balance: '2000.00',
            balance_type: 'credit'
          }
        ])
        .execute();

      const searchInput: SearchInput = {
        query: 'account',
        limit: 10,
        offset: 0
      };

      const result = await searchLedgers(searchInput);

      expect(result).toHaveLength(2);
      expect(result.some(l => l.name === 'Cash Account')).toBe(true);
      expect(result.some(l => l.name === 'Bank Account')).toBe(true);
      expect(result.every(l => typeof l.opening_balance === 'number')).toBe(true);
    });

    it('should respect limit and offset', async () => {
      // Create prerequisite group
      const group = await db.insert(groupsTable)
        .values({
          name: 'Test Group',
          description: 'Test group'
        })
        .returning()
        .execute();

      // Create multiple test ledgers
      await db.insert(ledgersTable)
        .values([
          {
            name: 'Ledger 1',
            group_id: group[0].id,
            opening_balance: '100.00',
            balance_type: 'debit'
          },
          {
            name: 'Ledger 2',
            group_id: group[0].id,
            opening_balance: '200.00',
            balance_type: 'debit'
          },
          {
            name: 'Ledger 3',
            group_id: group[0].id,
            opening_balance: '300.00',
            balance_type: 'debit'
          }
        ])
        .execute();

      const searchInput: SearchInput = {
        query: 'ledger',
        limit: 2,
        offset: 1
      };

      const result = await searchLedgers(searchInput);

      expect(result).toHaveLength(2);
      expect(result.every(l => typeof l.opening_balance === 'number')).toBe(true);
    });

    it('should return empty array when no matches found', async () => {
      const searchInput: SearchInput = {
        query: 'nonexistent',
        limit: 10,
        offset: 0
      };

      const result = await searchLedgers(searchInput);
      expect(result).toEqual([]);
    });
  });
});
