
import { db } from '../db';
import { transactionEntriesTable, transactionDetailsTable, ledgersTable, groupsTable } from '../db/schema';
import { type DaybookReportInput, type LedgerReportInput, type TrialBalanceInput } from '../schema';
import { eq, and, gte, lte, desc, asc, sum, SQL } from 'drizzle-orm';

export const getDaybookReport = async (input: DaybookReportInput): Promise<any[]> => {
  try {
    const conditions: SQL<unknown>[] = [];
    conditions.push(gte(transactionEntriesTable.entry_date, input.start_date));
    conditions.push(lte(transactionEntriesTable.entry_date, input.end_date));

    const results = await db.select({
      entry_id: transactionEntriesTable.id,
      entry_number: transactionEntriesTable.entry_number,
      entry_date: transactionEntriesTable.entry_date,
      description: transactionEntriesTable.description,
      total_amount: transactionEntriesTable.total_amount,
      ledger_name: ledgersTable.name,
      debit_amount: transactionDetailsTable.debit_amount,
      credit_amount: transactionDetailsTable.credit_amount
    })
    .from(transactionEntriesTable)
    .innerJoin(transactionDetailsTable, eq(transactionEntriesTable.id, transactionDetailsTable.entry_id))
    .innerJoin(ledgersTable, eq(transactionDetailsTable.ledger_id, ledgersTable.id))
    .where(and(...conditions))
    .orderBy(asc(transactionEntriesTable.entry_date), asc(transactionEntriesTable.entry_number))
    .execute();

    return results.map(result => ({
      entry_id: result.entry_id,
      entry_number: result.entry_number,
      entry_date: result.entry_date,
      description: result.description,
      total_amount: parseFloat(result.total_amount),
      ledger_name: result.ledger_name,
      debit_amount: parseFloat(result.debit_amount),
      credit_amount: parseFloat(result.credit_amount)
    }));
  } catch (error) {
    console.error('Daybook report generation failed:', error);
    throw error;
  }
};

export const getLedgerReport = async (input: LedgerReportInput): Promise<any[]> => {
  try {
    const conditions: SQL<unknown>[] = [];
    conditions.push(gte(transactionEntriesTable.entry_date, input.start_date));
    conditions.push(lte(transactionEntriesTable.entry_date, input.end_date));

    if (input.ledger_id) {
      conditions.push(eq(ledgersTable.id, input.ledger_id));
    }

    if (input.group_id) {
      conditions.push(eq(ledgersTable.group_id, input.group_id));
    }

    const results = await db.select({
      entry_id: transactionEntriesTable.id,
      entry_number: transactionEntriesTable.entry_number,
      entry_date: transactionEntriesTable.entry_date,
      description: transactionEntriesTable.description,
      ledger_id: ledgersTable.id,
      ledger_name: ledgersTable.name,
      opening_balance: ledgersTable.opening_balance,
      balance_type: ledgersTable.balance_type,
      debit_amount: transactionDetailsTable.debit_amount,
      credit_amount: transactionDetailsTable.credit_amount,
      detail_description: transactionDetailsTable.description
    })
    .from(transactionDetailsTable)
    .innerJoin(transactionEntriesTable, eq(transactionDetailsTable.entry_id, transactionEntriesTable.id))
    .innerJoin(ledgersTable, eq(transactionDetailsTable.ledger_id, ledgersTable.id))
    .where(and(...conditions))
    .orderBy(asc(ledgersTable.name), asc(transactionEntriesTable.entry_date))
    .execute();

    return results.map(result => ({
      entry_id: result.entry_id,
      entry_number: result.entry_number,
      entry_date: result.entry_date,
      description: result.description,
      ledger_id: result.ledger_id,
      ledger_name: result.ledger_name,
      opening_balance: parseFloat(result.opening_balance),
      balance_type: result.balance_type,
      debit_amount: parseFloat(result.debit_amount),
      credit_amount: parseFloat(result.credit_amount),
      detail_description: result.detail_description
    }));
  } catch (error) {
    console.error('Ledger report generation failed:', error);
    throw error;
  }
};

export const getTrialBalance = async (input: TrialBalanceInput): Promise<any[]> => {
  try {
    const results = await db.select({
      ledger_id: ledgersTable.id,
      ledger_name: ledgersTable.name,
      opening_balance: ledgersTable.opening_balance,
      balance_type: ledgersTable.balance_type,
      total_debit: sum(transactionDetailsTable.debit_amount),
      total_credit: sum(transactionDetailsTable.credit_amount)
    })
    .from(ledgersTable)
    .leftJoin(transactionDetailsTable, eq(ledgersTable.id, transactionDetailsTable.ledger_id))
    .leftJoin(transactionEntriesTable, and(
      eq(transactionDetailsTable.entry_id, transactionEntriesTable.id),
      lte(transactionEntriesTable.entry_date, input.as_on_date)
    ))
    .groupBy(ledgersTable.id, ledgersTable.name, ledgersTable.opening_balance, ledgersTable.balance_type)
    .orderBy(asc(ledgersTable.name))
    .execute();

    return results.map(result => {
      const openingBalance = parseFloat(result.opening_balance);
      const totalDebit = parseFloat(result.total_debit || '0');
      const totalCredit = parseFloat(result.total_credit || '0');
      
      // Calculate closing balance based on opening balance type
      let closingBalance = 0;
      if (result.balance_type === 'debit') {
        closingBalance = openingBalance + totalDebit - totalCredit;
      } else {
        closingBalance = openingBalance + totalCredit - totalDebit;
      }

      return {
        ledger_id: result.ledger_id,
        ledger_name: result.ledger_name,
        opening_balance: openingBalance,
        balance_type: result.balance_type,
        total_debit: totalDebit,
        total_credit: totalCredit,
        closing_balance: Math.abs(closingBalance),
        closing_balance_type: closingBalance >= 0 ? result.balance_type : (result.balance_type === 'debit' ? 'credit' : 'debit')
      };
    });
  } catch (error) {
    console.error('Trial balance generation failed:', error);
    throw error;
  }
};

export const getProfitAndLoss = async (input: { start_date: Date; end_date: Date }): Promise<any> => {
  try {
    const results = await db.select({
      ledger_id: ledgersTable.id,
      ledger_name: ledgersTable.name,
      group_name: groupsTable.name,
      total_debit: sum(transactionDetailsTable.debit_amount),
      total_credit: sum(transactionDetailsTable.credit_amount)
    })
    .from(ledgersTable)
    .innerJoin(groupsTable, eq(ledgersTable.group_id, groupsTable.id))
    .leftJoin(transactionDetailsTable, eq(ledgersTable.id, transactionDetailsTable.ledger_id))
    .leftJoin(transactionEntriesTable, and(
      eq(transactionDetailsTable.entry_id, transactionEntriesTable.id),
      gte(transactionEntriesTable.entry_date, input.start_date),
      lte(transactionEntriesTable.entry_date, input.end_date)
    ))
    .groupBy(ledgersTable.id, ledgersTable.name, groupsTable.name)
    .orderBy(asc(groupsTable.name), asc(ledgersTable.name))
    .execute();

    const income: any[] = [];
    const expenses: any[] = [];
    let totalIncome = 0;
    let totalExpenses = 0;

    results.forEach(result => {
      const totalDebit = parseFloat(result.total_debit || '0');
      const totalCredit = parseFloat(result.total_credit || '0');
      const netAmount = totalCredit - totalDebit;

      const ledgerData = {
        ledger_id: result.ledger_id,
        ledger_name: result.ledger_name,
        group_name: result.group_name,
        amount: Math.abs(netAmount)
      };

      // Income groups typically have credit balances
      if (netAmount > 0) {
        income.push(ledgerData);
        totalIncome += Math.abs(netAmount);
      } else if (netAmount < 0) {
        expenses.push(ledgerData);
        totalExpenses += Math.abs(netAmount);
      }
    });

    const netProfit = totalIncome - totalExpenses;

    return {
      period: {
        start_date: input.start_date,
        end_date: input.end_date
      },
      income,
      expenses,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_profit: netProfit,
      net_loss: netProfit < 0 ? Math.abs(netProfit) : 0
    };
  } catch (error) {
    console.error('P&L report generation failed:', error);
    throw error;
  }
};

export const getBalanceSheet = async (input: { as_on_date: Date }): Promise<any> => {
  try {
    const results = await db.select({
      ledger_id: ledgersTable.id,
      ledger_name: ledgersTable.name,
      group_name: groupsTable.name,
      opening_balance: ledgersTable.opening_balance,
      balance_type: ledgersTable.balance_type,
      total_debit: sum(transactionDetailsTable.debit_amount),
      total_credit: sum(transactionDetailsTable.credit_amount)
    })
    .from(ledgersTable)
    .innerJoin(groupsTable, eq(ledgersTable.group_id, groupsTable.id))
    .leftJoin(transactionDetailsTable, eq(ledgersTable.id, transactionDetailsTable.ledger_id))
    .leftJoin(transactionEntriesTable, and(
      eq(transactionDetailsTable.entry_id, transactionEntriesTable.id),
      lte(transactionEntriesTable.entry_date, input.as_on_date)
    ))
    .groupBy(ledgersTable.id, ledgersTable.name, groupsTable.name, ledgersTable.opening_balance, ledgersTable.balance_type)
    .orderBy(asc(groupsTable.name), asc(ledgersTable.name))
    .execute();

    const assets: any[] = [];
    const liabilities: any[] = [];
    let totalAssets = 0;
    let totalLiabilities = 0;

    results.forEach(result => {
      const openingBalance = parseFloat(result.opening_balance);
      const totalDebit = parseFloat(result.total_debit || '0');
      const totalCredit = parseFloat(result.total_credit || '0');
      
      let closingBalance = 0;
      if (result.balance_type === 'debit') {
        closingBalance = openingBalance + totalDebit - totalCredit;
      } else {
        closingBalance = openingBalance + totalCredit - totalDebit;
      }

      if (Math.abs(closingBalance) > 0.01) { // Only include ledgers with significant balances
        const ledgerData = {
          ledger_id: result.ledger_id,
          ledger_name: result.ledger_name,
          group_name: result.group_name,
          amount: Math.abs(closingBalance)
        };

        // Assets typically have debit balances, liabilities have credit balances
        if (closingBalance > 0 && result.balance_type === 'debit') {
          assets.push(ledgerData);
          totalAssets += Math.abs(closingBalance);
        } else if (closingBalance > 0 && result.balance_type === 'credit') {
          liabilities.push(ledgerData);
          totalLiabilities += Math.abs(closingBalance);
        } else if (closingBalance < 0 && result.balance_type === 'debit') {
          liabilities.push(ledgerData);
          totalLiabilities += Math.abs(closingBalance);
        } else if (closingBalance < 0 && result.balance_type === 'credit') {
          assets.push(ledgerData);
          totalAssets += Math.abs(closingBalance);
        }
      }
    });

    return {
      as_on_date: input.as_on_date,
      assets,
      liabilities,
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      difference: totalAssets - totalLiabilities
    };
  } catch (error) {
    console.error('Balance sheet generation failed:', error);
    throw error;
  }
};
