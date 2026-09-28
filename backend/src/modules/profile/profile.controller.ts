import type { RequestHandler } from 'express';
import * as profileService from './profile.service';
import type { ProfileInput } from './profile.schema';

export const getProfileHandler: RequestHandler = async (req, res, next) => {
  try {
    const profile = await profileService.getProfile(req.user!.id);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
};

export const saveProfileHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = req.body as ProfileInput;
    const profile = await profileService.saveProfile(req.user!.id, input);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
};
