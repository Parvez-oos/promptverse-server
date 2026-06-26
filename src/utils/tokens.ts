import jwt from 'jsonwebtoken';

export const generateAccessToken = (user: {
  _id: string;
  email: string;
  role: string;
  isPremium: boolean;
}): string => {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
    },
    process.env.JWT_ACCESS_SECRET || 'access_secret',
    { expiresIn: '1d' }
  );
};

export const generateRefreshToken = (user: {
  _id: string;
  email: string;
  role: string;
  isPremium: boolean;
}): string => {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
    },
    process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    { expiresIn: '7d' }
  );
};

export const verifyRefreshToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
};
