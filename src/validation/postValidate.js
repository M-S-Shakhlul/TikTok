import Joi from "joi";

const postSchema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(300).allow(""),
    ownerId: Joi.string().required(),
    videoUrl: Joi.string().uri().required(),
    mimeType: Joi.string().optional(),
    sizeBytes: Joi.number().optional(),

    durationSec: Joi.number().optional(),
    category: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),

    visibility: Joi.string().valid("public", "private").default("public"),
    processingStatus: Joi.string()
        .valid("pending", "processing", "ready", "failed")
        .default("ready"),
});

export const createPostValidation = postSchema;

export const updatePostValidation = postSchema.fork(
    ['ownerId', 'videoUrl'],
    (schema) => schema.optional()
);