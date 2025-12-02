import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: false,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body || {};

    const normalized = {
      firstName: typeof firstName === 'string' ? firstName.trim() : '',
      lastName: typeof lastName === 'string' ? lastName.trim() : '',
      email: typeof email === 'string' ? email.trim().toLowerCase() : '',
      phone: typeof phone === 'string' ? phone.trim() : '',
      password: typeof password === 'string' ? password : '',
      role: typeof role === 'string' ? role : undefined,
    };

    const missing = [];
    if (!normalized.firstName) missing.push('firstName');
    if (!normalized.lastName) missing.push('lastName');
    if (!normalized.email) missing.push('email');
    if (!normalized.password) missing.push('password');
    if (missing.length) {
      return res.status(400).json({ message: 'Zorunlu alanlar eksik', missing });
    }
    const existing = await User.findOne({ email: normalized.email });
    if (existing) {
      return res.status(409).json({ message: 'Bu e-posta zaten kayıtlı' });
    }
    const passwordHash = await bcrypt.hash(normalized.password, 10);
    const user = await User.create({ firstName: normalized.firstName, lastName: normalized.lastName, email: normalized.email, phone: normalized.phone, passwordHash, role: normalized.role });
    return res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (error) {
    return res.status(500).json({ message: 'internal error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    res.cookie('token', token, COOKIE_OPTIONS);
    return res.json({ id: user.id, email: user.email, role: user.role });
  } catch (error) {
    return res.status(500).json({ message: 'internal error' });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token', { ...COOKIE_OPTIONS, maxAge: 0 });
  return res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select('firstName lastName email phone role');
  return res.json(user);
});

function createTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  });
}

router.post('/forgot-password', async (req, res) => {
  try {
    const email = (req.body?.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ message: 'email gerekli' });
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ ok: true });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 15);
    user.resetPasswordToken = token;
    user.resetPasswordExpiresAt = expires;
    await user.save();

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    const transporter = createTransport();
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@kocapp.local',
      to: email,
      subject: 'Şifre Sıfırlama',
      text: `Şifrenizi sıfırlamak için şu bağlantıya tıklayın: ${resetUrl}`,
      html: `<p>Şifrenizi sıfırlamak için <a href="${resetUrl}">bu bağlantıya</a> tıklayın. Bağlantı 15 dakika içinde geçerlidir.</p>`,
    });

    return res.json({ ok: true, preview: info.message ? info.message.toString() : undefined });
  } catch (error) {
    return res.status(500).json({ message: 'internal error' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ message: 'token ve password gerekli' });
    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpiresAt: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Token geçersiz veya süresi dolmuş' });
    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: 'internal error' });
  }
});

export default router;


