import { Shield, FileText, ScrollText, ArrowLeft, Lock, AlertOctagon, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/PageLayout";
import { MobileMenu } from "@/components/MobileMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

const PROHIBITED = [
  "Будь-яка незаконна діяльність, включно з порушенням національного чи міжнародного законодавства",
  "Стеження, переслідування, домагання чи цькування фізичних осіб",
  "Несанкціонована розвідка щодо журналістів, активістів, правозахисників, дисидентів",
  "Збір розвідданих з метою фізичної шкоди особі, її близьким чи майну",
  "Атаки на критичну інфраструктуру (енергетика, водопостачання, лікарні, банки)",
  "Несанкціоноване тестування проникнення без письмового дозволу власника системи",
  "Підготовка до шахрайства, фішингу, скаму, відмивання коштів",
  "Ухилення від санкцій (OFAC, EU, UK), фінансування тероризму",
  "Експлуатація неповнолітніх будь-яким способом",
  "Розповсюдження CSAM, доксінг, помста-порно, NCII",
  "Масовий парсинг чи bulk-extract даних без дозволу платформи",
  "Зворотна розробка, дешифрування чи спроби обійти технічні засоби захисту",
  "Перепродаж чи перепакування даних DARKSHARE без явної ліцензії",
  "Використання сервісу для конкурентної розвідки проти DARKSHARE",
];

const ALLOWED = [
  "Особистий OPSEC-аудит — перевірка власних акаунтів, email, телефонів, гаманців",
  "Корпоративний моніторинг безпеки власної організації (з мандатом)",
  "Авторизоване тестування проникнення у межах підписаного контракту",
  "Академічні дослідження кібербезпеки, threat intelligence, соціальної інженерії",
  "Журналістські розслідування суспільно значущих тем (з належною журналістською етикою)",
  "Compliance-розслідування (KYC/AML) сертифікованими установами",
  "Розслідування фінансового шахрайства жертвами або їхніми представниками",
  "Освіта та підготовка фахівців з кібербезпеки",
  "Перевірка відкритих джерел перед діловими угодами (due diligence)",
];

const SECTIONS = [
  {
    title: "1. Призначення Acceptable Use Policy",
    content: "Ця Acceptable Use Policy (AUP) визначає правила використання платформи DARKSHARE. AUP є невід'ємною частиною Terms of Service. Порушення AUP може призвести до негайного припинення доступу, блокування облікового запису без повернення коштів, передачі даних правоохоронним органам у межах чинного законодавства та подання цивільних позовів про відшкодування збитків."
  },
  {
    title: "2. Ваша відповідальність як користувача",
    content: "Ви — і тільки ви — несете повну відповідальність за всі запити, проведені під вашим обліковим записом. Ви гарантуєте, що: (а) маєте законне право та правову підставу для проведення кожного запиту; (б) не перебуваєте під санкційним списком OFAC/EU/UK/UN; (в) дотримуєтесь GDPR (ЄС), UK GDPR, CCPA (Каліфорнія), Закону України «Про захист персональних даних», LGPD (Бразилія) та іншого застосовного законодавства про захист персональних даних. DARKSHARE не є вашим контролером даних і не може надати правову основу для вашої обробки."
  },
  {
    title: "3. Обмеження для журналістських/правозахисних цілей",
    content: "Якщо ви здійснюєте журналістську діяльність, надійте мінімальний принцип: збирайте лише дані, безпосередньо необхідні для теми суспільного інтересу, ніколи не публікуйте PII третіх осіб без редакційного review та правового аналізу, дотримуйтесь принципів IFJ Global Charter of Ethics. Атака на джерела, інформаторів, активістів — заборонена та буде передана правоохоронним органам."
  },
  {
    title: "4. Заборона військового та дисидентського тарґетингу",
    content: "Сервіс категорично заборонено використовувати для: ідентифікації або деанонімізації військовослужбовців, працівників розвідки, осіб, що здійснюють роботу під прикриттям; переслідування політичних опонентів, активістів, ЛГБТК+ спільнот, релігійних меншин; державної цензури чи пригнічення політичних рухів. DARKSHARE підтримує універсальні принципи прав людини UN UDHR."
  },
  {
    title: "5. Криптовалюта та фінанси",
    content: "Аналіз блокчейн-адрес дозволено для: due diligence перед транзакцією, розслідування власних втрат, академічних досліджень. ЗАБОРОНЕНО: відстеження жертв ransomware з метою повторного нападу, дeанонімізація отримувачів legitimate приватних транзакцій (Tornado Cash legacy, donations), зловживання даними для шантажу. DARKSHARE може блокувати запити щодо адрес, що підлягають FATF Travel Rule або OFAC SDN."
  },
  {
    title: "6. AI-функції та автоматизація",
    content: "AI Threat Profile, AI Summary та інші AI-функції генерують ймовірнісні припущення на основі публічних даних. Вони НЕ є експертним висновком, не можуть бути використані як доказ у суді, можуть помилятися. Ви зобов'язані: завжди розкривати, що результат AI-генерований при пере/розповсюдженні; верифікувати ключові дані з первинних джерел; не приймати рішень з юридичними наслідками лише на підставі AI."
  },
  {
    title: "7. Антибот та частотні обмеження",
    content: "Кожен тарифний план має чітко визначений ліміт запитів (FREE: 1/день + 5 бонусних при реєстрації, PRO: 50/день, ENTERPRISE/GROUPS: 500/день). Спроби обійти ліміти через множинні акаунти, проксі-ротацію чи скриптування караються негайним блокуванням всіх пов'язаних акаунтів. API-ключі ENTERPRISE забороняється передавати/перепродавати."
  },
  {
    title: "8. Конфіденційність ваших запитів",
    content: "DARKSHARE зберігає історію ваших запитів у вашому акаунті. Ми не передаємо цю історію третім особам без законного судового рішення з належної юрисдикції. Ви можете в будь-який момент видалити окремі записи історії або весь акаунт через сторінку /account. Сирі дані з третіх API (Shodan, ip-api тощо) не зберігаються довше ніж потрібно для генерації звіту."
  },
  {
    title: "9. Звітування про порушення",
    content: "Якщо ви виявили зловживання сервісом — надсилайте звіт на abuse@darkshare.app або через @DarkShare1Bot з тегом /abuse. Ми реагуємо на скарги протягом 48 годин. Жертви доксінгу/переслідування можуть подати GDPR-запит на видалення даних на сторінці /data-deletion або через цей AUP-канал."
  },
  {
    title: "10. Зміни AUP та зворотний зв'язок",
    content: "DARKSHARE може оновлювати AUP без попереднього повідомлення для оперативного реагування на нові загрози. Матеріальні зміни анонсуються в інтерфейсі. Продовження використання сервісу після оновлення = згода з новою редакцією. Запитання щодо AUP: darkshare.store@gmail.com або @DarkShare1Bot."
  },
];

function AUPContent() {
  const [, setLocation] = useLocation();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back-aup">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1" />
      </div>

      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/10 flex items-center justify-center border border-red-500/30">
          <AlertOctagon className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold" data-testid="text-aup-title">Acceptable Use Policy</h1>
        <p className="text-muted-foreground text-sm">Чинна редакція: квітень 2026</p>
      </div>

      <Card className="border-red-500/30 bg-red-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-100/90 leading-relaxed">
              <strong className="text-red-300">УВАГА:</strong> Ця політика є юридично зобов'язуючою. Порушення тягне за собою негайне блокування акаунта без повернення коштів та може призвести до передачі даних правоохоронним органам. Прочитайте уважно перед використанням платформи.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-cyan-500/20 bg-cyan-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-cyan-300">
              <CheckCircle2 className="w-4 h-4" />
              Дозволене використання
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {ALLOWED.map((item, i) => (
                <li key={i} className="text-sm text-cyan-100/80 leading-relaxed flex gap-2" data-testid={`text-aup-allowed-${i + 1}`}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-300">
              <XCircle className="w-4 h-4" />
              Категорично заборонено
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {PROHIBITED.map((item, i) => (
                <li key={i} className="text-sm text-red-100/80 leading-relaxed flex gap-2" data-testid={`text-aup-prohibited-${i + 1}`}>
                  <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {SECTIONS.map((section, index) => (
        <Card key={index} className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 flex-wrap">
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-aup-section-${index + 1}`}>
              {section.content}
            </p>
          </CardContent>
        </Card>
      ))}

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <h4 className="text-sm font-semibold">Зв'язок з порушень</h4>
              <p className="text-sm text-muted-foreground">
                Email: <a href="mailto:abuse@darkshare.app" className="text-primary hover:underline">abuse@darkshare.app</a> • Telegram: <a href="https://t.me/DarkShare1Bot" target="_blank" rel="noreferrer" className="text-primary hover:underline">@DarkShare1Bot</a>
              </p>
              <p className="text-sm text-muted-foreground">
                Запит на видалення даних: <a href="/data-deletion" className="text-primary hover:underline">/data-deletion</a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AUP() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <PageLayout title="AUP"><AUPContent /></PageLayout>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="relative z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer" onClick={() => setLocation("/")} data-testid="link-home-brand-aup">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 flex-shrink-0">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-base sm:text-lg">DARKSHARE</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher variant="minimal" />
            <MobileMenu isAuthenticated={false} />
          </div>
        </div>
      </nav>
      <div className="flex-1"><AUPContent /></div>
      <Footer />
    </div>
  );
}
