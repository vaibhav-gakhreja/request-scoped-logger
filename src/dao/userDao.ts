import { UserDTO } from '../dto/userDto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Data Access Object for User entity
 */
export class UserDAO {
    private users: Map<string, UserDTO>;

    /**
     * Create a new UserDAO instance
     */
    constructor() {
        this.users = new Map<string, UserDTO>();

        // Add some sample users
        const sampleUsers = [
            new UserDTO(uuidv4(), 'Vaibhav', 'vaibhav@example.com', 'admin'),
            new UserDTO(uuidv4(), 'Rohit', 'rohit@example.com', 'user')
        ];

        sampleUsers.forEach(user => {
            this.users.set(user.id, user);
        });
    }

    /**
     * Find all users
     * @returns Array of users
     */
    findAll(): UserDTO[] {
        return Array.from(this.users.values());
    }

    /**
     * Find user by ID
     * @param id - User ID
     * @returns User object or null if not found
     */
    findById(id: string): UserDTO | null {
        return this.users.get(id) || null;
    }

    /**
     * Create a new user
     * @param user - User data
     * @returns Created user
     */
    create(user: UserDTO): UserDTO {
        this.users.set(user.id, user);
        return user;
    }

    /**
     * Update an existing user
     * @param id - User ID
     * @param userData - User data to update
     * @returns Updated user or null if not found
     */
    update(id: string, userData: Partial<UserDTO>): UserDTO | null {
        const existingUser = this.users.get(id);
        if (!existingUser) return null;

        const updatedUser = {
            ...existingUser,
            ...userData,
            id: existingUser.id, // Ensure ID doesn't change
            updatedAt: new Date().toISOString()
        };

        this.users.set(id, updatedUser as UserDTO);
        return updatedUser as UserDTO;
    }

    /**
     * Delete a user
     * @param id - User ID
     * @returns True if deleted, false if not found
     */
    delete(id: string): boolean {
        return this.users.delete(id);
    }
}