# تشغيل صيدليتي على Windows / PowerShell

1. فك ضغط المشروع وافتح مجلد `saydalety` في VS Code.
2. تأكد من وجود Node.js 20.9 أو أحدث:

```powershell
node -v
npm -v
```

3. ثبّت الحزم:

```powershell
npm install
```

4. انسخ ملف البيئة:

```powershell
Copy-Item .env.example .env
```

5. من Neon Console أنشئ مشروع PostgreSQL، ثم انسخ Connection string وضعه بعد `DATABASE_URL=` في `.env`.
6. طبّق المخطط وأضف التصنيفات التجريبية:

```powershell
npm run db:migrate
npm run db:seed
```

7. شغّل التطبيق:

```powershell
npm run dev
```

ثم افتح `http://localhost:3000`.

**مهم:** لا ترسل Connection string أو أي كلمة مرور في المحادثة. احتفظ بها داخل ملف `.env` على جهازك، ولا ترفع الملف إلى Git.
