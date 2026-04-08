function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const elapsed = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${elapsed}ms)`);
  });
  next();
}

function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Endpoint not found' });
}

function errorHandler(error, req, res, next) {
  console.error('Unhandled error', {
    path: req.originalUrl,
    method: req.method,
    message: error.message,
  });
  if (res.headersSent) return next(error);
  return res.status(500).json({ message: 'Internal server error' });
}

module.exports = { requestLogger, notFoundHandler, errorHandler };
