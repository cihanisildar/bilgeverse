import { notFound } from 'next/navigation';
import { getOrganization } from '@/app/actions/organizations';
import EditOrgForm from './EditOrgForm';

export const dynamic = 'force-dynamic';

export default async function OrganizationDetailPage({ params }: { params: { id: string } }) {
  const { data, error } = await getOrganization(params.id);

  if (error || !data) notFound();

  return <EditOrgForm org={data} />;
}
