import powerbi from 'powerbi-visuals-api';
import { FormattingSettingsService } from 'powerbi-visuals-utils-formattingmodel';
import { aggregate, dateLabel, InputRow, Order } from './model';
import { Settings } from './settings';
import '../style/visual.less';
export class Visual implements powerbi.extensibility.visual.IVisual {
 private root: HTMLElement; private host: powerbi.extensibility.visual.IVisualHost;
 private selection: powerbi.extensibility.ISelectionManager;
 private service = new FormattingSettingsService(); private settings = new Settings();
 private ids = new Map<string,powerbi.visuals.ISelectionId[]>();
 constructor(options?: powerbi.extensibility.visual.VisualConstructorOptions) {
  if(!options)throw new Error('Promise Drift requires Power BI visual constructor options.');
  this.host=options.host; this.selection=this.host.createSelectionManager();
  this.root=document.createElement('div');this.root.className='promise-drift';options.element.appendChild(this.root);
  this.selection.registerOnSelectCallback(()=>this.paintSelection());
 }
 private el(tag:string,text?:string,cls?:string,parent=this.root):HTMLElement {const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent.appendChild(n);return n;}
 private button(text:string,parent:HTMLElement,action:(e:MouseEvent)=>void) { const b=this.el('button',text,undefined,parent) as HTMLButtonElement;b.type='button';b.onclick=action;return b; }
 public update(options: powerbi.extensibility.visual.VisualUpdateOptions) {
  this.host.eventService.renderingStarted(options);
  try {
   this.root.replaceChildren();this.ids.clear(); const dv=options.dataViews?.[0];
   if(dv)this.settings=this.service.populateFormattingSettingsModel(Settings,dv);
   const fa=this.settings.display.rtl.value;this.root.dir=fa?'rtl':'ltr';
   this.el('h1','Promise Drift');this.el('p',fa?'تاریخچهٔ قول‌ها، از اولین وعده تا تحویل واقعی':'Every promise, from first commitment to actual delivery','subtitle');
   const table=dv?.table; const roles=['po','supplier','revision','promised','actual'];
   const col=roles.map(r=>table?.columns.findIndex(c=>c.roles?.[r])??-1);
   if(!table || col.slice(0,4).some(i=>i<0)){this.el('p',fa?'فیلدهای شماره سفارش، تأمین‌کننده، تاریخ اصلاح و تاریخ قول را اضافه کنید.':'Add PO Number, Supplier, Revision Date and Promised Date.');return;}
   const rows:InputRow[]=(table.rows??[]).map((r,index)=>({po:r[col[0]]==null?'':String(r[col[0]]),supplier:r[col[1]]==null?'':String(r[col[1]]),revision:r[col[2]],promised:r[col[3]],actual:col[4]<0?undefined:r[col[4]],index}));
   const result=aggregate(rows);
   if(dv.metadata.segment)this.el('p',fa?'داده ناقص است؛ فیلترها را محدود کنید. محاسبات فقط برای ردیف‌های دریافت‌شده است.':'Partial data: narrow your filters. Metrics cover loaded rows only.','warning');
   if(result.invalid||result.conflicts)this.el('p',`${result.invalid} ${fa?'ردیف/تاریخ نامعتبر؛':'invalid rows/dates;'} ${result.conflicts} ${fa?'سفارش متناقض از محاسبه حذف شد.':'conflicting orders excluded.'}`,'warning');
   const summary=this.el('div',undefined,'summary');
   for(const [label,value] of [[fa?'سفارش':'Orders',result.orders.length],[fa?'تغییر قول':'Promise changes',result.orders.reduce((n,o)=>n+o.changes,0)],[fa?'تحویل دیرهنگام':'Late deliveries',result.orders.filter(o=>o.status==='Late').length]]) {const m=this.el('div',String(label),'metric',summary);this.el('strong',String(value),undefined,m);}
   this.button(fa?'پاک کردن انتخاب':'Clear selection',this.root,()=>{void this.selection.clear().then(()=>this.paintSelection());});
   for(const o of result.orders)this.ids.set(o.key,o.indices.map(i=>this.host.createSelectionIdBuilder().withTable(table,i).createSelectionId()));
   for(const o of result.orders)this.renderOrder(o,result.orders,fa);
   this.paintSelection();
  } finally {this.host.eventService.renderingFinished(options);}
 }
 private renderOrder(o:Order,orders:Order[],fa:boolean) {
  const row=this.el('section',undefined,'order');row.dataset.key=o.key;
  const top=this.el('div',undefined,'top',row);
  this.button(o.po,top,e=>this.select(this.ids.get(o.key)!,e));
  this.button(o.supplier,top,e=>this.select(orders.filter(x=>x.supplier===o.supplier).flatMap(x=>this.ids.get(x.key)!),e));
  this.el('span',o.status,`badge ${o.status.toLowerCase().replace(' ','-')}`,top);
  const timeline=this.el('div',undefined,'timeline',row);
  const fmt=(d:number)=>dateLabel(d,this.settings.display.persian.value);
  o.events.forEach((ev,i)=>{const event=this.el('div',i===0?(fa?'اولین قول':'First promise'):(fa?'بازبینی قول':'Promise revision'),'event',timeline);this.el('strong',fmt(ev.promised),undefined,event);this.el('small',`${fa?'ثبت:':'Recorded:'} ${fmt(ev.revision)}`,undefined,event);});
  if(o.actual!==undefined){const event=this.el('div',fa?'تحویل واقعی':'Actual delivery','event actual',timeline);this.el('strong',fmt(o.actual),undefined,event);}
  const bottom=this.el('div',undefined,'bottom',row);const signed=(n:number)=>(n>0?'+':'')+n;
  this.el('span',`${o.changes} ${fa?'بار تغییر قول':'promise changes'}`,undefined,bottom);
  this.el('span',`${fa?'انحراف آخرین قول:':'Latest promise drift:'} ${signed(o.drift)} ${fa?'روز':'days'}`,undefined,bottom);
  this.el('span',`${fa?'انحراف تحویل:':'Delivery drift:'} ${o.deliveryDrift===undefined?'—':signed(o.deliveryDrift)} ${fa?'روز نسبت به اولین قول':'days vs first promise'}`,undefined,bottom);
 }
 private select(ids:powerbi.visuals.ISelectionId[],e:MouseEvent) {void this.selection.select(ids,e.ctrlKey||e.metaKey).then(()=>this.paintSelection());}
 private paintSelection() {const selected=this.selection.getSelectionIds();this.root.querySelectorAll<HTMLElement>('.order').forEach(row=>{const active=(this.ids.get(row.dataset.key!)??[]).some(id=>selected.some(s=>id.equals(s as powerbi.visuals.ISelectionId)));row.classList.toggle('selected',active);row.classList.toggle('dimmed',selected.length>0&&!active);});}
 public getFormattingModel(): powerbi.visuals.FormattingModel {return this.service.buildFormattingModel(this.settings);}
 public destroy() {this.root.remove();}
}

