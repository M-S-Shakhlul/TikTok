import Joi from "joi";

// Password policy:
// - Minimum 8 characters
// - At least one lowercase letter
// - At least one uppercase letter
// - At least one digit
// - At least one special character
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

const passwordRule = Joi.string()
    .min(8)
    .max(100)
    .pattern(passwordPattern)
    .messages({
        'string.pattern.base': 'Password must be at least 8 characters long and include uppercase, lowercase, number and special character',
        'string.min': 'Password must be at least {#limit} characters long',
        'string.max': 'Password must be at most {#limit} characters long',
    });

const userSchema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    // Accept raw password on input; it will be hashed before saving to DB
    password: passwordRule.required(),

    dob: Joi.date().optional(),
    age: Joi.number().integer().min(10).max(120).optional(),
    gender: Joi.string().valid("male", "female", "other").optional(),

    role: Joi.string().valid("user", "admin").default("user"),
    bio: Joi.string().max(200).optional(),
    avatarUrl: Joi.string().uri().optional(),

    isBanned: Joi.boolean().default(false),
    emailVerified: Joi.boolean().default(false),
    tags: Joi.array().items(Joi.string()).optional(),
});

export const registerValidation = userSchema;

export const loginValidation = Joi.object({
    email: Joi.string().email().required(),
    // login only requires presence of password; we don't re-validate strength on login
    password: Joi.string().required(),
});

export const updateUserValidation = userSchema.fork(['email', 'password'], (schema) => schema.optional());

export const resetPasswordValidation = Joi.object({
    token: Joi.string().required(),
    email: Joi.string().email().required(),
    // For reset we require the new password to follow the policy
    password: passwordRule.required(),
});