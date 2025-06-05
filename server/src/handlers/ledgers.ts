
import { db } from '../db';
import { ledgersTable, groupsTable, contactsTable } from '../db/schema';
import { type CreateLedgerInput, type UpdateLedgerInput, type DeleteInput, type SearchInput, type Ledger } from '../schema';
import { eq, ilike, and } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const createLedger = async (input: CreateLedgerInput): Promise<Ledger> => {
  try {
    // Verify group exists
    const group = await db.select()
      .from(groupsTable)
      .where(eq(groupsTable.id, input.group_id))
      .execute();

    if (group.length === 0) {
      throw new Error('Group not found');
    }

    // Verify contact exists if provided
    if (input.contact_id) {
      const contact = await db.select()
        .from(contactsTable)
        .where(eq(contactsTable.id, input.contact_id))
        .execute();

      if (contact.length === 0) {
        throw new Error('Contact not found');
      }
    }

    const result = await db.insert(ledgersTable)
      .values({
        name: input.name,
        group_id: input.group_id,
        contact_id: input.contact_id,
        opening_balance: input.opening_balance.toString(),
        balance_type: input.balance_type
      })
      .returning()
      .execute();

    const ledger = result[0];
    return {
      ...ledger,
      opening_balance: parseFloat(ledger.opening_balance)
    };
  } catch (error) {
    console.error('Ledger creation failed:', error);
    throw error;
  }
};

export const getLedgers = async (): Promise<Ledger[]> => {
  try {
    const results = await db.select()
      .from(ledgersTable)
      .execute();

    return results.map(ledger => ({
      ...ledger,
      opening_balance: parseFloat(ledger.opening_balance)
    }));
  } catch (error) {
    console.error('Failed to get ledgers:', error);
    throw error;
  }
};

export const getLedger = async (input: { id: number }): Promise<Ledger> => {
  try {
    const results = await db.select()
      .from(ledgersTable)
      .where(eq(ledgersTable.id, input.id))
      .execute();

    if (results.length === 0) {
      throw new Error('Ledger not found');
    }

    const ledger = results[0];
    return {
      ...ledger,
      opening_balance: parseFloat(ledger.opening_balance)
    };
  } catch (error) {
    console.error('Failed to get ledger:', error);
    throw error;
  }
};

export const updateLedger = async (input: UpdateLedgerInput): Promise<Ledger> => {
  try {
    // Verify ledger exists
    const existingLedger = await db.select()
      .from(ledgersTable)
      .where(eq(ledgersTable.id, input.id))
      .execute();

    if (existingLedger.length === 0) {
      throw new Error('Ledger not found');
    }

    // Verify group exists if provided
    if (input.group_id) {
      const group = await db.select()
        .from(groupsTable)
        .where(eq(groupsTable.id, input.group_id))
        .execute();

      if (group.length === 0) {
        throw new Error('Group not found');
      }
    }

    // Verify contact exists if provided
    if (input.contact_id) {
      const contact = await db.select()
        .from(contactsTable)
        .where(eq(contactsTable.id, input.contact_id))
        .execute();

      if (contact.length === 0) {
        throw new Error('Contact not found');
      }
    }

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.group_id !== undefined) updateData.group_id = input.group_id;
    if (input.contact_id !== undefined) updateData.contact_id = input.contact_id;
    if (input.opening_balance !== undefined) updateData.opening_balance = input.opening_balance.toString();
    if (input.balance_type !== undefined) updateData.balance_type = input.balance_type;

    const result = await db.update(ledgersTable)
      .set(updateData)
      .where(eq(ledgersTable.id, input.id))
      .returning()
      .execute();

    const ledger = result[0];
    return {
      ...ledger,
      opening_balance: parseFloat(ledger.opening_balance)
    };
  } catch (error) {
    console.error('Ledger update failed:', error);
    throw error;
  }
};

export const deleteLedger = async (input: DeleteInput): Promise<{ success: boolean }> => {
  try {
    const result = await db.delete(ledgersTable)
      .where(eq(ledgersTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Ledger deletion failed:', error);
    throw error;
  }
};

export const searchLedgers = async (input: SearchInput): Promise<Ledger[]> => {
  try {
    const conditions: SQL<unknown>[] = [];

    if (input.query) {
      conditions.push(ilike(ledgersTable.name, `%${input.query}%`));
    }

    const results = conditions.length > 0
      ? await db.select()
          .from(ledgersTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .limit(input.limit)
          .offset(input.offset)
          .execute()
      : await db.select()
          .from(ledgersTable)
          .limit(input.limit)
          .offset(input.offset)
          .execute();

    return results.map(ledger => ({
      ...ledger,
      opening_balance: parseFloat(ledger.opening_balance)
    }));
  } catch (error) {
    console.error('Ledger search failed:', error);
    throw error;
  }
};
