'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Trophy, Plus, Trash2, Users, Award, Calendar, MapPin, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/contexts/AuthContext';
import { UserRole } from '@prisma/client';
import { getMatchResultMeta, getTournamentStatusMeta, MATCH_RESULTS, TOURNAMENT_STATUSES } from '@/app/lib/sports';
import { ReqMark, RequiredLegend } from './ReqMark';
import { format } from 'date-fns';
import { useTournaments, useUpsertTournament, useDeleteTournament, useMatches, useUpsertMatch, useDeleteMatch, useSportSeasonStats, useMatchRoster, useSaveMatchRoster } from '@/app/hooks/use-sports';
import { useSportBranches } from '@/app/hooks/use-athlete-data';

export default function TournamentManager() {
    const { user } = useAuth();
    const roles = user?.roles && user.roles.length > 0 ? user.roles : user?.role ? [user.role] : [];
    const isManager = roles.some((r) => ([UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN, UserRole.BOARD_MEMBER] as UserRole[]).includes(r as UserRole));

    const { data: branches = [] } = useSportBranches();
    const { data: tournaments = [] } = useTournaments();
    const { data: matches = [] } = useMatches();
    
    const [seasonBranch, setSeasonBranch] = useState<string>('all');
    const { data: season } = useSportSeasonStats(seasonBranch === 'all' ? undefined : { branchId: seasonBranch });

    const upsertTournamentMutation = useUpsertTournament();
    const deleteTournamentMutation = useDeleteTournament();
    const upsertMatchMutation = useUpsertMatch();
    const deleteMatchMutation = useDeleteMatch();
    const saveRosterMutation = useSaveMatchRoster();

    const [tournamentDialog, setTournamentDialog] = useState(false);
    const [editTournament, setEditTournament] = useState<any>(null);
    const [tForm, setTForm] = useState({ name: '', branchId: '', location: '', startDate: '', endDate: '', status: 'UPCOMING', description: '' });

    const [matchDialog, setMatchDialog] = useState(false);
    const [editMatch, setEditMatch] = useState<any>(null);
    const [mForm, setMForm] = useState({ branchId: '', tournamentId: '', date: '', location: '', opponent: '', ourScore: '', theirScore: '', achievement: '', notes: '' });

    const [rosterDialog, setRosterDialog] = useState(false);
    const [rosterMatchId, setRosterMatchId] = useState<string | null>(null);
    const { data: rosterMatchData } = useMatchRoster(rosterMatchId || undefined);
    
    const [rosterRows, setRosterRows] = useState<Record<string, { selected: boolean; isStarter: boolean; goals: number; assists: number }>>({});
    const [rosterAthletes, setRosterAthletes] = useState<any[]>([]);

    const [deletingTournamentId, setDeletingTournamentId] = useState<string | null>(null);
    const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);

    useEffect(() => {
        if (rosterMatchData && rosterDialog) {
            setRosterAthletes(rosterMatchData.branch?.athletes ?? []);
            const map: Record<string, any> = {};
            for (const a of rosterMatchData.branch?.athletes ?? []) {
                const p = rosterMatchData.participations.find((x: any) => x.athleteId === a.id);
                map[a.id] = p
                    ? { selected: true, isStarter: p.isStarter, goals: p.goals, assists: p.assists }
                    : { selected: false, isStarter: false, goals: 0, assists: 0 };
            }
            setRosterRows(map);
        }
    }, [rosterMatchData, rosterDialog]);

    // ---- Tournament ----
    const openTournament = (t?: any) => {
        if (t) {
            setEditTournament(t);
            setTForm({
                name: t.name, branchId: t.branchId ?? '', location: t.location ?? '',
                startDate: format(new Date(t.startDate), 'yyyy-MM-dd'),
                endDate: t.endDate ? format(new Date(t.endDate), 'yyyy-MM-dd') : '',
                status: t.status, description: t.description ?? '',
            });
        } else {
            setEditTournament(null);
            setTForm({ name: '', branchId: '', location: '', startDate: '', endDate: '', status: 'UPCOMING', description: '' });
        }
        setTournamentDialog(true);
    };

    const saveTournament = async () => {
        if (!tForm.name || !tForm.startDate) {
            toast.error('Turnuva adı ve başlangıç tarihi gerekli');
            return;
        }
        upsertTournamentMutation.mutate(
            {
                id: editTournament?.id,
                name: tForm.name,
                branchId: tForm.branchId || null,
                location: tForm.location,
                startDate: new Date(tForm.startDate),
                endDate: tForm.endDate ? new Date(tForm.endDate) : null,
                status: tForm.status as any,
                description: tForm.description,
            },
            {
                onSuccess: () => setTournamentDialog(false),
            }
        );
    };

    const confirmRemoveTournament = () => {
        if (!deletingTournamentId) return;
        deleteTournamentMutation.mutate(deletingTournamentId);
        setDeletingTournamentId(null);
    };

    // ---- Match ----
    const openMatch = (m?: any) => {
        if (m) {
            setEditMatch(m);
            setMForm({
                branchId: m.branchId, tournamentId: m.tournamentId ?? '',
                date: format(new Date(m.date), 'yyyy-MM-dd'), location: m.location ?? '',
                opponent: m.opponent, ourScore: m.ourScore?.toString() ?? '', theirScore: m.theirScore?.toString() ?? '',
                achievement: m.achievement ?? '', notes: m.notes ?? '',
            });
        } else {
            setEditMatch(null);
            setMForm({ branchId: branches[0]?.id ?? '', tournamentId: '', date: '', location: '', opponent: '', ourScore: '', theirScore: '', achievement: '', notes: '' });
        }
        setMatchDialog(true);
    };

    const saveMatch = async () => {
        if (!mForm.branchId || !mForm.opponent || !mForm.date) {
            toast.error('Branş, rakip ve tarih gerekli');
            return;
        }
        upsertMatchMutation.mutate(
            {
                id: editMatch?.id,
                branchId: mForm.branchId,
                tournamentId: mForm.tournamentId || null,
                date: new Date(mForm.date),
                location: mForm.location,
                opponent: mForm.opponent,
                ourScore: mForm.ourScore !== '' ? parseInt(mForm.ourScore) : null,
                theirScore: mForm.theirScore !== '' ? parseInt(mForm.theirScore) : null,
                achievement: mForm.achievement,
                notes: mForm.notes,
            },
            {
                onSuccess: () => setMatchDialog(false),
            }
        );
    };

    const confirmRemoveMatch = () => {
        if (!deletingMatchId) return;
        deleteMatchMutation.mutate(deletingMatchId);
        setDeletingMatchId(null);
    };

    // ---- Roster ----
    const openRoster = (m: any) => {
        setRosterMatchId(m.id);
        setRosterDialog(true);
    };

    const saveRoster = () => {
        if (!rosterMatchId) return;
        const participations = Object.entries(rosterRows)
            .filter(([, v]) => v.selected)
            .map(([athleteId, v]) => ({ athleteId, isStarter: v.isStarter, goals: v.goals, assists: v.assists }));
        
        saveRosterMutation.mutate(
            { matchId: rosterMatchId, participations },
            { onSuccess: () => setRosterDialog(false) }
        );
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" /> Turnuvalar & Müsabakalar
                    </h2>
                    <p className="text-sm text-gray-500">Turnuvalar, maç sonuçları, kadrolar ve sezon istatistikleri.</p>
                </div>
            </div>

            <Tabs defaultValue="matches">
                <TabsList>
                    <TabsTrigger value="matches">Müsabakalar</TabsTrigger>
                    <TabsTrigger value="tournaments">Turnuvalar</TabsTrigger>
                    <TabsTrigger value="season">Sezon İstatistikleri</TabsTrigger>
                </TabsList>

                {/* MATCHES */}
                <TabsContent value="matches" className="space-y-3 mt-4">
                    {isManager && (
                        <Button onClick={() => openMatch()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="h-4 w-4 mr-2" /> Müsabaka Ekle
                        </Button>
                    )}
                    {matches.length === 0 ? (
                        <Card className="border-gray-100"><CardContent className="p-10 text-center text-gray-400">Müsabaka kaydı yok.</CardContent></Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {matches.map((m) => {
                                const meta = getMatchResultMeta(m.result);
                                return (
                                    <Card key={m.id} className="border-gray-100 shadow-sm group">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[10px]">{m.branch?.name}</Badge>
                                                        <Badge variant="outline" className={`text-[10px] ${meta.color}`}>{meta.label}</Badge>
                                                    </div>
                                                    <p className="font-bold text-gray-800 mt-2">vs {m.opponent}</p>
                                                    <p className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                                                        <Calendar className="h-3 w-3" /> {format(new Date(m.date), 'dd.MM.yyyy')}
                                                        {m.location && (<><MapPin className="h-3 w-3 ml-1" /> {m.location}</>)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    {m.ourScore != null && m.theirScore != null && (
                                                        <p className="text-2xl font-extrabold text-gray-800">{m.ourScore}-{m.theirScore}</p>
                                                    )}
                                                    <p className="text-[11px] text-gray-400">{m._count?.participations ?? 0} oyuncu</p>
                                                </div>
                                            </div>
                                            {m.achievement && (
                                                <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                                                    <Award className="h-3.5 w-3.5" /> {m.achievement}
                                                </p>
                                            )}
                                            {isManager && (
                                                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                                                    <Button size="sm" variant="outline" onClick={() => openRoster(m)} className="text-xs">
                                                        <Users className="h-3.5 w-3.5 mr-1" /> Kadro
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => openMatch(m)} className="text-xs">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => setDeletingMatchId(m.id)} className="text-xs text-red-500">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* TOURNAMENTS */}
                <TabsContent value="tournaments" className="space-y-3 mt-4">
                    {isManager && (
                        <Button onClick={() => openTournament()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="h-4 w-4 mr-2" /> Turnuva Ekle
                        </Button>
                    )}
                    {tournaments.length === 0 ? (
                        <Card className="border-gray-100"><CardContent className="p-10 text-center text-gray-400">Turnuva kaydı yok.</CardContent></Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {tournaments.map((t) => {
                                const meta = getTournamentStatusMeta(t.status);
                                return (
                                    <Card key={t.id} className="border-gray-100 shadow-sm group">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-bold text-gray-800">{t.name}</p>
                                                    <p className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                                                        <Calendar className="h-3 w-3" /> {format(new Date(t.startDate), 'dd.MM.yyyy')}
                                                        {t.location && (<><MapPin className="h-3 w-3 ml-1" /> {t.location}</>)}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant="outline" className={`text-[10px] ${meta.color}`}>{meta.label}</Badge>
                                                        {t.branch && <Badge variant="secondary" className="text-[10px]">{t.branch.name}</Badge>}
                                                        <span className="text-[11px] text-gray-400">{t._count?.matches ?? 0} maç</span>
                                                    </div>
                                                </div>
                                                {isManager && (
                                                    <div className="flex gap-1">
                                                        <Button size="sm" variant="ghost" onClick={() => openTournament(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setDeletingTournamentId(t.id)} className="text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* SEASON STATS */}
                <TabsContent value="season" className="space-y-4 mt-4">
                    <Select value={seasonBranch} onValueChange={setSeasonBranch}>
                        <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Branş" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Branşlar</SelectItem>
                            {branches.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
                        </SelectContent>
                    </Select>

                    {season && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { l: 'Oynanan', v: season.team.played, c: 'text-gray-700' },
                                    { l: 'Galibiyet', v: season.team.wins, c: 'text-green-600' },
                                    { l: 'Beraberlik', v: season.team.draws, c: 'text-gray-500' },
                                    { l: 'Mağlubiyet', v: season.team.losses, c: 'text-red-500' },
                                ].map((s) => (
                                    <Card key={s.l} className="border-gray-100"><CardContent className="p-4 text-center">
                                        <p className={`text-2xl font-extrabold ${s.c}`}>{s.v}</p>
                                        <p className="text-xs text-gray-500">{s.l}</p>
                                    </CardContent></Card>
                                ))}
                            </div>
                            <p className="text-sm text-gray-500">
                                Attığı gol: <b className="text-gray-700">{season.team.goalsFor}</b> · Yediği gol: <b className="text-gray-700">{season.team.goalsAgainst}</b> · Averaj: <b className="text-gray-700">{season.team.goalsFor - season.team.goalsAgainst}</b>
                            </p>

                            <Card className="border-gray-100 shadow-sm">
                                <CardContent className="p-0">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                                                <th className="px-4 py-3">Sporcu</th>
                                                <th className="px-4 py-3 text-center">Maç</th>
                                                <th className="px-4 py-3 text-center">Gol</th>
                                                <th className="px-4 py-3 text-center">Asist</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {season.athletes.length === 0 ? (
                                                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">İstatistik yok.</td></tr>
                                            ) : season.athletes.map((a: any) => (
                                                <tr key={a.athleteId} className="border-b border-gray-50">
                                                    <td className="px-4 py-2.5 font-medium text-gray-700">{a.name}</td>
                                                    <td className="px-4 py-2.5 text-center">{a.appearances}</td>
                                                    <td className="px-4 py-2.5 text-center font-bold text-emerald-600">{a.goals}</td>
                                                    <td className="px-4 py-2.5 text-center font-bold text-blue-600">{a.assists}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>
            </Tabs>

            {/* Tournament dialog */}
            <Dialog open={tournamentDialog} onOpenChange={setTournamentDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader><DialogTitle>{editTournament ? 'Turnuva Düzenle' : 'Yeni Turnuva'}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1.5"><Label>Turnuva Adı <ReqMark /></Label><Input value={tForm.name} onChange={(e) => setTForm({ ...tForm, name: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5"><Label>Branş</Label>
                                <Select value={tForm.branchId || 'none'} onValueChange={(v) => setTForm({ ...tForm, branchId: v === 'none' ? '' : v })}>
                                    <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Genel</SelectItem>
                                        {branches.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5"><Label>Durum</Label>
                                <Select value={tForm.status} onValueChange={(v) => setTForm({ ...tForm, status: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {TOURNAMENT_STATUSES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5"><Label>Başlangıç <ReqMark /></Label><Input type="date" value={tForm.startDate} onChange={(e) => setTForm({ ...tForm, startDate: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label>Bitiş</Label><Input type="date" value={tForm.endDate} onChange={(e) => setTForm({ ...tForm, endDate: e.target.value })} /></div>
                        </div>
                        <div className="space-y-1.5"><Label>Yer</Label><Input value={tForm.location} onChange={(e) => setTForm({ ...tForm, location: e.target.value })} /></div>
                        <div className="space-y-1.5"><Label>Açıklama</Label><Textarea value={tForm.description} onChange={(e) => setTForm({ ...tForm, description: e.target.value })} rows={2} /></div>
                        <RequiredLegend />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTournamentDialog(false)}>İptal</Button>
                        <Button onClick={saveTournament} className="bg-indigo-600 hover:bg-indigo-700 text-white">Kaydet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Match dialog */}
            <Dialog open={matchDialog} onOpenChange={setMatchDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader><DialogTitle>{editMatch ? 'Müsabaka Düzenle' : 'Yeni Müsabaka'}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5"><Label>Branş <ReqMark /></Label>
                                <Select value={mForm.branchId} onValueChange={(v) => setMForm({ ...mForm, branchId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                    <SelectContent>{branches.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5"><Label>Turnuva</Label>
                                <Select value={mForm.tournamentId || 'none'} onValueChange={(v) => setMForm({ ...mForm, tournamentId: v === 'none' ? '' : v })}>
                                    <SelectTrigger><SelectValue placeholder="Yok" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Yok (Dostluk)</SelectItem>
                                        {tournaments.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5"><Label>Rakip <ReqMark /></Label><Input value={mForm.opponent} onChange={(e) => setMForm({ ...mForm, opponent: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5"><Label>Tarih <ReqMark /></Label><Input type="date" value={mForm.date} onChange={(e) => setMForm({ ...mForm, date: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label>Yer</Label><Input value={mForm.location} onChange={(e) => setMForm({ ...mForm, location: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5"><Label>Bizim Skor</Label><Input type="number" value={mForm.ourScore} onChange={(e) => setMForm({ ...mForm, ourScore: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label>Rakip Skor</Label><Input type="number" value={mForm.theirScore} onChange={(e) => setMForm({ ...mForm, theirScore: e.target.value })} /></div>
                        </div>
                        <div className="space-y-1.5"><Label>Derece / Başarı</Label><Input value={mForm.achievement} onChange={(e) => setMForm({ ...mForm, achievement: e.target.value })} placeholder="Örn: Şampiyon, 2.lik" /></div>
                        <div className="space-y-1.5"><Label>Not</Label><Textarea value={mForm.notes} onChange={(e) => setMForm({ ...mForm, notes: e.target.value })} rows={2} /></div>
                        <RequiredLegend />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMatchDialog(false)}>İptal</Button>
                        <Button onClick={saveMatch} className="bg-indigo-600 hover:bg-indigo-700 text-white">Kaydet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Roster dialog */}
            <Dialog open={rosterDialog} onOpenChange={setRosterDialog}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Maç Kadrosu {rosterMatchData ? `· vs ${rosterMatchData.opponent}` : ''}</DialogTitle></DialogHeader>
                    {rosterAthletes.length === 0 ? (
                        <p className="text-sm text-gray-400 py-6 text-center">Bu branşta sporcu bulunmuyor.</p>
                    ) : (
                        <div className="space-y-2">
                            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-[11px] uppercase text-gray-400 font-semibold px-2">
                                <span>Sporcu (İlk 11)</span><span>İlk 11</span><span>Gol</span><span>Asist</span>
                            </div>
                            {rosterAthletes.map((a) => {
                                const row = rosterRows[a.id];
                                return (
                                    <div key={a.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-2 py-1.5 rounded-lg hover:bg-gray-50">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <Checkbox checked={row?.selected} onCheckedChange={(c) => setRosterRows({ ...rosterRows, [a.id]: { ...row, selected: !!c } })} />
                                            <span className="text-sm">{a.user.firstName} {a.user.lastName}</span>
                                        </label>
                                        <Checkbox disabled={!row?.selected} checked={row?.isStarter} onCheckedChange={(c) => setRosterRows({ ...rosterRows, [a.id]: { ...row, isStarter: !!c } })} />
                                        <Input type="number" disabled={!row?.selected} value={row?.goals ?? 0} onChange={(e) => setRosterRows({ ...rosterRows, [a.id]: { ...row, goals: parseInt(e.target.value) || 0 } })} className="w-16 h-8" />
                                        <Input type="number" disabled={!row?.selected} value={row?.assists ?? 0} onChange={(e) => setRosterRows({ ...rosterRows, [a.id]: { ...row, assists: parseInt(e.target.value) || 0 } })} className="w-16 h-8" />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRosterDialog(false)}>İptal</Button>
                        <Button onClick={saveRoster} className="bg-indigo-600 hover:bg-indigo-700 text-white">Kadroyu Kaydet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deletingTournamentId}
                onOpenChange={(open) => { if (!open) setDeletingTournamentId(null); }}
                onConfirm={confirmRemoveTournament}
                title="Turnuva Silinsin mi?"
                description="Bu turnuva ve bağlı kayıtları kalıcı olarak silinecektir."
                loading={deleteTournamentMutation.isPending}
            />
            <ConfirmDialog
                open={!!deletingMatchId}
                onOpenChange={(open) => { if (!open) setDeletingMatchId(null); }}
                onConfirm={confirmRemoveMatch}
                title="Müsabaka Silinsin mi?"
                description="Bu müsabaka kaydı ve kadro bilgileri kalıcı olarak silinecektir."
                loading={deleteMatchMutation.isPending}
            />
        </div>
    );
}
