import { v4 as uuidv4 } from 'uuid';

/**
 * Data Transfer Object for User entity
 */
export class UserDTO {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    updatedAt: string;

    constructor(id: string, name: string, email: string, role: string = 'user') {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Create a UserDTO from request body
     * @param reqBody - Request body containing user data
     * @param id - Optional ID, will generate a new one if not provided
     * @returns New UserDTO instance
     */
    static fromRequest(reqBody: any, id: string | null = null): UserDTO {
        return new UserDTO(
            id || uuidv4(),
            reqBody.name,
            reqBody.email,
            reqBody.role || 'user'
        );
    }
}