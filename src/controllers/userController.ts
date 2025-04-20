import { Router, Request, Response } from 'express';
import { UserService } from '../services/userService';
import { DisableLogging } from '../decorators/disableLogging';
import {UserDTO} from "../dto/userDto";
import {CreateUserRequestBody} from "../dto/createUserRequestBody";

/**
 * Controller for User entity endpoints
 */
export class UserController {
    router: Router;
    private userService: UserService;

    /**
     * Create a new UserController instance
     */
    constructor() {
        this.router = Router();
        this.userService = new UserService();
        this.initializeRoutes();
    }

    /**
     * Initialize controller routes
     * @private
     */
    private initializeRoutes(): void {
        this.router.get('/', this.getAllUsers.bind(this));
        this.router.get('/:id', this.getUserById.bind(this));
        this.router.post('/', this.createUser.bind(this));
        this.router.put('/:id', this.updateUser.bind(this));
        this.router.delete('/:id', this.deleteUser.bind(this));
        this.router.get('/silent/:id', this.getSilentUser.bind(this));
    }

    /**
     * Get all users
     * @param req - Express request
     * @param res - Express response
     */
    getAllUsers(req: Request, res: Response): void {
        try {
            req.logger.debug('Fetching all users');
            const users = this.userService.getAllUsers(req.logger);
            req.logger.info(`Retrieved ${users.length} users`);
            res.json(users);
        } catch (error) {
            req.logger.error('Error fetching users');
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    }

    /**
     * Get user by ID
     * @param req - Express request
     * @param res - Express response
     */
    getUserById(req: Request, res: Response): void {
        try {
            const { id } = req.params;
            req.logger.debug(`Fetching user by ID: ${id}`);

            const user = this.userService.getUserById(id, req.logger);

            if (!user) {
                req.logger.info(`User not found with ID: ${id}`);
                res.status(404).json({ error: 'User not found' });
            }

            req.logger.info(`Retrieved user: ${user!.id}`);
            res.json(user);
        } catch (error) {
            req.logger.error(`Error fetching user ${req.params.id}`);
            res.status(500).json({ error: 'Failed to fetch user' });
        }
    }

    /**
     * Create a new user
     * @param req - Express request
     * @param res - Express response
     */
    createUser(req: Request<{}, {}, CreateUserRequestBody>, res: Response): void {
        try {
            req.logger.debug('Creating new user', { bodySize: JSON.stringify(req.body).length });
            const newUser = this.userService.createUser(UserDTO.fromRequest(req.body), req.logger);
            req.logger.info(`Created new user: ${newUser.id}`);
            res.status(201).json(newUser);
        } catch (error) {
            req.logger.error('Error creating user');
            res.status(500).json({ error: 'Failed to create user' });
        }
    }

    /**
     * Update an existing user
     * @param req - Express request
     * @param res - Express response
     */
    updateUser(req: Request, res: Response): void {
        try {
            const { id } = req.params;
            req.logger.debug(`Updating user ${id}`, { bodySize: JSON.stringify(req.body).length });

            const updatedUser = this.userService.updateUser(id, req.body, req.logger);

            if (!updatedUser) {
                req.logger.info(`User not found for update: ${id}`);
                res.status(404).json({ error: 'User not found' });
            }

            req.logger.info(`Updated user: ${id}`);
            res.json(updatedUser);
        } catch (error) {
            req.logger.error(`Error updating user ${req.params.id}`);
            res.status(500).json({ error: 'Failed to update user' });
        }
    }

    /**
     * Delete a user
     * @param req - Express request
     * @param res - Express response
     */
    deleteUser(req: Request, res: Response): void {
        try {
            const { id } = req.params;
            req.logger.debug(`Deleting user ${id}`);

            const deleted = this.userService.deleteUser(id, req.logger);

            if (!deleted) {
                req.logger.info(`User not found for deletion: ${id}`);
                res.status(404).json({ error: 'User not found' });
            }

            req.logger.info(`Deleted user: ${id}`);
            res.status(204).send();
        } catch (error) {
            req.logger.error(`Error deleting user ${req.params.id}`);
            res.status(500).json({ error: 'Failed to delete user' });
        }
    }

    /**
     * Get user by ID with logging disabled
     * Uses the DisableLogging decorators to disable logging for this endpoint
     * @param req - Express request
     * @param res - Express response
     */
    @DisableLogging()
    getSilentUser(req: Request, res: Response): void {
        try {
            const { id } = req.params;
            // These logs should not appear in the log file due to @DisableLogging
            req.logger.debug(`Silent fetching user by ID: ${id}`);

            const user = this.userService.getUserById(id, req.logger);

            if (!user) {
                res.status(404).json({ error: 'User not found' });
            }

            res.json(user);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch user' });
        }
    }
}