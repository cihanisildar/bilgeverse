import FinanceOverview from './components/FinanceOverview';

export default function Part8Page() {
  return (
    <div className="space-y-6">
      <FinanceOverview />
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
        Kasa bakiyeleri her para birimi için ayrı tutulur. Gelir ve giderleri ilgili
        sayfalardan ekleyebilir, ay sonu özetini <span className="font-medium text-indigo-600">Raporlar</span> sayfasından görüntüleyebilirsiniz.
      </div>
    </div>
  );
}
