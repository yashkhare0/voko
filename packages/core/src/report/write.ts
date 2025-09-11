import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface ScanSummary {
  created: number;
  updated: number;
  orphaned: number;
  skipped: number;
}

export interface ScanReport {
  summary: ScanSummary;
  byNamespace: Record<string, ScanSummary>;
  notes?: string[];
}

export interface WriteScanReportOptions {
  cwd?: string; // project root
  dir?: string; // default: reports
  now?: string; // ISO timestamp override
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatTimestamp(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  const yyyy = d.getUTCFullYear();
  const mm = pad2(d.getUTCMonth() + 1);
  const dd = pad2(d.getUTCDate());
  const hh = pad2(d.getUTCHours());
  const min = pad2(d.getUTCMinutes());
  return `${yyyy}${mm}${dd}-${hh}${min}`;
}

export function writeScanReport(report: ScanReport, opts: WriteScanReportOptions = {}): string {
  const cwd = opts.cwd ?? process.cwd();
  const dir = opts.dir ?? 'reports';
  const stamp = formatTimestamp(opts.now);
  const file = resolve(cwd, dir, `voko-scan-${stamp}.json`);

  mkdirSync(resolve(cwd, dir), { recursive: true });
  const json = JSON.stringify(report, null, 2) + '\n';
  writeFileSync(file, json, 'utf8');
  return file;
}
