async function withRetries(fn, retries = 2, baseDelayMs = 500) {
    let attempt = 0;
    while (true) {
        try {
            return await fn();
        } catch (err) {
            if (attempt >= retries) throw err;
            attempt++;
            const waitMs = baseDelayMs * attempt;
            await new Promise((r) => setTimeout(r, waitMs));
        }
    }
}

module.exports = { withRetries };
