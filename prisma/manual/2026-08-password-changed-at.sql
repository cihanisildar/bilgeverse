-- Oturum güvenliği: User.passwordChangedAt + giriş kilidi alanları
--
-- 1) passwordChangedAt — JWT'ler stateless. Bu kolon olmadan bir kullanıcı
--    şifresini değiştirdiğinde diğer cihazlarda açık kalan tokenlar süresi
--    dolana kadar geçerli kalıyordu. `auth.config.ts` tazeleme turunda (5 dk)
--    token'daki damgayı buradaki değerle karşılaştırıp eski oturumları düşürür.
--    NULL = "hiç değişmedi".
--
-- 2) failedLoginCount / lockedUntil — üst üste 5 hatalı girişten sonra hesap
--    15 dakika kilitlenir; başarılı girişte ikisi de sıfırlanır. Kaba kuvvet
--    denemelerini yavaşlatır.
--
-- Güvenli: üçü de kolon EKLEME. `NOT NULL DEFAULT` Postgres 11+'da katalog
-- değişikliğidir, tabloyu yeniden yazmaz; mevcut satırlara dokunulmaz.
--
-- Uygulama: Neon SQL editöründe bu dosyanın tamamını çalıştırın.
-- Geri alma: ALTER TABLE "User" DROP COLUMN "passwordChangedAt", DROP COLUMN
--            "failedLoginCount", DROP COLUMN "lockedUntil";

BEGIN;

ALTER TABLE "User" ADD COLUMN     "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3);

COMMIT;
