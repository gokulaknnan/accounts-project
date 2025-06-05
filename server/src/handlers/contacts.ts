
import { type Contact, type CreateContactInput, type UpdateContactInput, type DeleteInput, type SearchInput } from '../schema';

export declare function createContact(input: CreateContactInput): Promise<Contact>;
export declare function getContacts(): Promise<Contact[]>;
export declare function getContact(input: { id: number }): Promise<Contact>;
export declare function updateContact(input: UpdateContactInput): Promise<Contact>;
export declare function deleteContact(input: DeleteInput): Promise<{ success: boolean }>;
export declare function searchContacts(input: SearchInput): Promise<Contact[]>;
