import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { requireAuth, validate } from '../middlewares';
import { updatePreferencesSchema } from '../../../shared/types/user';

const router = Router();

// Seluruh rute users dilindungi autentikasi JWT (AUTH-04)
router.use(requireAuth);

/**
 * 17. PATCH /api/v1/users/preferences/receivables (RCV-01, Bab 6)
 * Toggle aktif/nonaktif modul Piutang (enableReceivablesModule) dan preferensi hideBalanceDefault
 */
router.patch(
  '/preferences/receivables',
  validate(updatePreferencesSchema),
  (req, res, next) => userController.updateReceivablesPreference(req, res, next)
);

export default router;
