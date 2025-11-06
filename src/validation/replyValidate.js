import Joi from "joi";

const replySchema = Joi.object({
    text: Joi.string().min(1).max(500).required(),
    commentId: Joi.string().optional(),
    userId: Joi.string().optional(),
});

export const createReplyValidation = replySchema;

export const updateReplyValidation = replySchema.fork(
    ['commentId', 'userId'],
    (schema) => schema.optional()
);