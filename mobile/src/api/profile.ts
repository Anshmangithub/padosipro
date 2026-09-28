import { apiClient } from './client';
import type { Profile, ProfileInput } from '../types';

export function getProfile() {
  return apiClient.get<Profile>('/profile').then((r) => r.data);
}

export function saveProfile(input: ProfileInput) {
  return apiClient.put<Profile>('/profile', input).then((r) => r.data);
}
