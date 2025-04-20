import { UserDTO } from '../dto/userDto';
import { UserDAO } from '../dao/userDao';

/**
 * Service for User entity business logic
 */
export class UserService {
    private userDAO: UserDAO;

    /**
     * Create a new UserService instance
     */
    constructor() {
        this.userDAO = new UserDAO();
    }

    /**
     * Get all users
     * @returns Array of users
     */
    getAllUsers(): UserDTO[] {
        return this.userDAO.findAll();
    }

    /**
     * Get user by ID
     * @param id - User ID
     * @returns User object or null if not found
     */
    getUserById(id: string): UserDTO | null {
        return this.userDAO.findById(id);
    }

    /**
     * Create a new user
     * @param userData - User data
     * @returns Created user
     */
    createUser(userData: any): UserDTO {
        const userDTO = UserDTO.fromRequest(userData);
        return this.userDAO.create(userDTO);
    }

    /**
     * Update an existing user
     * @param id - User ID
     * @param userData - User data to update
     * @returns Updated user or null if not found
     */
    updateUser(id: string, userData: Partial<UserDTO>): UserDTO | null {
        return this.userDAO.update(id, userData);
    }

    /**
     * Delete a user
     * @param id - User ID
     * @returns True if deleted, false if not found
     */
    deleteUser(id: string): boolean {
        return this.userDAO.delete(id);
    }
}