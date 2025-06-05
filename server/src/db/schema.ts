
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const contactTypeEnum = pgEnum('contact_type', ['customer', 'supplier', 'both']);
export const balanceTypeEnum = pgEnum('balance_type', ['debit', 'credit']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Groups table
export const groupsTable = pgTable('groups', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  parent_group_id: integer('parent_group_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Contacts table
export const contactsTable = pgTable('contacts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  contact_type: contactTypeEnum('contact_type').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Ledgers table
export const ledgersTable = pgTable('ledgers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  group_id: integer('group_id').notNull(),
  contact_id: integer('contact_id'),
  opening_balance: numeric('opening_balance', { precision: 15, scale: 2 }).notNull().default('0'),
  balance_type: balanceTypeEnum('balance_type').notNull().default('debit'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Financial years table
export const financialYearsTable = pgTable('financial_years', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date').notNull(),
  is_active: boolean('is_active').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Transaction entries table
export const transactionEntriesTable = pgTable('transaction_entries', {
  id: serial('id').primaryKey(),
  entry_number: text('entry_number').notNull().unique(),
  entry_date: timestamp('entry_date').notNull(),
  description: text('description').notNull(),
  total_amount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
  is_correction: boolean('is_correction').notNull().default(false),
  original_entry_id: integer('original_entry_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Transaction details table
export const transactionDetailsTable = pgTable('transaction_details', {
  id: serial('id').primaryKey(),
  entry_id: integer('entry_id').notNull(),
  ledger_id: integer('ledger_id').notNull(),
  debit_amount: numeric('debit_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  credit_amount: numeric('credit_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  description: text('description')
});

// Relations
export const groupsRelations = relations(groupsTable, ({ one, many }) => ({
  parentGroup: one(groupsTable, {
    fields: [groupsTable.parent_group_id],
    references: [groupsTable.id]
  }),
  subGroups: many(groupsTable),
  ledgers: many(ledgersTable)
}));

export const ledgersRelations = relations(ledgersTable, ({ one, many }) => ({
  group: one(groupsTable, {
    fields: [ledgersTable.group_id],
    references: [groupsTable.id]
  }),
  contact: one(contactsTable, {
    fields: [ledgersTable.contact_id],
    references: [contactsTable.id]
  }),
  transactionDetails: many(transactionDetailsTable)
}));

export const contactsRelations = relations(contactsTable, ({ many }) => ({
  ledgers: many(ledgersTable)
}));

export const transactionEntriesRelations = relations(transactionEntriesTable, ({ one, many }) => ({
  originalEntry: one(transactionEntriesTable, {
    fields: [transactionEntriesTable.original_entry_id],
    references: [transactionEntriesTable.id]
  }),
  corrections: many(transactionEntriesTable),
  details: many(transactionDetailsTable)
}));

export const transactionDetailsRelations = relations(transactionDetailsTable, ({ one }) => ({
  entry: one(transactionEntriesTable, {
    fields: [transactionDetailsTable.entry_id],
    references: [transactionEntriesTable.id]
  }),
  ledger: one(ledgersTable, {
    fields: [transactionDetailsTable.ledger_id],
    references: [ledgersTable.id]
  })
}));

// Export all tables
export const tables = {
  users: usersTable,
  groups: groupsTable,
  contacts: contactsTable,
  ledgers: ledgersTable,
  financialYears: financialYearsTable,
  transactionEntries: transactionEntriesTable,
  transactionDetails: transactionDetailsTable
};
