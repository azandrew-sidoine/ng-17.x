import { InjectionToken } from '@angular/core';
import { Dialog } from './types';

/** @description Dialog instance provider token */
export const DIALOG = new InjectionToken<Dialog>(
  'App Dialog instance provider'
);
