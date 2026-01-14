module.exports = function (fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next))
            .catch(err => {
                if (res.headersSent) return;
                next(err);
            });
    };
};
