"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Flag,
  AlertTriangle,
  PlusCircle,
  RefreshCw,
  Search,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  WifiOff,
  Users,
} from 'lucide-react';
import { useMergedFlags, useSettings, useUsers, useUpdateGovernance } from '@/hooks/useFlags';
import { getViolations, getHealthScore, isValidName, daysSince } from '@/utils/naming';
import { StatCard } from '@/components/dashboard/StatCard';
import { HealthGauge } from '@/components/dashboard/HealthGauge';
import { BarChart } from '@/components/dashboard/BarChart';
import { Badge } from '@/components/shared/Badge';
import { EnvDots } from '@/components/shared/EnvDots';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function FlagOps() {
  // ── Data via React Query ───────────────────────────────────────────────────
  const {
    flags,
    isLoading,
    isError,
    error,
    isUnconfigured,
    lastSync,
    refetch,
    isFetching,
  } = useMergedFlags();

  const { data: settings } = useSettings();
  const { data: users = [] } = useUsers();
  const updateGovernance = useUpdateGovernance();

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFlag, setSelectedFlag] = useState<any>(null);
  const [editTeam, setEditTeam] = useState('');
  const [editOwner, setEditOwner] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSync = () => refetch();

  const handleSaveGovernance = async () => {
    if (!selectedFlag) return;
    const data = { team: editTeam, owner: editOwner, notes: editNotes };

    updateGovernance.mutate(
      { flagKey: selectedFlag.key, data },
      {
        onSuccess: () => {
          toast({ title: 'Governance Updated', description: `Settings saved for ${selectedFlag.key}.` });
          setSelectedFlag(null);
        },
        onError: () => {
          toast({ title: 'Save Failed', description: 'Could not write to Firestore.', variant: 'destructive' });
        },
      }
    );
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const filteredFlags = useMemo(() =>
    flags.filter(f =>
      f.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.team && f.team.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [flags, searchQuery]
  );

  const stats = useMemo(() => ({
    total: flags.length,
    namingViolations: flags.filter(f => !isValidName(f.key)).length,
    noOwner: flags.filter(f => !f.owner).length,
    stale: flags.filter(f => daysSince(f.updated_time) > 90).length,
    health: getHealthScore(flags),
  }), [flags]);

  const teamsData = useMemo(() => {
    if (!settings?.teams) return [];
    return settings.teams
      .map((t: string) => ({ label: t, value: flags.filter(f => f.team === t).length }))
      .sort((a: any, b: any) => b.value - a.value);
  }, [flags, settings]);

  const violationStats = useMemo(() => [
    { label: 'Naming',   value: flags.filter(f => !isValidName(f.key)).length,                                         color: '#ff6b6b' },
    { label: 'No Owner', value: flags.filter(f => !f.owner).length,                                                    color: '#f0c040' },
    { label: 'No Team',  value: flags.filter(f => !f.team).length,                                                     color: '#60a0ff' },
    { label: 'Stale',    value: flags.filter(f => daysSince(f.updated_time) > 90).length,                              color: '#b080ff' },
  ], [flags]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Initializing FlagOps...</p>
        </div>
      </div>
    );
  }

  // ── Unconfigured / error banner ────────────────────────────────────────────
  const ErrorBanner = isUnconfigured ? (
    <div className="flex items-center gap-3 px-4 py-3 mb-8 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        <strong>Optimizely not connected.</strong> Add <code className="text-xs bg-destructive/10 px-1 rounded">OPTIMIZELY_API_TOKEN</code> and{' '}
        <code className="text-xs bg-destructive/10 px-1 rounded">OPTIMIZELY_PROJECT_ID</code> to <code className="text-xs bg-destructive/10 px-1 rounded">.env.local</code> and restart the dev server.
      </span>
    </div>
  ) : isError ? (
    <div className="flex items-center gap-3 px-4 py-3 mb-8 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span><strong>API Error:</strong> {(error as Error)?.message}</span>
    </div>
  ) : null;

  return (
    <div className="min-h-screen pb-20">
      <Toaster />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">FlagOps</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none mt-0.5">Optimizely Governance</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/users">
            <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-widest">
              <Users className="w-3.5 h-3.5 mr-2" />
              Users {users.length > 0 && <span className="ml-1 font-code">({users.length})</span>}
            </Button>
          </Link>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">Last Sync</p>
            <p className="text-xs font-medium text-foreground mt-1">
              {lastSync ? lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isFetching}
            className="rounded-full border-border/20 bg-white/5 hover:bg-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-8 mt-10">
        {ErrorBanner}

        <Tabs defaultValue="overview" className="space-y-10">
          <div className="flex justify-center">
            <TabsList className="glass rounded-full p-1 border-border/20 h-12 shadow-xl shadow-black/20">
              <TabsTrigger value="overview"   className="rounded-full px-8 data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold text-xs uppercase tracking-widest">Overview</TabsTrigger>
              <TabsTrigger value="flags"      className="rounded-full px-8 data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold text-xs uppercase tracking-widest">All Flags</TabsTrigger>
              <TabsTrigger value="violations" className="rounded-full px-8 data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold text-xs uppercase tracking-widest">Violations</TabsTrigger>
              <TabsTrigger value="create"     className="rounded-full px-8 data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold text-xs uppercase tracking-widest">Create</TabsTrigger>
            </TabsList>
          </div>

          {/* ── Overview ──────────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-8 mt-12 outline-none">
            <div className="grid grid-cols-4 gap-6">
              <StatCard label="Total Flags"       value={stats.total}           sub="Active in Project"    icon={<Flag className="w-3 h-3" />}          accent="#60a0ff" delay={0}   />
              <StatCard label="Naming Violations" value={stats.namingViolations} sub="Non-compliant keys"   icon={<AlertTriangle className="w-3 h-3" />}  accent="#ff6b6b" delay={100} />
              <StatCard label="Missing Owner"     value={stats.noOwner}         sub="Orphaned resources"   icon={<PlusCircle className="w-3 h-3" />}     accent="#f0c040" delay={200} />
              <StatCard label="Stale Flags"       value={stats.stale}           sub="Unchanged > 90d"      icon={<RefreshCw className="w-3 h-3" />}      accent="#b080ff" delay={300} />
            </div>

            <div className="grid grid-cols-12 gap-8 mt-12">
              <div className="col-span-4 glass rounded-2xl p-8 border-border/20 flex flex-col justify-center items-center shadow-2xl">
                <HealthGauge score={stats.health} />
                <div className="mt-8 pt-8 border-t border-border/10 w-full">
                  <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-6">Naming Convention Reference</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Pattern</span>
                      <code className="bg-primary/10 text-primary px-2 py-1 rounded font-code">{'{team}_{feat}_{info}'}</code>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Valid</span>
                      <span className="text-success font-medium">platform_auth_v2</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Invalid</span>
                      <span className="text-destructive font-medium">NewFeatureFlow</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-8 glass rounded-2xl p-8 border-border/20 shadow-2xl">
                <div className="grid grid-cols-2 gap-12">
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-8 flex items-center gap-2">
                      <BarChart3 className="w-3 h-3" /> Flags By Team
                    </h3>
                    <BarChart data={teamsData} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-8 flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" /> Health Breakdown
                    </h3>
                    <BarChart data={violationStats} />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── All Flags ─────────────────────────────────────────────────── */}
          <TabsContent value="flags" className="outline-none">
            <div className="glass rounded-2xl p-6 border-border/20 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="relative w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search flags by key, name, or team..."
                    className="pl-10 h-10 rounded-full border-border/20 bg-white/5 focus-visible:ring-primary"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-4">
                  <Badge color="blue">All: {flags.length}</Badge>
                  <Badge color="red">Issues: {flags.filter(f => getViolations(f).length > 0).length}</Badge>
                </div>
              </div>

              <div className="rounded-xl border border-border/10 overflow-hidden bg-white/[0.01]">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-border/10 hover:bg-transparent">
                      <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest h-14">Flag Key</TableHead>
                      <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest h-14">Team / Owner</TableHead>
                      <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest h-14">Created By</TableHead>
                      <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest h-14">Environments</TableHead>
                      <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest h-14">Last Modified</TableHead>
                      <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest h-14">Status</TableHead>
                      <TableHead className="h-14"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFlags.map(flag => {
                      const violations = getViolations(flag);
                      const isStale = daysSince(flag.updated_time) > 90;
                      return (
                        <TableRow
                          key={flag.key}
                          className="border-border/5 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                          onClick={() => {
                            setSelectedFlag(flag);
                            setEditTeam(flag.team || '');
                            setEditOwner(flag.owner || '');
                            setEditNotes(flag.notes || '');
                          }}
                        >
                          <TableCell className="py-5">
                            <div className="font-code text-sm font-medium">{flag.key}</div>
                            <div className="text-[11px] text-muted-foreground mt-1 truncate max-w-[200px]">{flag.name}</div>
                          </TableCell>
                          <TableCell>
                            {flag.team ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-foreground/80">{flag.team}</span>
                                <span className="text-xs text-muted-foreground">{flag.owner || 'Unassigned'}</span>
                              </div>
                            ) : (
                              <Badge color="red">No Governance</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-medium text-foreground/70 truncate max-w-[180px]">
                              {flag.created_by_user_email || <span className="text-muted-foreground">—</span>}
                            </div>
                          </TableCell>
                          <TableCell><EnvDots environments={flag.environments} /></TableCell>
                          <TableCell>
                            <div className="text-xs font-medium text-foreground/70">
                              {new Date(flag.updated_time).toLocaleDateString()}
                            </div>
                            {isStale && <div className="text-[10px] text-destructive font-bold uppercase mt-1">Stale</div>}
                          </TableCell>
                          <TableCell>
                            {violations.length === 0 ? (
                              <Badge color="green">Clean</Badge>
                            ) : (
                              <Badge color={violations.some(v => v.severity === 'error') ? 'red' : 'yellow'}>
                                {violations.length} {violations.length === 1 ? 'Issue' : 'Issues'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* ── Violations ────────────────────────────────────────────────── */}
          <TabsContent value="violations" className="space-y-8 outline-none">
            <div className="grid grid-cols-2 gap-8">
              <div className="glass rounded-2xl p-8 border-border/20 shadow-2xl">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-8 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-destructive" /> Naming Convention Failures
                </h3>
                <div className="space-y-4">
                  {flags.filter(f => !isValidName(f.key)).map(f => (
                    <div key={f.key} className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-code text-destructive font-bold">{f.key}</div>
                          <div className="text-xs text-muted-foreground mt-1">Project: {f.project_id || '—'}</div>
                        </div>
                        <Badge color="red">Rename Needed</Badge>
                      </div>
                    </div>
                  ))}
                  {flags.filter(f => !isValidName(f.key)).length === 0 && (
                    <div className="flex items-center gap-2 text-success text-sm">
                      <CheckCircle2 className="w-4 h-4" /> All flag keys follow the naming convention.
                    </div>
                  )}
                </div>
              </div>

              <div className="glass rounded-2xl p-8 border-border/20 shadow-2xl">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-8 flex items-center gap-2">
                  <RefreshCw className="w-3 h-3 text-secondary" /> Stale (Inactive &gt; 90d)
                </h3>
                <div className="space-y-4">
                  {flags.filter(f => daysSince(f.updated_time) > 90).map(f => (
                    <div key={f.key} className="p-4 rounded-xl bg-white/5 border border-border/10">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-code font-bold">{f.key}</div>
                          <div className="text-xs text-muted-foreground mt-1">Last modified: {daysSince(f.updated_time)} days ago</div>
                        </div>
                        <Badge color="yellow">Stale</Badge>
                      </div>
                    </div>
                  ))}
                  {flags.filter(f => daysSince(f.updated_time) > 90).length === 0 && (
                    <div className="flex items-center gap-2 text-success text-sm">
                      <CheckCircle2 className="w-4 h-4" /> No stale flags detected.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Create (Phase 2 preview) ───────────────────────────────────── */}
          <TabsContent value="create" className="outline-none">
            <div className="max-w-2xl mx-auto glass rounded-2xl p-10 border-border/20 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <PlusCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Phase 2: Managed Creation</h3>
                <p className="text-muted-foreground mb-8 max-w-md">
                  Creation with enforced naming conventions and automated governance will be available in Phase 2.
                </p>
                <Badge color="blue">Coming Soon</Badge>
              </div>
              <div className="space-y-6 opacity-30 grayscale pointer-events-none">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Team</label>
                    <Select disabled><SelectTrigger><SelectValue placeholder="Select Team" /></SelectTrigger></Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Owner</label>
                    <Select disabled><SelectTrigger><SelectValue placeholder="Select Owner" /></SelectTrigger></Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Feature Name</label>
                  <Input placeholder="e.g. checkout v2 flow" disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Generated Key</label>
                  <div className="h-10 px-3 flex items-center rounded-md border border-border/20 bg-white/5 font-code text-sm text-primary">
                    platform_checkout_v2_flow
                  </div>
                </div>
                <Button className="w-full h-12 rounded-lg font-bold uppercase tracking-widest" disabled>Create in Optimizely</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ── Flag Detail Modal ──────────────────────────────────────────────── */}
      <Dialog open={!!selectedFlag} onOpenChange={() => setSelectedFlag(null)}>
        <DialogContent className="sm:max-w-[600px] glass border-border/40 text-foreground p-0 overflow-hidden rounded-2xl">
          <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-8 border-b border-border/20">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold font-code tracking-tight">{selectedFlag?.key}</DialogTitle>
                <DialogDescription className="text-muted-foreground font-medium mt-1">{selectedFlag?.name}</DialogDescription>
              </div>
              <Badge color={getViolations(selectedFlag ?? {}).length > 0 ? 'red' : 'green'}>
                {getViolations(selectedFlag ?? {}).length > 0 ? 'Issues Detected' : 'Healthy'}
              </Badge>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">Assign Team</label>
                <Select value={editTeam} onValueChange={setEditTeam}>
                  <SelectTrigger className="bg-white/5 border-border/20">
                    <SelectValue placeholder="Select Team" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings?.teams?.map((t: string) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">Assigned Owner</label>
                <Select value={editOwner} onValueChange={setEditOwner}>
                  <SelectTrigger className="bg-white/5 border-border/20">
                    <SelectValue placeholder="Select Owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.email} value={u.email}>{u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">Governance Notes</label>
              <Textarea
                placeholder="Additional context or requirements..."
                className="bg-white/5 border-border/20 min-h-[100px]"
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
              />
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Violations & Recommendations</h4>
              {getViolations(selectedFlag ?? {}).map((v, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${v.severity === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                  {v.severity === 'error' ? <AlertTriangle className="w-4 h-4 mt-0.5" /> : <RefreshCw className="w-4 h-4 mt-0.5" />}
                  <div>
                    <div className="text-xs font-bold leading-none">{v.label}</div>
                    <p className="text-[10px] opacity-80 mt-1">Rule violation: flag health score reduced.</p>
                  </div>
                </div>
              ))}
              {getViolations(selectedFlag ?? {}).length === 0 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 text-success">
                  <CheckCircle2 className="w-4 h-4 mt-0.5" />
                  <div className="text-xs font-bold leading-none">No violations detected. All governance standards met.</div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="bg-white/5 p-6 border-t border-border/20 flex gap-4">
            <Button variant="ghost" onClick={() => setSelectedFlag(null)} className="rounded-full text-muted-foreground font-bold text-xs uppercase tracking-widest">Cancel</Button>
            <Button
              onClick={handleSaveGovernance}
              disabled={updateGovernance.isPending}
              className="rounded-full px-8 bg-primary hover:bg-primary/80 font-bold text-xs uppercase tracking-widest"
            >
              {updateGovernance.isPending ? 'Saving...' : 'Save Governance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
