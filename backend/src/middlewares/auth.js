const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      res.status(401);
      throw new Error('Authorization token missing or malformed');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401);
      throw new Error('Authorization token missing');
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).select('-password');

    if (!user) {
      res.status(401);
      throw new Error('User for this token no longer exists');
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      res.status(401);
      error.message = 'Token expired';
    } else if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'NotBeforeError'
    ) {
      res.status(401);
      error.message = 'Invalid token';
    }

    return next(error);
  }
}

module.exports = {
  protect,
};
