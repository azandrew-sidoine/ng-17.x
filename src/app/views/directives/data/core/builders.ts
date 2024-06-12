import { map } from 'rxjs';
import { RestQueryType } from '../../datagrid';
import {
  ActionConfigType,
  ActionHandlerType,
  ActionType,
  ActionUIPositionType,
  AssetFormConfigType,
  ConfigType,
  HTTPMethodsType,
  InjectorFnOr,
  JsFormConfigType,
  NextCallback,
  OrObservable,
  PartialActionConfigType,
} from './types';
import {
  GridDetailColumnType,
  SearchableGridColumnType,
} from '@azlabsjs/ngx-clr-smart-grid';

/** @internal */
type PipeTransformType = string | ((value: any) => any) | undefined;

/** @internal */
type ActionTitleParamType = string | ((item: any) => string);

/**
 * @internal
 * Exported from @azlabsjs/built-type types declarations
 * Return type of the type safe parse method
 */
type SafeParseReturnType = {
  errors: any;
  success: boolean;
  data?: any;
};

export type TypeDef = {
  description?: string;
  coerce?: (value: any) => any;
  constraint: any;
};

/**
 * @internal
 *
 * Exported from @azlabsjs/built-type types declarations
 *
 * Generic type builder type declaration
 */
type _AbstractType<T = unknown, TDef extends TypeDef = TypeDef, TReturn = T> = {
  _output: T;
  _input: TReturn;
  _def: TDef;
  /**
   * Parse user provided value using the built-type.
   * It throws a `ParseError` error instance if the parsing fails.
   *
   * ```ts
   * const type = new BuiltType._object({ ... })
   *
   * // parsing a value using the type built type
   * const result = type.parse({ ... }); // throws `ParseError`
   *
   * ```
   */
  parse(value: unknown): any;

  /**
   * Parse user provided value using the built-type.
   *
   * ```ts
   * const type = new BuiltType._object({ ... })
   *
   * // parsing a value using the type built type
   * const result = type.safeParse({ ... }); // `SafeParseReturnType`
   *
   * if (result.success) {
   *  // TODO: interact with the parse result
   * }
   * ```
   */
  safeParse(value: unknown): SafeParseReturnType;
};

/**
 * @internal
 */
export type RawShapeType = { [k: string]: _AbstractType<any, any, any> };

type InferType<T extends _AbstractType<any, any, any>> = T['_output'];

/**
 * @internal
 *
 * Exported from @azlabsjs/built-type types declarations
 *
 * Object type builder type declaration
 */
type _ObjectType = _AbstractType<any, any, any> & {
  /**
   * TODO: Provide a better implementation to detect the reverseType instance type
   *
   * The reverse type of the current object
   */
  reverseType: _AbstractType<Record<string, any>, any, any>;
};

/** @internal */
export type ArgType = {
  url: string;
  noGridFormLayout?: boolean;
  form?:
    | string
    | number
    | Partial<AssetFormConfigType>
    | Partial<JsFormConfigType>;
  actions?: PartialActionConfigType;
  datagrid: {
    transformColumnTitle?: PipeTransformType | PipeTransformType[];
    selectable?: boolean;
    class?: string;
    singleSelection?: boolean;
    url?: string;
    rowClass?: string | ((element: any) => string);
    query?: RestQueryType;
    sizeOptions?: number[];
    columns: InjectorFnOr<OrObservable<SearchableGridColumnType[]>>;
    detail?: InjectorFnOr<
      OrObservable<(GridDetailColumnType & { editable?: boolean })[]>
    >;
  };
  defaultStrings?: { [prop in ActionType]: string };
  excludesActions?: ActionType[];
};

/** @internal */
export type BuiltTypeArgType = ArgType & {
  _type: _ObjectType;
};

/**
 * ArgType & BuiltTypeArgType union Type declaration
 */
export type DataConfigArgType = ArgType | BuiltTypeArgType;

/** @internal Build a resource url by appending resource id as path variable to original url */
export function buildRessouceUrl(url: string, id: string | number) {
  const _url = `${
    url.endsWith('/') ? url.substring(0, url.length - 1) : url
  }/${id}`;
  return _url;
}

/** @description Projection function that transform items in a collection into the built-type object */
export function mapInto<T extends _AbstractType<any, any, any> = _ObjectType>(
  _type: T,
  values: Record<string, unknown>[],
  thenCallback?: (value: InferType<T>) => InferType<T>
) {
  const _thenCallback = thenCallback ?? ((value) => value);
  const _values = values
    ? values
        .map((value) => {
          const _result = _type.safeParse(value);
          return _result.success ? _thenCallback(_result.data) : undefined;
        })
        .filter((value) => typeof value !== 'undefined' && value !== null)
    : values;
  return _values;
}

/** @description Creates an ngx-data configuration with built-type instance builder aware */
export function createBuiltTypeDataConfig<
  T extends BuiltTypeArgType = BuiltTypeArgType
>(params: T, excludes: ActionType[] = []) {
  const {
    url,
    form,
    _type,
    datagrid,
    actions = {},
    noGridFormLayout,
    defaultStrings = {} as { [prop in ActionType]: string },
    excludesActions = excludes,
  } = params;
  const beforeUpdateCallback = <T = unknown, R = any>(traveler: T) =>
    _type.reverseType.safeParse(traveler).data as R;

  let _defaultActionsTuple: [ActionType, Partial<ActionConfigType>][] = [
    [
      'list',
      {
        intercept: (traveler, next$) => {
          return next$(traveler).pipe(
            map((result) => {
              return Array.isArray(result)
                ? { data: mapInto(_type, result), total: result.length }
                : typeof result === 'object' && result !== null
                ? {
                    ...result,
                    data: mapInto(_type, result['data']),
                  }
                : result;
            })
          );
        },
      },
    ],
    [
      'create',
      {
        title: defaultStrings['create'] ?? 'create',
        position: 'action-bar',
      },
    ],
    [
      'update',
      {
        title: defaultStrings['update'] ?? 'update',
        position: 'overflow',
        before: beforeUpdateCallback,
      },
    ],
    [
      'delete',
      {
        title: defaultStrings['delete'] ?? 'delete',
        position: 'overflow',
      },
    ],
  ];

  // We remove the list of actions that should not be in the final action list
  if (excludesActions.length !== 0) {
    _defaultActionsTuple = _defaultActionsTuple.filter(
      ([name]) => excludesActions.indexOf(name) === -1
    );
  }

  const _defaultActions = _defaultActionsTuple.reduce(
    (carry, [name, value]) => {
      carry[name] = { ...value, ...(actions[name] ?? {}) };
      return carry;
    },
    {} as Record<ActionType, Partial<ActionConfigType>>
  );

  const _form =
    typeof form === 'object' && form !== null ? { ...form } : { id: form };
  return {
    url,
    form: {
      ..._form,
      url: _form.url ?? url,
      noGridLayout: noGridFormLayout ?? true,
    },
    actions: { ...actions, ..._defaultActions },
    datagrid,
  } as ConfigType;
}

/**
 * Provides ngx-data configuration with no transformation to apply on the input values
 */
export function createDataConfig<T extends ArgType = ArgType>(
  params: T,
  excludes: ActionType[] = []
) {
  const {
    url,
    form,
    datagrid,
    actions = {},
    noGridFormLayout,
    defaultStrings = {} as { [prop in ActionType]: string },
    excludesActions = excludes,
  } = params;

  const beforeUpdateCallback = <T = unknown, R = any>(traveler: T) =>
    traveler as unknown as R;

  let _defaultActionsTuple: [ActionType, Partial<ActionConfigType>][] = [
    [
      'list',
      {
        intercept: (traveler, next$) => {
          return next$(traveler).pipe(
            map((result) =>
              Array.isArray(result)
                ? { data: result, total: result.length }
                : typeof result === 'object' && result !== null
                ? {
                    ...result,
                    data: result['data'] as Record<string, unknown>[],
                  }
                : result
            )
          );
        },
      },
    ],
    [
      'create',
      {
        title: defaultStrings['create'] ?? 'create',
        position: 'action-bar',
      },
    ],
    [
      'update',
      {
        title: defaultStrings['update'] ?? 'update',
        position: 'overflow',
        before: beforeUpdateCallback,
      },
    ],
    [
      'delete',
      {
        title: defaultStrings['delete'] ?? 'delete',
        position: 'overflow',
      },
    ],
  ];

  // We remove the list of actions that should not be in the final action list
  if (excludesActions.length !== 0) {
    _defaultActionsTuple = _defaultActionsTuple.filter(
      ([name]) => excludesActions.indexOf(name) === -1
    );
  }

  const _defaultActions = _defaultActionsTuple.reduce(
    (carry, [name, value]) => {
      carry[name] = { ...value, ...(actions[name] ?? {}) };
      return carry;
    },
    {} as Record<ActionType, Partial<ActionConfigType>>
  );

  const _form =
    typeof form === 'object' && form !== null ? { ...form } : { id: form };
  return {
    url,
    form: {
      ..._form,
      url: _form.url ?? url,
      noGridLayout: noGridFormLayout ?? true,
    },
    actions: { ...actions, ..._defaultActions },
    datagrid,
  } as ConfigType;
}

/** @description Creates a custom action that is placed on or that act on a datagrid row item */
export function provideOverflowHttpActionHandler(
  title: ActionTitleParamType,
  method: string,
  intercept?: (
    traveler: any,
    next$: NextCallback<any, any>
  ) => ReturnType<typeof next$>,
  removeFn?: (value: any) => boolean,
  disabled?: (value: any) => boolean,
  cssClass?: string | string[]
) {
  return {
    title,
    method: method as HTTPMethodsType,
    position: 'overflow' as ActionUIPositionType,
    prepareUrl: (url: string, item: any) => buildRessouceUrl(url, item.id),
    intercept:
      intercept ??
      ((traveler: any, next$: NextCallback<any, any>) => next$(traveler)),
    remove: removeFn,
    disabled,
    cssClass,
  };
}

/** @description Creates a custom action that is placed on or that act on a datagrid row item */
export function provideActionBarHttpActionHandler(
  title: ActionTitleParamType,
  method: string,
  intercept?: (
    traveler: any,
    next$: NextCallback<any, any>
  ) => ReturnType<typeof next$>,
  removeFn?: (value: any) => boolean,
  disabled?: (value: any) => boolean,
  cssClass?: string | string[]
) {
  return {
    title,
    method: method as HTTPMethodsType,
    position: 'action-bar' as ActionUIPositionType,
    prepareUrl: (url: string) => url,
    intercept:
      intercept ??
      ((traveler: any, next$: NextCallback<any, any>) => next$(traveler)),
    remove: removeFn,
    disabled,
    cssClass,
  };
}

/** @description Provides an overflow action configuration for a generic action handler */
export function provideOverflowActionHandler(
  title: ActionTitleParamType,
  handle: (...args: any) => void | Promise<void>,
  removeFn?: (value: any) => boolean,
  disabled?: (value: any) => boolean,
  cssClass?: string | string[]
) {
  return {
    title,
    position: 'overflow' as ActionUIPositionType,
    handle,
    remove: removeFn,
    disabled,
    cssClass,
  } as ActionHandlerType;
}

/** @description Provides an action-bar action configuration for a generic action handler */
export function provideActionBarActionHandler(
  title: ActionTitleParamType,
  handle: (...args: any) => void | Promise<void>,
  removeFn?: (value: any) => boolean,
  disabled?: (value: any) => boolean,
  cssClass?: string | string[]
) {
  return {
    title,
    position: 'action-bar' as ActionUIPositionType,
    handle,
    remove: removeFn,
    disabled,
    cssClass,
  } as ActionHandlerType;
}
