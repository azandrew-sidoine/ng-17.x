import { ActionType } from '../core';

/** @internal Default action definition */
export const defaultActions: ActionType[] = [
  'list',
  'create',
  'update',
  'delete',
];

/** @internal Default datagrid refresh state */
export const defaultDgState = {
  page: {
    size: 20,
    current: 1,
  },
  sort: {
    reverse: true,
    by: 'updated_at',
  },
};
