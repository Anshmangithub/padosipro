import type { RequestHandler } from 'express';
import * as tasksService from './tasks.service';
import type { TaskSelectionInput } from './tasks.schema';

export const listCatalogueHandler: RequestHandler = async (_req, res, next) => {
  try {
    const tasks = await tasksService.listCatalogue();
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
};

export const getSelectionHandler: RequestHandler = async (req, res, next) => {
  try {
    const tasks = await tasksService.getSelection(req.user!.id);
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
};

export const saveSelectionHandler: RequestHandler = async (req, res, next) => {
  try {
    const { taskIds } = req.body as TaskSelectionInput;
    const tasks = await tasksService.saveSelection(req.user!.id, taskIds);
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
};
