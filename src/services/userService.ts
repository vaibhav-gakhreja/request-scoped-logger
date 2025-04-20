import { UserDTO } from '../dto/userDto';
import { UserDAO } from '../dao/userDao';
import RequestLogger from "../logger/logger";
import Logger from "../logger/logger";

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
    getAllUsers(logger: RequestLogger): UserDTO[] {
        logger.info(`Fetching all users`);
        return this.userDAO.findAll(logger);
    }

    /**
     * Get user by ID
     * @param id - User ID
     * @returns User object or null if not found
     */
    getUserById(id: string, logger: Logger): UserDTO | null {
        logger.info(`Fetching user by ID: ${id}`);
        return this.userDAO.findById(id, logger);
    }

    /**
     * Create a new user
     * @param userData - User data
     * @returns Created user
     */
    createUser(userDTO: UserDTO, logger: Logger): UserDTO {
        logger.info(`Creating new user`);
        return this.userDAO.create(userDTO, logger);
    }

    /**
     * Update an existing user
     * @param id - User ID
     * @param userData - User data to update
     * @returns Updated user or null if not found
     */
    updateUser(id: string, userData: Partial<UserDTO>, logger: Logger): UserDTO | null {
        logger.info(`Updating user ${id}`);
        return this.userDAO.update(id, userData, logger);
    }

    /**
     * Delete a user
     * @param id - User ID
     * @returns True if deleted, false if not found
     */
    deleteUser(id: string, logger: Logger): boolean {
        logger.info(`Deleting user ${id}`);
        return this.userDAO.delete(id, logger);
    }
}