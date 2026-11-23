import jwt from 'jsonwebtoken';

export function generateAuthToken(user) {
  const secret = process.env.JWT_SECRET || 'secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    { id: user.id, email: user.email, user_type: user.user_type },
    secret,
    { expiresIn }
  );
}
