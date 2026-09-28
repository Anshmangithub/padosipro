import type { RequestHandler } from 'express';
import * as authService from './auth.service';
import type { LoginInput, RegisterInput, ResendOtpInput, VerifyOtpInput } from './auth.schema';

export const registerHandler: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body as RegisterInput;
    const result = await authService.register(email, password);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const loginHandler: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body as LoginInput;
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const verifyOtpHandler: RequestHandler = async (req, res, next) => {
  try {
    const { email, code } = req.body as VerifyOtpInput;
    const result = await authService.verifyEmail(email, code);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const resendOtpHandler: RequestHandler = async (req, res, next) => {
  try {
    const { email } = req.body as ResendOtpInput;
    const result = await authService.resendOtp(email);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const meHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.getSessionInfo(req.user!.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
