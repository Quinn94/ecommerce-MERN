import asyncHandler from 'express-async-handler'
import jwt from 'jsonwebtoken'
import User from '../model/userModel.js'

const protect = asyncHandler(async (req, res, next) => {
  let token //send thru postman Headers

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      console.log(`protect, decoded - ${decoded}`)

      req.user = await User.findById(decoded.id).select('-password')
      console.log(`protect, req.user - ${req.user}`)

      next()

    } catch (error) {
      console.error(error)
      res.status(401)
      throw new Error('Not authorized, token failed')
    }
  }

  if (!token) {
    res.status(401)
    throw new Error('Not authorized, token not found')
  }
})

const isAdmin = asyncHandler((req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next()
  } else {
    res.status(401)
    throw new Error('Not authorized as admin')
  }
})

export { protect, isAdmin } 