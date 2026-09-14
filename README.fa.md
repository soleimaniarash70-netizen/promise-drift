# Promise Drift — Power BI Custom Visual

ویژوال واقعی TypeScript برای تاریخچهٔ قول تأمین‌کننده، با قالب Power BI Custom Visual SDK. رابط با DOM/HTML در `src/visual.ts` ساخته می‌شود و CSS در `style/visual.less` است.

## وضعیت تحویل

**بستهٔ pbiviz با SDK رسمی نسخهٔ 7.2.1 تولید شد.** بررسی TypeScript با API نسخهٔ 5.11.1، هر ۸ تست منطق و تست مرورگر روی JavaScript/CSS استخراج‌شده از بسته موفق بودند. انتخاب سفارش/تأمین‌کننده، پاک‌کردن انتخاب، دو گزینهٔ formatting model، RTL/LTR و نمایش باریک بررسی شدند. نصب در خود Power BI Desktop/Service هنوز آزمایش نشده است. تصویر ماکاپ تأییدشده در گفت‌وگوی بازیابی‌شده موجود نبود؛ ظاهر فعلی برداشت اولیه از تایم‌لاین است.

## اجرا و بسته‌بندی

Node.js 24 و npm نصب کنید. در این پوشه:

```sh
npm install
npm test
npm run typecheck
npm run package
```

خروجی موفق SDK در پوشهٔ `dist/` با پسوند `.pbiviz` قرار می‌گیرد. برای توسعه: `npm start`. در صورت نیاز به گواهی توسعه، `npx pbiviz install-cert` را اجرا کنید. برای توزیع عمومی، نام/ایمیل مالک و آدرس پشتیبانی واقعی را در `pbiviz.json` جایگزین کنید؛ آدرس GitHub عمومی و ایمیل example.invalid صرفاً placeholder هستند.

ساخت این تحویل به دلیل محدودیت دانلود، با وابستگی‌های SDK موجود روی همین رایانه و دستور `pbiviz package --skip-api --no-stats` انجام شد. `--skip-api` بررسی/دانلود نسخهٔ API را رد می‌کند؛ بررسی TypeScript و ساخت واقعی Webpack/SDK انجام شدند. برای نصب پاک روی رایانهٔ دیگر از `npm install` استفاده کنید؛ node_modules محلی جزو ZIP تحویلی نیست.

تست منطق بدون دانلود پکیج، با Node.js 24 نیز قابل اجراست:

```sh
node --test tests/model.test.ts
```

## اتصال داده

فایل `sample-data/promise-drift.csv` را در Power BI وارد کنید. PO Number و Supplier را Text و سه ستون تاریخ را Date تعریف کنید. از خود ستون تاریخ استفاده کنید، نه Date Hierarchy. از Visualizations → Import a visual from a file بسته را وارد کنید و هر ستون را به نقش هم‌نام ببرید.

| Role | نیاز |
|---|---|
| PO Number | الزامی، شناسه سفارش |
| Supplier | الزامی، شناسه/نام یکتای تأمین‌کننده |
| Revision Date | الزامی، تاریخ ثبت هر قول |
| Promised Date | الزامی، قول ثبت‌شده در همان بازبینی |
| Actual Delivery Date | اختیاری، یک تاریخ تحویل نهایی برای هر سفارش |

هر ردیف یک snapshot از قول است. تاریخ تحویل می‌تواند روی یک ردیف یا روی تمام snapshotها تکرار شود. داده‌های Date یا ISO میلادی پذیرفته می‌شوند؛ شمسی فقط برای نمایش است. منطقه زمانی محاسبه UTC و دقت محاسبات یک روز است. بازبینی‌های متفاوت در یک روز با قول متفاوت مبهم هستند و سفارش حذف و اعلام می‌شود؛ این MVP ترتیب ساعتی ندارد.

## تعریف محاسبات

- کلید سفارش = Supplier + PO Number؛ مرتب‌سازی snapshotها بر اساس Revision Date.
- تعداد تغییر = تعداد تغییر Promised Date نسبت به snapshot قبلی؛ ثبت تکراری و قول ثابت شمارش نمی‌شود.
- انحراف قول = آخرین قول منهای اولین قول، به روز؛ عدد مثبت یعنی عقب‌رفتن.
- انحراف تحویل = تحویل واقعی منهای اولین قول.
- On Time = انحراف تحویل صفر؛ Late مثبت؛ Early منفی؛ Pending بدون تحویل واقعی.
- وضعیت بر مبنای اولین قول است؛ Pending به معنی On Time نیست و هشدار سررسید امروز ندارد.
- چند Actual متفاوت یا قول متفاوت برای یک Revision Date: سفارش متناقض از محاسبات حذف می‌شود و هشدار نمایش داده می‌شود.
- فیلتر گزارش روی Revision Date می‌تواند اولین قول قابل‌مشاهده را تغییر دهد. برای baseline کامل، تاریخچه را در مدل/فیلتر حفظ کنید.

## تعامل و قالب‌بندی

کلیک شماره سفارش تمام ردیف‌های تاریخچهٔ آن سفارش را با SelectionManager انتخاب می‌کند؛ کلیک Supplier تمام ردیف‌های دریافت‌شدهٔ همان تأمین‌کننده را انتخاب می‌کند. Ctrl/Cmd برای چندانتخابی و Clear selection برای پاک‌کردن است. تأثیر روی سایر ویژوال‌ها تابع Edit interactions در Power BI است. این روش انتخاب مجموعهٔ ردیف‌هاست، نه اعمال فیلتر ستونی مستقل Supplier بر ردیف‌های خارج از دادهٔ دریافت‌شده.

Formatting Pane دو گزینهٔ مستقل دارد: RTL و Persian calendar. دکمه‌ها با Tab و Enter قابل استفاده‌اند. متن داده‌ها با textContent نوشته می‌شود؛ HTML ورودی اجرا نمی‌شود. درخواست شبکه یا دسترسی خارجی وجود ندارد.

## محدودیت‌ها و بررسی در میزبان

سقف دریافت ۳۰٬۰۰۰ snapshot است؛ وجود segment باعث هشدار ناقص‌بودن داده می‌شود. در MVP صفحه‌بندی خودکار و تحویل‌های جزئی وجود ندارد. خط تاریخچه ترتیب رویدادها را نشان می‌دهد؛ فاصله‌ها مقیاس روز نیستند.

بعد از نصب بسته، وضعیت نمونه باید چنین باشد: PO-1042: دو تغییر، drift قول +16، drift تحویل +22، Late؛ PO-1043: On Time؛ PO-1044: یک تغییر، -3 روز، Early؛ PO-1045: یک تغییر، +6 روز و Pending.

در Power BI انتخاب سفارش/تأمین‌کننده را کنار یک جدول استاندارد آزمایش کنید؛ Ctrl+click، پاک‌کردن انتخاب، فیلتر خارجی، تغییر اندازه و دو گزینهٔ قالب‌بندی را بررسی کنید. تست میزبان شبیه‌سازی‌شده جای تست Power BI را نمی‌گیرد.

## منابع SDK

- [Capabilities](https://learn.microsoft.com/en-us/power-bi/developer/visuals/capabilities)
- [Formatting model](https://learn.microsoft.com/en-us/power-bi/developer/visuals/format-pane-general)
- [Selection API](https://learn.microsoft.com/en-us/power-bi/developer/visuals/selection-api)
