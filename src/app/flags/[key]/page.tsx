"use client";

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2,
  Calendar, Clock, User, Users, Tag, FileText, Hash, Globe,
} from 'lucide-react';
import { useFlagDetail, useSettings, useUsers, useUpdateGovernance } from '@/hooks/useFlags';
import { getViolations, isValidName, daysSince } from '@/utils/naming';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/hooks/use-toast';

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString([], {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/10 last:border-0">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-28 shrink-0 mt-0.5">{label}</span>
      <span className="text-sm text-foreground/80 break-all">{value}</span>
    </div>
  );
}

export default function FlagDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const { key: flagKey } = use(params);
  const { flag, governance, isLoading, isError, error, refetch, isFetching } = useFlagDetail(flagKey);
  const { data: settings } = useSettings();
  const { data: users = [] } = useUsers();
  const updateGovernance = useUpdateGovernance();

  const [editTeam, setEditTeam] = useState('');
  const [editOwner, setEditOwner] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const startEdit = () => {
    setEditTeam(governance?.team ?? '');
    setEditOwner(governance?.owner ?? '');
    setEditNotes(governance?.notes ?? '');
    setIsEditing(true);
  };

  const handleSave = () => {
    updateGovernance.mutate(
      { flagKey, data: { team: editTeam, owner: editOwner, notes: editNotes } },
      {
        onSuccess: () => {
          toast({ title: 'Governance Updated', description: `Saved for ${flagKey}.` });
          setIsEditing(false);
          refetch();
        },
        onError: () => {
          toast({ title: 'Save Failed', description: 'Could not write to Firestore.', variant: 'destructive' });
        },
      }
    );
  };

  // Merge flag + governance for violation calculation
  const mergedFlag = flag ? {
    ...flag,
    owner: governance?.owner ?? null,
    team: governance?.team ?? null,
    hasGovernance: !!governance,
  } : null;

  const violations = mergedFlag ? getViolations(mergedFlag) : [];

  const sortedEnvs = flag
    ? Object.values(flag.environments).sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))
    : [];

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Loading flag...</p>
        </div>
      </div>
    );
  }

  if (isError || !flag) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-sm font-bold text-destructive">{(error as Error)?.message ?? 'Flag not found'}</p>
          <Link href="/"><Button variant="outline" size="sm" className="rounded-full">Back to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Toaster />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FlagOps</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none mt-0.5">Optimizely Governance</p>
            </div>
          </Link>
          <div className="h-5 w-px bg-border/40 mx-2" />
          <span className="text-sm font-code text-muted-foreground">{flagKey}</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}
            className="rounded-full border-border/20 bg-white/5 hover:bg-white/10">
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/?tab=flags">
            <Button variant="ghost" size="sm" className="rounded-full font-bold text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-8 mt-10 space-y-8">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div className="glass rounded-2xl p-8 border-border/20 shadow-2xl">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded font-code ${isValidName(flag.key) ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                  {flag.key}
                </span>
                <Badge color={flag.archived ? 'gray' : 'green'}>{flag.archived ? 'Archived' : 'Active'}</Badge>
                {violations.length === 0
                  ? <Badge color="green">Healthy</Badge>
                  : <Badge color={violations.some(v => v.severity === 'error') ? 'red' : 'yellow'}>{violations.length} {violations.length === 1 ? 'Violation' : 'Violations'}</Badge>
                }
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">{flag.name}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                {flag.description || <span className="italic">No description provided.</span>}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Revision</p>
              <p className="text-4xl font-bold font-code text-primary mt-1">#{flag.revision}</p>
            </div>
          </div>
        </div>

        {/* ── Main grid ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-12 gap-6">

          {/* Flag metadata */}
          <div className="col-span-5 glass rounded-2xl p-6 border-border/20 shadow-2xl">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText className="w-3 h-3" /> Flag Details
            </h3>
            <MetaRow icon={<Hash className="w-3.5 h-3.5" />}    label="Flag ID"    value={<span className="font-code">{flag.id}</span>} />
            <MetaRow icon={<User className="w-3.5 h-3.5" />}    label="Created By" value={flag.created_by_user_email || '—'} />
            <MetaRow icon={<Calendar className="w-3.5 h-3.5" />} label="Created"   value={formatDateTime(flag.created_time)} />
            <MetaRow icon={<Clock className="w-3.5 h-3.5" />}   label="Modified"  value={
              <span className={daysSince(flag.updated_time) > 90 ? 'text-destructive font-semibold' : ''}>
                {formatDateTime(flag.updated_time)}
                {daysSince(flag.updated_time) > 90 && <span className="ml-2 text-[10px] font-bold uppercase">Stale ({daysSince(flag.updated_time)}d)</span>}
              </span>
            } />
            <MetaRow icon={<Globe className="w-3.5 h-3.5" />}   label="Project ID" value={<span className="font-code">{flag.project_id}</span>} />
          </div>

          {/* Governance */}
          <div className="col-span-7 glass rounded-2xl p-6 border-border/20 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" /> Governance
              </h3>
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={startEdit}
                  className="rounded-full text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 h-7 px-3">
                  Edit
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Team</label>
                    <Select value={editTeam} onValueChange={setEditTeam}>
                      <SelectTrigger className="bg-white/5 border-border/20 h-9">
                        <SelectValue placeholder="Select Team" />
                      </SelectTrigger>
                      <SelectContent>
                        {settings?.teams?.map((t: string) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Owner</label>
                    <Select value={editOwner} onValueChange={setEditOwner}>
                      <SelectTrigger className="bg-white/5 border-border/20 h-9">
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
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Notes</label>
                  <Textarea
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    placeholder="Additional governance context..."
                    className="bg-white/5 border-border/20 min-h-[80px] text-sm"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <Button onClick={handleSave} disabled={updateGovernance.isPending} size="sm"
                    className="rounded-full px-6 bg-primary hover:bg-primary/80 font-bold text-xs uppercase tracking-widest">
                    {updateGovernance.isPending ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}
                    className="rounded-full font-bold text-xs uppercase tracking-widest text-muted-foreground">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <MetaRow icon={<Tag className="w-3.5 h-3.5" />}    label="Team"  value={governance?.team || <span className="text-muted-foreground italic">Unassigned</span>} />
                <MetaRow icon={<Users className="w-3.5 h-3.5" />}  label="Owner" value={governance?.owner || <span className="text-muted-foreground italic">Unassigned</span>} />
                <MetaRow icon={<FileText className="w-3.5 h-3.5" />} label="Notes" value={governance?.notes || <span className="text-muted-foreground italic">None</span>} />
                {governance?.governanceUpdatedAt && (
                  <MetaRow icon={<Clock className="w-3.5 h-3.5" />} label="Updated" value={formatDateTime(governance.governanceUpdatedAt)} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Environments ──────────────────────────────────────────────────── */}
        <div className="glass rounded-2xl p-6 border-border/20 shadow-2xl">
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
            <Globe className="w-3 h-3" /> Environments ({sortedEnvs.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedEnvs.map(env => (
              <div key={env.key}
                className={`rounded-xl p-4 border ${env.enabled ? 'bg-success/5 border-success/20' : 'bg-white/[0.02] border-border/10'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-foreground/80">{env.name}</span>
                  <span className={`w-2 h-2 rounded-full ${env.enabled ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground">Status</span>
                    <Badge color={env.status === 'running' ? 'green' : env.status === 'draft' ? 'gray' : 'blue'}>
                      {env.status || 'unknown'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground">Enabled</span>
                    <span className={`text-[11px] font-bold ${env.enabled ? 'text-success' : 'text-muted-foreground'}`}>
                      {env.enabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  {env.has_restricted_permissions && (
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground">Restricted</span>
                      <Badge color="yellow">Yes</Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Violations ────────────────────────────────────────────────────── */}
        <div className="glass rounded-2xl p-6 border-border/20 shadow-2xl">
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <AlertTriangle className="w-3 h-3" /> Governance Violations
          </h3>
          {violations.length === 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-success/5 border border-success/20 text-success">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-sm font-bold">All governance standards met. No violations detected.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {violations.map((v, i) => (
                <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border ${
                  v.severity === 'error' ? 'bg-destructive/5 border-destructive/20 text-destructive' : 'bg-warning/5 border-warning/20 text-warning'
                }`}>
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="text-xs font-bold">{v.label}</span>
                    <span className="ml-2 text-[10px] opacity-60 uppercase">{v.severity}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
