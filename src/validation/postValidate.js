// src/validations/post.validation.js
import Joi from "joi";

const tagsField = Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
).optional();

export const createPostValidation = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(300).allow(""),
    videoUrl: Joi.string().uri().required(), // عندما يكون الفيديو موجود مسبقًا
    thumbnailUrl: Joi.string().uri().optional(),
    durationSec: Joi.number().optional(),
    tags: tagsField.default([]),
    ownerId: Joi.string().optional(), // لأنك ممكن تبعته من الـ frontend أو من التوكن
});

export const uploadPostValidation = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(300).allow(""),
    ownerId: Joi.string().optional(), // backend ممكن يجيبها من التوكن
    tags: tagsField.default([]),
});

export const updatePostValidation = Joi.object({
    title: Joi.string().min(3).max(100).optional(),
    description: Joi.string().max(300).allow("").optional(),
    thumbnailUrl: Joi.string().uri().optional(),
    videoUrl: Joi.string().uri().optional(),
    durationSec: Joi.number().optional(),
    tags: tagsField.optional(),
});