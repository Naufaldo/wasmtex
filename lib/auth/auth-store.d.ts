export interface UserSession {
    email: string;
    name: string;
    token?: string;
    loggedInAt: number;
}
export declare function getCurrentUser(): UserSession | null;
export declare function loginUser(email: string, name?: string): UserSession;
export declare function logoutUser(): void;
