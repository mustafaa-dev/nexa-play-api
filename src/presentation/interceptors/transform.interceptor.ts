import { EntityViewEnum } from '@core/entities/base.entity';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface IResponse<T> {
  statusCode: number;
  data: T;
  timestamp: string;
}

interface ITransformOptions {
  exclude?: string[];
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, IResponse<T>> {
  constructor(private readonly options: ITransformOptions = {}) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<IResponse<T>> {
    const req = context.switchToHttp().getRequest();

    const path = req.url;

    if (this.options.exclude?.includes(path)) {
      return next.handle();
    }
    return next.handle().pipe(
      map(data => {
        const view = determineViewFromRequest(req);
        const serialized = deepSerializeByView(data, view);

        // Map string 'null' to nulls and omit top-level message key from data
        let payloadData = mapNull(serialized);
        if (
          payloadData &&
          typeof payloadData === 'object' &&
          'message' in (payloadData as object)
        ) {
          const rest = { ...(payloadData as Record<string, unknown>) };
          delete (rest as Record<string, unknown>).message;
          payloadData = rest as typeof payloadData;
        }

        const response = {
          message: (data as Record<string, unknown> | undefined)?.message,
          statusCode: context.switchToHttp().getResponse().statusCode,
          data: payloadData as T,
          timestamp: new Date().toISOString(),
        };
        return response;
      }),
    );
  }
}

const mapNull = <T>(data: T): T => {
  const convert = (value: unknown): unknown => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (Array.isArray(value)) {
      return value.map(v => convert(v));
    }
    if (value !== null && typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>).map(([k, v]) => {
        const normalized = v === 'null' ? null : v;
        return [k, convert(normalized)];
      });
      return Object.fromEntries(entries);
    }
    return value === 'null' ? null : value;
  };
  return convert(data) as T;
};

// Determine the entity view (admin vs user) from the request's authenticated user
interface IRequestWithUserRole {
  user?: { role?: { name?: string } | string };
}

const determineViewFromRequest = (req: IRequestWithUserRole | undefined): EntityViewEnum => {
  try {
    const role = req?.user?.role;
    const roleName: string | undefined = typeof role === 'string' ? role : role?.name;
    if (typeof roleName === 'string' && roleName.toLowerCase() === 'admin') {
      return EntityViewEnum.ADMIN;
    }
  } catch {
    // fallthrough to default
  }
  return EntityViewEnum.USER;
};

// Type guard for domain entities implementing toJSON + setView + toStore (heuristic)
interface IDomainEntityLike {
  setView: (v: EntityViewEnum) => unknown;
  toJSON: () => unknown;
  toStore: () => unknown;
}

const isDomainEntity = (value: unknown): value is IDomainEntityLike => {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as Record<string, unknown>).toJSON === 'function' &&
    typeof (value as Record<string, unknown>).setView === 'function' &&
    typeof (value as Record<string, unknown>).toStore === 'function'
  );
};

// Recursively apply view to entity graphs to ensure nested entities inherit the same view
const applyViewDeep = (obj: unknown, view: EntityViewEnum, visited: WeakSet<object>): void => {
  if (obj === undefined || obj === null || typeof obj !== 'object') return;
  if (visited.has(obj)) return;
  visited.add(obj);

  if (isDomainEntity(obj)) {
    obj.setView(view);
  }

  if (Array.isArray(obj as unknown[])) {
    for (const item of obj as unknown[]) {
      applyViewDeep(item, view, visited);
    }
    return;
  }

  // Traverse enumerable properties to propagate view to nested entities
  Object.values(obj as Record<string, unknown>).forEach(val => {
    if (val && typeof val === 'object') applyViewDeep(val, view, visited);
  });
};

// Deeply serialize any data structure, converting domain entities to JSON based on the chosen view
const deepSerializeByView = (
  data: unknown,
  view: EntityViewEnum,
  visited: WeakSet<object> = new WeakSet(),
): unknown => {
  if (data === null || data === undefined) return data;

  // Dates and primitives
  if (typeof data !== 'object') return data;
  if (data instanceof Date) return data.toISOString();

  // Arrays
  if (Array.isArray(data as unknown[])) {
    return (data as unknown[]).map(item => deepSerializeByView(item, view, visited));
  }

  // Domain entity
  if (isDomainEntity(data)) {
    applyViewDeep(data, view, visited);
    return data.toJSON();
  }

  // Plain object: recursively serialize its properties
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    result[key] = deepSerializeByView(value, view, visited);
  }
  return result;
};
