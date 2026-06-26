import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokens';
import { firebaseAuth } from '../configs/firebase';
import { AuthRequest } from '../types';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, photoURL } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists with this email.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      photoURL: photoURL || '',
      role: 'user',
    });

    const accessToken = generateAccessToken({
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
    });

    const refreshToken = generateRefreshToken({
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          photoURL: user.photoURL,
          role: user.role,
          isPremium: user.isPremium,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Registration failed.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    if (!user.password) {
      res.status(401).json({ message: 'This account uses social login. Please login with Google.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const accessToken = generateAccessToken({
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
    });

    const refreshToken = generateRefreshToken({
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          photoURL: user.photoURL,
          role: user.role,
          isPremium: user.isPremium,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Login failed.' });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const { email, name, picture, uid } = decodedToken;

    if (!email) {
      res.status(400).json({ message: 'Email is required for authentication.' });
      return;
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name || 'Google User',
        email,
        photoURL: picture || '',
        role: 'user',
        firebaseUid: uid,
      });
    } else if (user.firebaseUid !== uid) {
      user.firebaseUid = uid;
      await user.save();
    }

    const accessToken = generateAccessToken({
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
    });

    const refreshToken = generateRefreshToken({
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
    });

    res.status(200).json({
      success: true,
      message: 'Google login successful.',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          photoURL: user.photoURL,
          role: user.role,
          isPremium: user.isPremium,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Google login failed.' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({ message: 'Refresh token is required.' });
      return;
    }

    const decoded = verifyRefreshToken(token);

    const user = await User.findById(decoded._id);
    if (!user) {
      res.status(401).json({ message: 'User not found.' });
      return;
    }

    const accessToken = generateAccessToken({
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
    });

    const newRefreshToken = generateRefreshToken({
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
    });

    res.status(200).json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch (error: any) {
    res.status(401).json({ message: 'Invalid refresh token.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
