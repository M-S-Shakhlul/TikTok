import Joi from "joi";

const commentSchema = Joi.object({
    postId: Joi.string().required(),
    userId: Joi.string().required(),
    text: Joi.string().min(1).max(500).required(),
});

export const createCommentValidation = commentSchema;

export const updateCommentValidation = commentSchema.fork(
    ['postId', 'userId'],
    (schema) => schema.optional()
);