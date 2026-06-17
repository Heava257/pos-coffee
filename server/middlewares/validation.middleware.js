module.exports = (schema, property = 'body') => {
    return (req, res, next) => {
        if (!schema) return next();
        const { error } = schema.validate(req[property]);
        if (error) {
            return res.status(400).json({
                message: error.details[0].message,
                error: "VALIDATION_ERROR"
            });
        }
        next();
    };
};
