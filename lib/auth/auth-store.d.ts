export type UserRole = 'admin' | 'researcher' | 'viewer';
export interface UserAccount {
    id: string;
    username: string;
    name: string;
    password: string;
    role: UserRole;
    createdAt: number;
    updatedAt: number;
}
export interface UserSession {
    userId: string;
    username: string;
    name: string;
    role: UserRole;
    token?: string | undefined;
    loggedInAt: number;
    email?: string | undefined;
}
export declare const DEFAULT_ACCOUNTS: UserAccount[];
export declare function initAccounts(): UserAccount[];
export declare function getAllUsers(): UserAccount[];
export declare function getUserById(id: string): UserAccount | null;
export declare function getUserByUsername(username: string): UserAccount | null;
export declare function authenticate(username: string, pass: string): {
    success: boolean;
    session?: UserSession;
    error?: string;
};
export declare function getCurrentUser(): UserSession | null;
export declare function loginUser(userOrIdentifier: UserAccount | UserSession | string, name?: string): UserSession;
export declare function logoutUser(): void;
export declare function changeUsername(userId: string, newUsername: string): {
    success: boolean;
    error?: string;
};
export declare function changePassword(userId: string, oldPass: string | null, newPass: string, isAdminBypass?: boolean): {
    success: boolean;
    error?: string;
};
export declare function updateUserProfile(userId: string, updates: {
    name?: string;
    role?: UserRole;
}): {
    success: boolean;
    error?: string;
};
export declare function createUser(username: string, pass: string, name: string, role: UserRole): {
    success: boolean;
    user?: UserAccount;
    error?: string;
};
export declare function deleteUser(targetUserId: string, currentUserId?: string): {
    success: boolean;
    error?: string;
};
export declare function canCreateProject(session: UserSession | null): boolean;
export declare function canEditProject(session: UserSession | null, projectOwnerId?: string): boolean;
export declare function canDeleteProject(session: UserSession | null, projectOwnerId?: string): boolean;
export declare function canManageIAM(session: UserSession | null): boolean;
