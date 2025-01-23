import { body } from 'express-validator';

export const createGroupValidation = [
    body('name')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Group name must be between 3 and 50 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
    body('settings.visibility')
        .isIn(['public', 'private'])
        .withMessage('Invalid visibility setting'),
    body('settings.joinPolicy')
        .isIn(['open', 'invite', 'closed'])
        .withMessage('Invalid join policy'),
    body('settings.snippetPermissions')
        .optional()
        .isObject()
        .withMessage('Invalid snippet permissions'),
    body('settings.directoryPermissions')
        .optional()
        .isObject()
        .withMessage('Invalid directory permissions')
];