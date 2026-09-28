import { apiClient } from './client';
import type { Task } from '../types';

export function listCatalogue() {
  return apiClient.get<Task[]>('/tasks').then((r) => r.data);
}

export function getSelection() {
  return apiClient.get<Task[]>('/tasks/selection').then((r) => r.data);
}

export function saveSelection(taskIds: string[]) {
  return apiClient.post<Task[]>('/tasks/selection', { taskIds }).then((r) => r.data);
}
