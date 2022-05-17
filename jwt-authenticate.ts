import jwt from 'jsonwebtoken';
const {jwtSecret, jwtTokenexpiresInMinutes} = require('./config.json');

export function generateJwtToken(userId: string) {
  return jwt.sign({sub: userId}, jwtSecret, {
    expiresIn: jwtTokenexpiresInMinutes + 'm',
  });
}

export function isAuthenticated(req: any) {
  let token = '';
  if (
    req.headers.authorization &&
    req.headers.authorization.split(' ')[0] === 'Bearer'
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  try {
    jwt.verify(token, jwtSecret);
  } catch (err) {
    return false;
  }

  return true;
}
