
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { transactionEntriesTable, transactionDetailsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const backupDatabase = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Create a timestamp for the backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${timestamp}`;

    // Create backup schema
    await db.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(backupName)}`);

    // Get list of all tables in public schema
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tables = tablesResult.rows as { table_name: string }[];

    // Copy each table to backup schema
    for (const table of tables) {
      const tableName = table.table_name;
      await db.execute(sql`
        CREATE TABLE ${sql.identifier(backupName)}.${sql.identifier(tableName)} 
        AS SELECT * FROM public.${sql.identifier(tableName)}
      `);
    }

    return {
      success: true,
      message: `Database backup created successfully as schema: ${backupName}`
    };
  } catch (error) {
    console.error('Database backup failed:', error);
    return {
      success: false,
      message: 'Failed to create database backup'
    };
  }
};

export const cleanEntireDatabase = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Delete all transaction details first (foreign key dependency)
    await db.delete(transactionDetailsTable).execute();

    // Delete all transaction entries
    await db.delete(transactionEntriesTable).execute();

    // Reset sequences for auto-incrementing IDs
    await db.execute(sql`
      SELECT setval(pg_get_serial_sequence('transaction_entries', 'id'), 1, false)
    `);
    await db.execute(sql`
      SELECT setval(pg_get_serial_sequence('transaction_details', 'id'), 1, false)
    `);

    return {
      success: true,
      message: 'Database cleaned successfully - all transaction data removed'
    };
  } catch (error) {
    console.error('Database cleaning failed:', error);
    return {
      success: false,
      message: 'Failed to clean database'
    };
  }
};

export const cleanCorrections = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Find all correction entries
    const correctionEntries = await db.select()
      .from(transactionEntriesTable)
      .where(eq(transactionEntriesTable.is_correction, true))
      .execute();

    if (correctionEntries.length === 0) {
      return {
        success: true,
        message: 'No correction entries found to clean'
      };
    }

    // Delete transaction details for correction entries
    for (const entry of correctionEntries) {
      await db.delete(transactionDetailsTable)
        .where(eq(transactionDetailsTable.entry_id, entry.id))
        .execute();
    }

    // Delete correction entries
    await db.delete(transactionEntriesTable)
      .where(eq(transactionEntriesTable.is_correction, true))
      .execute();

    return {
      success: true,
      message: `Successfully cleaned ${correctionEntries.length} correction entries`
    };
  } catch (error) {
    console.error('Correction cleaning failed:', error);
    return {
      success: false,
      message: 'Failed to clean correction entries'
    };
  }
};
