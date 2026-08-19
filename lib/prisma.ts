import { Prisma, PrismaClient } from '@prisma/client';
import { getTenantContext, MissingTenantContextError } from './tenant-context';

const prismaClientSingleton = () => {
  // Parse DATABASE_URL and add connection pool parameters if not present
  let databaseUrl = process.env.DATABASE_URL || '';

  // Add connection pool parameters to handle concurrent requests
  // connection_limit: Maximum number of connections in the pool (default is 1)
  // pool_timeout: Maximum time to wait for a connection (default is 10 seconds)
  if (databaseUrl && !databaseUrl.includes('connection_limit')) {
    try {
      const url = new URL(databaseUrl);
      url.searchParams.set('connection_limit', '10');
      url.searchParams.set('pool_timeout', '60');
      databaseUrl = url.toString();
    } catch (error) {
      // If URL parsing fails, try to append parameters manually
      // This handles PostgreSQL connection strings that might not be standard URLs
      const separator = databaseUrl.includes('?') ? '&' : '?';
      databaseUrl = `${databaseUrl}${separator}connection_limit=10&pool_timeout=60`;
    }
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    transactionOptions: {
      timeout: 10000, // 10 seconds default timeout
    },
  });

  return prisma;
};

// ---------------------------------------------------------------------------
// Multi-tenant (kurum) izolasyonu
// ---------------------------------------------------------------------------

/** `organizationId` kolonu OLMAYAN modeller. Diğer her şey kuruma aittir. */
const ORG_EXEMPT_MODELS = new Set<string>(['Organization']);

/** Kurum filtresi alan tüm modeller — şemadan türetilir, elle liste tutulmaz. */
const TENANT_MODELS = new Set<string>(
  Prisma.dmmf.datamodel.models
    .map((m) => m.name)
    .filter((name) => !ORG_EXEMPT_MODELS.has(name))
);

/**
 * `where` bir filtre nesnesi olan operasyonlar. Burada AND ile sarmalanır ki
 * mevcut `OR` / `deletedAt` filtreleriyle çakışıp sonuç kümesini sessizce
 * genişletmesin (üst seviye spread bunu yapardı).
 */
const FILTER_WHERE_OPS = new Set([
  'findMany', 'findFirst', 'findFirstOrThrow',
  'count', 'aggregate', 'groupBy',
  'updateMany', 'deleteMany',
]);

/**
 * `where` bir *unique* girdi olan operasyonlar. Prisma 5'te `extendedWhereUnique`
 * GA olduğu için unique alanın yanına unique olmayan filtre eklenebiliyor —
 * bu sayede ek doğrulama sorgusu atmaya gerek kalmıyor (ki bu, aynı
 * `$transaction` içinde henüz commit edilmemiş kaydı göremeyip yanlış
 * "bulunamadı" hatası vermeye yol açardı). Unique girdide `AND` kullanılamaz,
 * bu yüzden alan olarak eklenir.
 */
const UNIQUE_WHERE_OPS = new Set([
  'findUnique', 'findUniqueOrThrow',
  'update', 'delete', 'upsert',
]);

const base = prismaClientSingleton();

/**
 * Tenant filtresi UYGULANMAYAN ham client.
 *
 * Yalnızca şu yerlerde kullanılır:
 *  - `app/api/auth/**`        (giriş sırasında henüz kurum bağlamı yok)
 *  - `app/superadmin/**`, `app/api/superadmin/**`
 *  - `scripts/**`
 *
 * Başka bir yerde kullanılması kurum izolasyonunu delme anlamına gelir.
 */
export const prismaUnscoped = base;

const prisma = base.$extends({
  name: 'tenant-isolation',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!model || !TENANT_MODELS.has(model)) {
          return query(args);
        }

        const ctx = await getTenantContext();

        // Süper admin / script: filtre uygulanmaz.
        if (ctx?.bypass) return query(args);

        // Fail-closed: bağlam yoksa tüm kurumların verisini döndürmek yerine hata.
        if (!ctx?.organizationId) {
          throw new MissingTenantContextError(`${model}.${operation}`);
        }
        const organizationId = ctx.organizationId;

        const a = args as any;

        if (FILTER_WHERE_OPS.has(operation)) {
          a.where = a.where ? { AND: [a.where, { organizationId }] } : { organizationId };
        } else if (UNIQUE_WHERE_OPS.has(operation)) {
          a.where = { ...a.where, organizationId };
        }

        // Yazma: kurum bilgisini veriye koy.
        // NOT: `update`/`updateMany` bilinçli olarak dokunulmaz — bir kaydın
        // kurumu hiçbir zaman değiştirilemez.
        if (operation === 'create') {
          a.data = { ...a.data, organizationId };
        } else if (operation === 'upsert') {
          a.create = { ...a.create, organizationId };
        } else if (operation === 'createMany') {
          a.data = Array.isArray(a.data)
            ? a.data.map((d: any) => ({ ...d, organizationId }))
            : { ...a.data, organizationId };
        }

        if (process.env.NODE_ENV !== 'production') {
          warnOnNestedWrites(model, operation, a);
        }

        return query(a);
      },
    },
  },
});

/**
 * Extension yalnızca üst seviye `args`'ı görür; iç içe ilişki yazmalarına
 * (`data: { x: { create: {...} } }`) `organizationId` enjekte edemez. Bu tür
 * yazmalar sessizce yanlış kuruma düşebileceği için geliştirmede uyarı verir.
 */
const NESTED_WRITE_KEYS = new Set(['create', 'createMany', 'connectOrCreate', 'upsert']);

function warnOnNestedWrites(model: string, operation: string, args: any, depth = 0): void {
  if (depth > 4) return;
  for (const key of ['data', 'create', 'update'] as const) {
    const node = args?.[key];
    if (!node || typeof node !== 'object') continue;
    for (const [field, value] of Object.entries(node)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      const nestedKeys = Object.keys(value).filter((k) => NESTED_WRITE_KEYS.has(k));
      if (nestedKeys.length > 0) {
        console.warn(
          `[tenant] ${model}.${operation}: "${field}" alanında iç içe yazma ` +
          `(${nestedKeys.join(', ')}) tespit edildi. organizationId otomatik ` +
          `eklenmez — ilgili data nesnesine elle eklenmelidir.`
        );
      }
    }
  }
}

// Geliştirmede/CI'da: şemaya yeni bir model eklenip organizationId eklenmediyse
// erkenden yakala. Bu kontrol olmadan 98. model sessizce kurumlar arası sızar.
if (process.env.NODE_ENV !== 'production') {
  const missing = Prisma.dmmf.datamodel.models
    .filter((m) => !ORG_EXEMPT_MODELS.has(m.name))
    .filter((m) => !m.fields.some((f) => f.name === 'organizationId'))
    .map((m) => m.name);

  if (missing.length > 0) {
    console.error(
      `[tenant] UYARI: şu modellerde organizationId kolonu yok, kurum ` +
      `izolasyonu bu modellerde ÇALIŞMAZ: ${missing.join(', ')}`
    );
  }
}

declare global {
  var prisma: undefined | typeof prismaExtended;
}

const prismaExtended = prisma;

const globalPrisma = globalThis.prisma ?? prismaExtended;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = globalPrisma;

export default globalPrisma;
