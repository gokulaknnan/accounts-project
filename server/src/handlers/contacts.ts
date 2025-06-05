
import { db } from '../db';
import { contactsTable } from '../db/schema';
import { type CreateContactInput, type UpdateContactInput, type DeleteInput, type SearchInput, type Contact } from '../schema';
import { eq, or, ilike } from 'drizzle-orm';

export const createContact = async (input: CreateContactInput): Promise<Contact> => {
  try {
    const result = await db.insert(contactsTable)
      .values({
        name: input.name,
        contact_type: input.contact_type,
        phone: input.phone || null,
        email: input.email || null,
        address: input.address || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Contact creation failed:', error);
    throw error;
  }
};

export const getContacts = async (): Promise<Contact[]> => {
  try {
    const results = await db.select()
      .from(contactsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get contacts:', error);
    throw error;
  }
};

export const getContact = async (input: { id: number }): Promise<Contact> => {
  try {
    const results = await db.select()
      .from(contactsTable)
      .where(eq(contactsTable.id, input.id))
      .execute();

    if (results.length === 0) {
      throw new Error('Contact not found');
    }

    return results[0];
  } catch (error) {
    console.error('Failed to get contact:', error);
    throw error;
  }
};

export const updateContact = async (input: UpdateContactInput): Promise<Contact> => {
  try {
    const updateData: Partial<typeof contactsTable.$inferInsert> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.contact_type !== undefined) updateData.contact_type = input.contact_type;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.address !== undefined) updateData.address = input.address;

    const result = await db.update(contactsTable)
      .set(updateData)
      .where(eq(contactsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Contact not found');
    }

    return result[0];
  } catch (error) {
    console.error('Contact update failed:', error);
    throw error;
  }
};

export const deleteContact = async (input: DeleteInput): Promise<{ success: boolean }> => {
  try {
    const result = await db.delete(contactsTable)
      .where(eq(contactsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Contact not found');
    }

    return { success: true };
  } catch (error) {
    console.error('Contact deletion failed:', error);
    throw error;
  }
};

export const searchContacts = async (input: SearchInput): Promise<Contact[]> => {
  try {
    // Search in name, phone, email, and address fields
    const searchPattern = `%${input.query}%`;
    
    const results = await db.select()
      .from(contactsTable)
      .where(
        or(
          ilike(contactsTable.name, searchPattern),
          ilike(contactsTable.phone, searchPattern),
          ilike(contactsTable.email, searchPattern),
          ilike(contactsTable.address, searchPattern)
        )
      )
      .limit(input.limit)
      .offset(input.offset)
      .execute();

    return results;
  } catch (error) {
    console.error('Contact search failed:', error);
    throw error;
  }
};
