import { UIActionState } from '../../../types';

/**
 * @const
 */
export const ALERT_TYPES: Partial<
  Record<UIActionState, 'warning' | 'success' | 'danger' | 'default'>
> = {
  error: 'danger',
  success: 'success',
  exception: 'danger',
  'request-error': 'danger',
  none: 'default',
  'bad-request': 'warning',
};
