
import { db } from '../db';
import { financialYearsTable } from '../db/schema';
import { type FinancialYear, type CreateFinancialYearInput, type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export const createFinancialYear = async (input: CreateFinancialYearInput): Promise<FinancialYear> => {
  try {
    const result = await db.insert(financialYearsTable)
      .values({
        name: input.name,
        start_date: input.start_date,
        end_date: input.end_date,
        is_active: input.is_active
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Financial year creation failed:', error);
    throw error;
  }
};

export const getFinancialYears = async (): Promise<FinancialYear[]> => {
  try {
    const results = await db.select()
      .from(financialYearsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch financial years:', error);
    throw error;
  }
};

export const getActiveFinancialYear = async (): Promise<FinancialYear | null> => {
  try {
    const results = await db.select()
      .from(financialYearsTable)
      .where(eq(financialYearsTable.is_active, true))
      .execute();

    return results[0] || null;
  } catch (error) {
    console.error('Failed to fetch active financial year:', error);
    throw error;
  }
};

export const setActiveFinancialYear = async (input: { id: number }): Promise<FinancialYear> => {
  try {
    // First, deactivate all financial years
    await db.update(financialYearsTable)
      .set({ is_active: false })
      .execute();

    // Then activate the specified financial year
    const result = await db.update(financialYearsTable)
      .set({ is_active: true })
      .where(eq(financialYearsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Financial year not found');
    }

    return result[0];
  } catch (error) {
    console.error('Failed to set active financial year:', error);
    throw error;
  }
};

export const deleteFinancialYear = async (input: DeleteInput): Promise<{ success: boolean }> => {
  try {
    const result = await db.delete(financialYearsTable)
      .where(eq(financialYearsTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Failed to delete financial year:', error);
    throw error;
  }
};
