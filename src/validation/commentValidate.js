import Joi from "joi";

const commentSchema = Joi.object({
    text: Joi.string().min(1).max(500).required(),
    postId: Joi.string().optional(),
    userId: Joi.string().optional(),
});

export const createCommentValidation = commentSchema;

export const updateCommentValidation = commentSchema.fork(
    ['postId', 'userId'],
    (schema) => schema.optional()
);