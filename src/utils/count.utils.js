export const updateWithRetry = async(model, id, update, options = {}, maxRetries = 3) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            // build opts but only include session if provided
            const opts = {...options };
            if (opts.session === undefined) delete opts.session;

            return await model.findByIdAndUpdate(id, update, opts);
        } catch (err) {
            lastError = err;

            // If server complains about transaction numbers (standalone mongod),
            // retry the operation without any session and return result immediately.
            const msg = (err && err.message) || '';
            if (msg.includes('Transaction numbers are only allowed') || msg.includes('does not support sessions')) {
                try {
                    return await model.findByIdAndUpdate(id, update, { new: options.new });
                } catch (e2) {
                    lastError = e2;
                }
            }

            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
            }
        }
    }

    console.error(`Failed to update ${model.modelName} after ${maxRetries} attempts`, lastError);
    throw lastError;
};