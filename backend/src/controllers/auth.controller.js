const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

function formatUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Name, email, and password are required');
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409);
      throw new Error('User already exists with this email');
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      ...(role && { role }),
    });

    const token = generateToken(user);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: formatUser(user),
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(400);
      error.message = Object.values(error.errors)
        .map((item) => item.message)
        .join(', ');
    }

    if (error.code === 11000) {
      res.status(409);
      error.message = 'User already exists with this email';
    }

    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Email and password are required');
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: formatUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
};
