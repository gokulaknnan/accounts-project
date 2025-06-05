
import { db } from '../db';
import { groupsTable } from '../db/schema';
import { type CreateGroupInput, type UpdateGroupInput, type DeleteInput, type SearchInput, type Group } from '../schema';
import { eq, ilike, or } from 'drizzle-orm';

export const createGroup = async (input: CreateGroupInput): Promise<Group> => {
  try {
    const result = await db.insert(groupsTable)
      .values({
        name: input.name,
        description: input.description ?? null,
        parent_group_id: input.parent_group_id ?? null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Group creation failed:', error);
    throw error;
  }
};

export const getGroups = async (): Promise<Group[]> => {
  try {
    const result = await db.select()
      .from(groupsTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch groups:', error);
    throw error;
  }
};

export const getGroup = async (input: { id: number }): Promise<Group> => {
  try {
    const result = await db.select()
      .from(groupsTable)
      .where(eq(groupsTable.id, input.id))
      .execute();

    if (result.length === 0) {
      throw new Error('Group not found');
    }

    return result[0];
  } catch (error) {
    console.error('Failed to fetch group:', error);
    throw error;
  }
};

export const updateGroup = async (input: UpdateGroupInput): Promise<Group> => {
  try {
    // Build update values object with only provided fields
    const updateValues: Partial<typeof groupsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateValues.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateValues.description = input.description;
    }
    
    if (input.parent_group_id !== undefined) {
      updateValues.parent_group_id = input.parent_group_id;
    }

    const result = await db.update(groupsTable)
      .set(updateValues)
      .where(eq(groupsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Group not found');
    }

    return result[0];
  } catch (error) {
    console.error('Group update failed:', error);
    throw error;
  }
};

export const deleteGroup = async (input: DeleteInput): Promise<{ success: boolean }> => {
  try {
    const result = await db.delete(groupsTable)
      .where(eq(groupsTable.id, input.id))
      .returning({ id: groupsTable.id })
      .execute();

    if (result.length === 0) {
      throw new Error('Group not found');
    }

    return { success: true };
  } catch (error) {
    console.error('Group deletion failed:', error);
    throw error;
  }
};

export const searchGroups = async (input: SearchInput): Promise<Group[]> => {
  try {
    const result = await db.select()
      .from(groupsTable)
      .where(
        or(
          ilike(groupsTable.name, `%${input.query}%`),
          ilike(groupsTable.description, `%${input.query}%`)
        )
      )
      .limit(input.limit)
      .offset(input.offset)
      .execute();

    return result;
  } catch (error) {
    console.error('Group search failed:', error);
    throw error;
  }
};
