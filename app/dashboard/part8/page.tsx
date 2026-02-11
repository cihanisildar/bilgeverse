'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Search, Users, Heart, Wallet, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import DonorTable from './components/DonorTable';
import DonorDialog from './components/DonorDialog';
import DonationDialog from './components/DonationDialog';
import DonorDetailsDrawer from './components/DonorDetailsDrawer';
import { getDonors } from '@/app/actions/donations';
import { useQuery } from '@tanstack/react-query';

import { Donor } from '@/types/donations';

export default function Part8Page() {
  const [search, setSearch] = useState('');

  // Dialog/Drawer states
  const [isDonorDialogOpen, setIsDonorDialogOpen] = useState(false);
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);

  const { data: donorsResult, isLoading: loading } = useQuery({
    queryKey: ['donors', search],
    queryFn: async () => {
      const res = await getDonors(search);
      if (res.error) throw new Error(res.error);
      return res.data || [];
    },
  });

  const donors = donorsResult || [];

  const handleOpenAddDonation = (donor: Donor) => {
    setSelectedDonor(donor);
    setIsDonationDialogOpen(true);
  };

  const handleOpenEditDonor = (donor: Donor) => {
    setSelectedDonor(donor);
    setIsDonorDialogOpen(true);
  };

  const handleOpenDetails = (donor: Donor) => {
    setSelectedDonor(donor);
    setIsDetailsOpen(true);
  };

  const handleCloseDialogs = () => {
    setIsDonorDialogOpen(false);
    setIsDonationDialogOpen(false);
    setSelectedDonor(null);
  };

  // Safety cleanup for Radix UI focus trap/pointer-events issues
  useEffect(() => {
    if (!isDonorDialogOpen && !isDonationDialogOpen && !isDetailsOpen) {
      document.body.style.pointerEvents = 'auto';
    }
  }, [isDonorDialogOpen, isDonationDialogOpen, isDetailsOpen]);

  const totalDonations = donors.reduce((acc, curr) => acc + curr.totalDonated, 0);
  const inactiveCount = donors.filter(d => d.isInactive).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/dashboard">
              <Button variant="ghost" className="mb-4 -ml-2 text-gray-500 hover:text-rose-600">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ana Sayfaya Dön
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bağışçı Yönetimi</h1>
            <p className="text-gray-500">Bağışçıları takip edin, yeni bağışlar ekleyin ve durumu izleyin.</p>
          </div>
          <Button
            onClick={() => {
              setSelectedDonor(null);
              setIsDonorDialogOpen(true);
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Bağışçı Ekle
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground italic">Toplam Bağışçı</CardTitle>
              <Users className="h-4 w-4 text-rose-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{donors.length}</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground italic">Toplam Toplanan</CardTitle>
              <Wallet className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDonations.toLocaleString('tr-TR')} ₺</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white border-l-4 border-l-rose-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground italic">Hareketsiz Bağışçı</CardTitle>
              <Activity className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600">{inactiveCount}</div>
              <p className="text-xs text-muted-foreground mt-1">2 aydır bağış yapmayanlar</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Bağışçı Listesi</CardTitle>
                <CardDescription>Sisteme kayıtlı tüm bağışçılar</CardDescription>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Bağışçı ara..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
              </div>
            ) : (
              <DonorTable
                donors={donors}
                onViewDetails={handleOpenDetails}
                onAddDonation={handleOpenAddDonation}
                onEdit={handleOpenEditDonor}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <DonorDialog
        isOpen={isDonorDialogOpen}
        onClose={handleCloseDialogs}
        donor={selectedDonor}
      />

      {selectedDonor && (
        <DonationDialog
          isOpen={isDonationDialogOpen}
          onClose={handleCloseDialogs}
          donor={selectedDonor}
        />
      )}

      <DonorDetailsDrawer
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedDonor(null);
        }}
        donorId={selectedDonor?.id ?? null}
      />
    </div>
  );
}
