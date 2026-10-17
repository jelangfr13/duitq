import { Request, Response, NextFunction } from 'express';
import { budgetService } from '../services/budget.service';
import { CreateBudgetDTO, UpdateBudgetDTO } from '../../../shared/types/budget';

export class BudgetController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const includeArchived = req.query.includeArchived === 'true';
      const fundingSourceId = req.query.fundingSourceId as string | undefined;

      const result = await budgetService.getAll(userId, {
        includeArchived,
        fundingSourceId,
      });

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const budget = await budgetService.getById(userId, req.params.id);

      res.status(200).json({
        status: 'success',
        data: { budget },
      });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const dto: CreateBudgetDTO = req.body;
      const budget = await budgetService.create(userId, dto);

      res.status(201).json({
        status: 'success',
        data: { budget },
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const dto: UpdateBudgetDTO = req.body;
      const budget = await budgetService.update(userId, req.params.id, dto);

      res.status(200).json({
        status: 'success',
        data: { budget },
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await budgetService.delete(userId, req.params.id);

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await budgetService.getTransactions(userId, req.params.id, page, limit);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const budgetController = new BudgetController();
