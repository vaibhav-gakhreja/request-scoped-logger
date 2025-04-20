import { Request, Response, NextFunction } from 'express';

/**
 * Decorator to disable logging for specific route handlers
 * @returns Method decorators function
 */
export function DisableLogging() {
    return function (
        target: Object,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        // Replace with new method that sets the disableLogging flag then calls the original method
        descriptor.value = function (req: Request, res: Response, next?: NextFunction) {

            // Middleware is applied before method decorators
            // so we will always have a logger attached to the request object before the below code runs
            req.logger.setDisableLogging(true);

            // call the original method
            return originalMethod.apply(this, arguments);
        };

        return descriptor;
    };
}