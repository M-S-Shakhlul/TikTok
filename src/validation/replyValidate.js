import Joi from "joi";

const replySchema = Joi.object({
    commentId: Joi.string().required(),
    userId: Joi.string().required(),
    text: Joi.string().min(1).max(500).required(),
});

export const createReplyValidation = replySchema;

export const updateReplyValidation = replySchema.fork(
    ['commentId', 'userId'],
    (schema) => schema.optional()
);