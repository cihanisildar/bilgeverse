import { getSuperAdminAccount, listSuperAdmins } from '@/app/actions/superadmin-account';
import AccountForms from './AccountForms';
import SuperAdminList from './SuperAdminList';

export const dynamic = 'force-dynamic';

export default async function SuperAdminAccountPage() {
  const [{ data, error }, { data: admins }] = await Promise.all([
    getSuperAdminAccount(),
    listSuperAdmins(),
  ]);

  if (error || !data) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <div className="max-w-2xl">
      <AccountForms account={data} />
      <SuperAdminList admins={admins ?? []} />
    </div>
  );
}
