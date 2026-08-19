import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prismaUnscoped } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { TutorInfo } from "@/types/next-auth";
import { USER_AUTH_SELECT, normalizeUserRoles, isUserInAcademy } from "@/app/lib/auth-helpers";
import { getOrgAllowedParts } from "@/app/lib/packages";
import { normalizeOrgCode, SYSTEM_ORG_CODE } from "@/lib/constants/tenant";

/** Kurum yetkileri JWT'de bu aralıkta bir kez tazelenir. */
const ENTITLEMENT_TTL_MS = 5 * 60 * 1000;

/**
 * Kaba kuvvet frenleri. Kilit kullanıcı satırında tutulur (ayrı bir tablo ya
 * da bellek içi sayaç yerine): uygulama sunucusuz çalıştığı için bellekteki
 * sayaç örnekler arasında paylaşılmaz ve hiçbir şey engellemezdi.
 * Kilit kasten kısa — uzun kilit, saldırganın yöneticiyi dışarıda bırakması
 * için bir DoS aracına dönüşür.
 */
const MAX_FAILED_LOGINS = 5;
const LOCK_MS = 15 * 60 * 1000;

// Giriş sırasında henüz oturum (dolayısıyla kurum bağlamı) yoktur; bu yüzden
// bu dosya tenant extension'ı olmayan `prismaUnscoped` kullanır ve kurum
// filtresini elle uygular. Ayrıca `PrismaAdapter` bilinçli olarak yoktur:
// Credentials + JWT stratejisinde kullanılmıyor, `email` üzerinden findUnique
// yaptığı için kurum-bazlı benzersizlikle derlenmiyor ve tenant extension'ın
// oturumu okuması ile sonsuz döngüye girme riski taşıyor.
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        orgCode: { label: "Kurum Kodu", type: "text" },
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Hata mesajları kasten aynı: kurum kodunun var olup olmadığını
        // sızdırmamak için (kurum kodu numaralandırmasını engeller).
        const INVALID = "Kurum kodu, kullanıcı adı veya şifre hatalı";

        if (!credentials?.orgCode || !credentials?.username || !credentials?.password) {
          throw new Error("Kurum kodu, kullanıcı adı ve şifre zorunludur");
        }

        const code = normalizeOrgCode(credentials.orgCode);
        const org = await prismaUnscoped.organization.findUnique({ where: { code } });

        if (!org || !org.isActive) throw new Error(INVALID);
        if (org.licenseExpiresAt && org.licenseExpiresAt < new Date()) {
          throw new Error("Kurumunuzun lisans süresi dolmuş. Lütfen yöneticinizle görüşün.");
        }

        const user = await prismaUnscoped.user.findUnique({
          where: {
            organizationId_username: {
              organizationId: org.id,
              username: credentials.username.toLowerCase()
            }
          },
          select: {
            ...USER_AUTH_SELECT, organizationId: true, isSuperAdmin: true,
            passwordChangedAt: true, failedLoginCount: true, lockedUntil: true
          }
        });

        // Soft-deleted kullanıcılar giriş yapamaz
        if (!user || user.deletedAt) throw new Error(INVALID);

        // Sistem kurumuna yalnız süper adminler girebilir
        if (code === SYSTEM_ORG_CODE && !user.isSuperAdmin) throw new Error(INVALID);

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const dakika = Math.max(1, Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000));
          throw new Error(`Çok fazla hatalı deneme. ${dakika} dakika sonra tekrar deneyin.`);
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          const failed = user.failedLoginCount + 1;
          await prismaUnscoped.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: failed,
              ...(failed >= MAX_FAILED_LOGINS && { lockedUntil: new Date(Date.now() + LOCK_MS) }),
            },
          });
          throw new Error(INVALID);
        }

        // Başarılı girişte sayaç ve kilit temizlenir. Gereksiz yazma olmasın
        // diye yalnız kirliyse güncellenir.
        if (user.failedLoginCount > 0 || user.lockedUntil) {
          await prismaUnscoped.user.update({
            where: { id: user.id },
            data: { failedLoginCount: 0, lockedUntil: null },
          });
        }

        return {
          id: user.id,
          username: user.username,
          role: user.role,
          roles: normalizeUserRoles(user),
          isInAcademy: isUserInAcademy(user),
          isBoardMember: user.role === UserRole.BOARD_MEMBER || !!user.boardMember?.isActive,
          isAdmin: user.role === UserRole.ADMIN,
          tutorId: user.tutorId || undefined,
          assistedTutorId: user.assistedTutorId || undefined,
          organizationId: org.id,
          organizationCode: org.code,
          organizationName: org.name,
          isSuperAdmin: user.isSuperAdmin,
          // Token'a yazılır ve tazeleme turunda DB'deki değerle karşılaştırılır:
          // şifre değişince eski tokenlar geçersizleşir.
          passwordChangedAt: user.passwordChangedAt?.getTime() ?? 0,
          orgParts: getOrgAllowedParts(org),
          // Kullanıcı bazlı ek modül izinleri. Token'da olmak ZORUNDA:
          // middleware edge'de çalıştığı için veritabanına bakamaz ve bu alan
          // olmadan izin verilen modüle girişi engelliyordu.
          allowedParts: user.allowedParts ?? [],
          tutor: user.tutor ? {
            id: user.tutor.id,
            username: user.tutor.username,
            firstName: user.tutor.firstName || undefined,
            lastName: user.tutor.lastName || undefined
          } : undefined
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
        token.role = user.role;
        token.roles = user.roles;
        token.isInAcademy = user.isInAcademy;
        token.tutorId = user.tutorId ?? undefined;
        token.assistedTutorId = user.assistedTutorId ?? undefined;
        token.isBoardMember = user.isBoardMember;
        token.isAdmin = user.isAdmin;
        token.tutor = user.tutor;
        token.organizationId = user.organizationId;
        token.organizationCode = user.organizationCode;
        token.organizationName = user.organizationName;
        token.isSuperAdmin = user.isSuperAdmin;
        token.passwordChangedAt = user.passwordChangedAt ?? 0;
        token.orgParts = user.orgParts;
        token.allowedParts = user.allowedParts;
        token.entitlementsCheckedAt = Date.now();
        return token;
      }

      // Süper admin bir kurumun paketlerini değiştirdiğinde ya da kurumu
      // pasife aldığında etkinin mevcut oturumlara da yansıması gerekir.
      // Token'daki yetkiler bu yüzden periyodik olarak tazelenir.
      const checkedAt = (token.entitlementsCheckedAt as number | undefined) ?? 0;
      if (token.organizationId && Date.now() - checkedAt > ENTITLEMENT_TTL_MS) {
        const org = await prismaUnscoped.organization.findUnique({
          where: { id: token.organizationId as string },
          select: {
            code: true, name: true, isActive: true,
            packageIds: true, extraParts: true, excludedParts: true, licenseExpiresAt: true
          }
        });

        // Kurum kapatıldıysa veya lisans bittiyse oturumu düşür: boş token
        // döndürmek kullanıcıyı bir sonraki istekte login'e yollar.
        if (!org || !org.isActive || (org.licenseExpiresAt && org.licenseExpiresAt < new Date())) {
          return {} as typeof token;
        }

        token.orgParts = getOrgAllowedParts(org);
        // Kurum kodu/adı süper admin tarafından değiştirilmiş olabilir.
        token.organizationCode = org.code;
        token.organizationName = org.name;

        // Kullanıcının ek modül izinleri admin tarafından değiştirilmiş
        // olabilir; aynı tazeleme turunda okunur.
        const freshUser = await prismaUnscoped.user.findUnique({
          where: { id: token.id as string },
          select: { allowedParts: true, passwordChangedAt: true, deletedAt: true },
        });

        // Şifre bu oturum açıldıktan SONRA değiştiyse oturumu düşür. JWT
        // stateless olduğu için tek koruma bu: aksi hâlde şifresi çalınan
        // kullanıcı şifresini değiştirse bile saldırganın elindeki token
        // süresi dolana kadar geçerli kalırdı. Karşılaştırma `token.iat` ile
        // DEĞİL token'a yazılan damgayla yapılır; `iat` her yanıtta
        // tazelendiği için saldırganın token'ı sürekli "yeni" görünürdü.
        // Silinen kullanıcı da aynı turda düşer.
        const tokenPwdAt = (token.passwordChangedAt as number | undefined) ?? 0;
        const dbPwdAt = freshUser?.passwordChangedAt?.getTime() ?? 0;
        if (!freshUser || freshUser.deletedAt || dbPwdAt > tokenPwdAt) {
          return {} as typeof token;
        }

        token.allowedParts = freshUser?.allowedParts ?? [];

        token.entitlementsCheckedAt = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.email = token.email as string;
        session.user.role = token.role as UserRole;
        session.user.roles = token.roles as UserRole[];
        session.user.isInAcademy = token.isInAcademy as boolean;
        session.user.tutorId = token.tutorId as string | undefined;
        session.user.assistedTutorId = token.assistedTutorId as string | undefined;
        session.user.isBoardMember = token.isBoardMember as boolean;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.tutor = token.tutor as TutorInfo; // Use proper TutorInfo type extension
        session.user.organizationId = token.organizationId as string;
        session.user.organizationCode = token.organizationCode as string;
        session.user.organizationName = token.organizationName as string;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.orgParts = (token.orgParts as number[]) ?? [];
        session.user.allowedParts = (token.allowedParts as number[]) ?? [];
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXT_AUTH_SECRET
}; 