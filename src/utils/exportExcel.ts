import * as XLSX from 'xlsx';
import { getViolations } from './naming';

export function exportFlagsToExcel(flags: any[]) {
  const rows = flags.map(flag => {
    const violations = getViolations(flag);

    // Build a readable environment summary: "production(ON) staging(OFF) ..."
    const envSummary = Object.entries(flag.environments ?? {})
      .sort(([, a]: any, [, b]: any) => (a.priority ?? 99) - (b.priority ?? 99))
      .map(([key, env]: any) => `${key}:${env.enabled ? 'ON' : 'OFF'}`)
      .join('  ');

    return {
      'Flag Key':        flag.key,
      'Name':            flag.name,
      'Description':     flag.description || '',
      'Team':            flag.team || '',
      'Assigned Owner':  flag.owner || '',
      'Created By':      flag.created_by_user_email || '',
      'Environments':    envSummary,
      'Created Date':    flag.created_time ? new Date(flag.created_time).toLocaleDateString() : '',
      'Last Modified':   flag.updated_time ? new Date(flag.updated_time).toLocaleDateString() : '',
      'Archived':        flag.archived ? 'Yes' : 'No',
      'Violations':      violations.length === 0 ? 'Clean' : violations.map(v => v.label).join(', '),
      'Notes':           flag.notes || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns based on content
  const colWidths = Object.keys(rows[0] ?? {}).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String((r as any)[key] ?? '').length), 10),
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Flags');

  const fileName = `flagops-flags-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
