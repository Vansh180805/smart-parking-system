const jwt = require('jsonwebtoken');

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    try {
      const tokenHeader = req.headers.authorization;

      if (!tokenHeader || !tokenHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'No token, authorization denied',
        });
      }

      const token = tokenHeader.split(' ')[1];

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        // Role-based access control
        if (roles.length > 0 && !roles.includes(decoded.role)) {
          return res.status(403).json({
            success: false,
            message: 'Access forbidden. Insufficient permissions.',
          });
        }

        next();
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token has expired',
          });
        }
        return res.status(401).json({
          success: false,
          message: 'Token is not valid',
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authentication error',
      });
    }
  };
};

// Optional middleware for routes that may or may not have a token
const optionalAuth = (req, res, next) => {
  try {
    const tokenHeader = req.headers.authorization;

    if (tokenHeader && tokenHeader.startsWith('Bearer ')) {
      const token = tokenHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

module.exports = { authMiddleware, optionalAuth };
