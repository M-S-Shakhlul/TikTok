// Validate middleware
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true, // removes fields not in schema
        });

        if (error) {
            const errors = error.details.map((err) => ({
                field: err.path[0],
                message: err.message,
            }));

            return res.status(400).json({
                message: "Validation failed",
                errors,
            });
        }

        next();
    };
};

export { validate };