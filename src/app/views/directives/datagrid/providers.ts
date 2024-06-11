import { Provider } from '@angular/core';
import { DataGridStateType } from './types';
import { DATAGRID_CONFIG } from './tokens';

/** @description Datagrid configuration angular provider */
export function provideDatagridConfig(gridConfig: DataGridStateType) {
  return {
    provide: DATAGRID_CONFIG,
    useFactory: () => {
      return (
        gridConfig ?? {
          pagination: { page: 'page', perPage: 'per_page' },
          pageSize: 20,
          pageSizeOptions: [20, 50, 100, 150],
        }
      );
    },
  } as Provider;
}
