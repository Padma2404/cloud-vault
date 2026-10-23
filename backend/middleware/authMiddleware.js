const jwt = require('jsonwebtoken')

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        message: 'Authentication required'
      })
    }

    const parts = authHeader.trim().split(/\s+/)

    if (
      parts.length !== 2 ||
      parts[0].toLowerCase() !== 'bearer'
    ) {
      return res.status(401).json({
        message: 'Invalid authorization format'
      })
    }

    const token = parts[1]

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    if (!decoded.userId) {
      return res.status(401).json({
        message: 'Invalid authentication token'
      })
    }

    req.user = {
      userId: decoded.userId
    }

    next()
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token'
    })
  }
}

module.exports = authMiddleware