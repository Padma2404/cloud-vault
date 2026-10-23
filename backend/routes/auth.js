
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const { randomInt } = require('crypto')

const User = require('../models/User')

const router = express.Router()

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/* ==========================================
   TEMPORARY OTP STORAGE
   ========================================== */

const otpStore = new Map()

/* ==========================================
   REGISTER
   ========================================== */

router.post('/register', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim()
    const email = normalizeEmail(req.body.email)
    const password = String(req.body.password || '')

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Please fill in all fields'
      })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address'
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters'
      })
    }

    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    })

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Registration error:', error.message)

    return res.status(500).json({
      message: 'Server error'
    })
  }
})

/* ==========================================
   LOGIN
   ========================================== */

router.post('/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const password = String(req.body.password || '')

    if (!email || !password) {
      return res.status(400).json({
        message: 'Please enter email and password'
      })
    }

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      })
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    )

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Invalid email or password'
      })
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured')

      return res.status(500).json({
        message: 'Server configuration error'
      })
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Login error:', error.message)

    return res.status(500).json({
      message: 'Server error'
    })
  }
})

/* ==========================================
   FORGOT PASSWORD - SEND OTP
   ========================================== */

router.post('/forgot-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address'
      })
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        message: 'Email service is not configured on the server'
      })
    }

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({
        message: 'No account found with this email address'
      })
    }

    // Generate a secure six-digit OTP.
    const otp = randomInt(100000, 1000000).toString()

    // OTP expires after 10 minutes.
    const expiresAt = Date.now() + 10 * 60 * 1000

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    // Send the OTP before saving it.
    await transporter.sendMail({
      from: `"Cloud Vault" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Cloud Vault Password Reset OTP',
      text:
        `Your Cloud Vault password reset OTP is ${otp}. ` +
        'It is valid for 10 minutes. ' +
        'If you did not request this, please ignore this email.'
    })

    otpStore.set(email, {
      otp,
      expiresAt,
      attempts: 0
    })

    return res.json({
      message: 'OTP sent successfully to your email'
    })
  } catch (error) {
    console.error('Send OTP error:', error.message)

    return res.status(500).json({
      message: 'Could not send OTP. Please try again.'
    })
  }
})

/* ==========================================
   RESET PASSWORD
   ========================================== */

router.post('/reset-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const otp = String(req.body.otp || '').trim()
    const newPassword = String(req.body.newPassword || '')

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: 'Please fill in all fields'
      })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address'
      })
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        message: 'Please enter the six-digit OTP'
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters'
      })
    }

    const savedOtp = otpStore.get(email)

    if (!savedOtp) {
      return res.status(400).json({
        message: 'OTP not found. Please request a new OTP.'
      })
    }

    if (Date.now() > savedOtp.expiresAt) {
      otpStore.delete(email)

      return res.status(400).json({
        message: 'OTP has expired. Please request a new OTP.'
      })
    }

    // Limit incorrect OTP attempts.
    if (savedOtp.attempts >= 5) {
      otpStore.delete(email)

      return res.status(429).json({
        message: 'Too many incorrect attempts. Please request a new OTP.'
      })
    }

    if (savedOtp.otp !== otp) {
      savedOtp.attempts += 1
      otpStore.set(email, savedOtp)

      return res.status(400).json({
        message: 'Invalid OTP'
      })
    }

    const user = await User.findOne({ email })

    if (!user) {
      otpStore.delete(email)

      return res.status(404).json({
        message: 'User not found'
      })
    }

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    // OTP can only be used once.
    otpStore.delete(email)

    return res.json({
      message: 'Password reset successfully. Please login with your new password.'
    })
  } catch (error) {
    console.error('Reset password error:', error.message)

    return res.status(500).json({
      message: 'Could not reset password. Please try again.'
    })
  }
})

module.exports = router
