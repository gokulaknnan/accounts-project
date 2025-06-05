
import { type Group, type CreateGroupInput, type UpdateGroupInput, type DeleteInput, type SearchInput } from '../schema';

export declare function createGroup(input: CreateGroupInput): Promise<Group>;
export declare function getGroups(): Promise<Group[]>;
export declare function getGroup(input: { id: number }): Promise<Group>;
export declare function updateGroup(input: UpdateGroupInput): Promise<Group>;
export declare function deleteGroup(input: DeleteInput): Promise<{ success: boolean }>;
export declare function searchGroups(input: SearchInput): Promise<Group[]>;
