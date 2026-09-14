export interface InputRow { po: string; supplier: string; revision: unknown; promised: unknown; actual?: unknown; index: number }
export interface Event { revision: number; promised: number; index: number }
export interface Order { key: string; po: string; supplier: string; events: Event[]; indices: number[]; first: number; latest: number; actual?: number; changes: number; drift: number; deliveryDrift?: number; status: string }
const DAY = 86400000;
export function day(value: unknown): number | undefined {
 if (value == null || value === '') return undefined;
 if (!(value instanceof Date) && typeof value !== 'string') return undefined;
 if (typeof value === 'string' && !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value)) return undefined;
 if (typeof value === 'string') {
  const [y,m,d]=value.slice(0,10).split('-').map(Number), check=new Date(Date.UTC(y,m-1,d));
  if(check.getUTCFullYear()!==y||check.getUTCMonth()!==m-1||check.getUTCDate()!==d)return undefined;
 }
 const date = value instanceof Date ? value : new Date(value);
 return Number.isFinite(date.getTime()) ? Math.floor(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()) / DAY) : undefined;
}
export function aggregate(rows: InputRow[]): { orders: Order[]; invalid: number; conflicts: number } {
 const groups = new Map<string, {rows: InputRow[]; events: Event[]; actuals: number[]}>(); let invalid = 0, conflicts = 0;
 for (const row of rows) {
  const revision = day(row.revision), promised = day(row.promised), actual = day(row.actual);
  if (!row.po || !row.supplier || revision === undefined || promised === undefined) { invalid++; continue; }
  if (row.actual != null && row.actual !== '' && actual === undefined) invalid++;
  const key = JSON.stringify([row.supplier,row.po]);
  if (!groups.has(key)) groups.set(key,{rows:[],events:[],actuals:[]});
  const g = groups.get(key)!; g.rows.push(row); g.events.push({revision,promised,index:row.index}); if(actual !== undefined) g.actuals.push(actual);
 }
 const orders: Order[] = [];
 for (const [key,g] of groups) {
  g.events.sort((a,b)=>a.revision-b.revision || a.promised-b.promised);
  const events = g.events.filter((e,i,a)=>!i || e.revision !== a[i-1].revision || e.promised !== a[i-1].promised);
  const ambiguous = events.some((e,i)=>i>0 && e.revision===events[i-1].revision);
  const actuals = [...new Set(g.actuals)]; if (ambiguous || actuals.length>1) { conflicts++; continue; }
  const first=events[0].promised, latest=events[events.length-1].promised, actual=actuals[0];
  const delta=actual === undefined ? undefined : actual-first;
  orders.push({key,po:g.rows[0].po,supplier:g.rows[0].supplier,events,indices:g.rows.map(r=>r.index),first,latest,actual,changes:events.reduce((n,e,i)=>n+Number(i>0 && e.promised!==events[i-1].promised),0),drift:latest-first,deliveryDrift:delta,status:delta===undefined?'Pending':delta>0?'Late':delta<0?'Early':'On Time'});
 }
 return {orders:orders.sort((a,b)=>a.supplier.localeCompare(b.supplier)||a.po.localeCompare(b.po)),invalid,conflicts};
}
export function dateLabel(value: number, persian: boolean): string {
 return new Intl.DateTimeFormat(persian?'fa-IR-u-ca-persian':'en-GB',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(value*DAY));
}
