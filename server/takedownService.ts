export type TakedownJurisdiction = "EU" | "UK" | "UA" | "US" | "RU" | "OTHER";
export type TakedownLanguage = "uk" | "ru" | "en";
export type RecipientType = "website_admin" | "hosting_provider" | "search_engine" | "social_platform" | "data_broker";

export interface TakedownInput {
  recipientType: RecipientType;
  recipientName?: string;
  recipientEmail?: string;
  dataDescription: string;
  jurisdiction: TakedownJurisdiction;
  language: TakedownLanguage;
  requesterName?: string;
  requesterEmail?: string;
  urlsContainingData?: string[];
}

const LEGAL_BASES: Record<TakedownJurisdiction, { en: string; uk: string; ru: string }> = {
  EU: {
    en: "Article 17 of the General Data Protection Regulation (Regulation (EU) 2016/679, “GDPR”) — Right to erasure ('right to be forgotten')",
    uk: "Стаття 17 Загального регламенту про захист даних ЄС (Регламент (ЄС) 2016/679, GDPR) — право на видалення (право бути забутим)",
    ru: "Статья 17 Общего регламента ЕС о защите данных (Регламент (ЕС) 2016/679, GDPR) — право на удаление",
  },
  UK: {
    en: "Article 17 of the UK GDPR and Section 47 of the Data Protection Act 2018 — Right to erasure",
    uk: "Стаття 17 UK GDPR та розділ 47 Data Protection Act 2018 — право на видалення",
    ru: "Статья 17 UK GDPR и раздел 47 Data Protection Act 2018 — право на удаление",
  },
  UA: {
    en: "Article 8 of the Law of Ukraine “On Personal Data Protection” No. 2297-VI — right to demand removal of personal data",
    uk: "Стаття 8 Закону України «Про захист персональних даних» №2297-VI — право вимагати видалення персональних даних",
    ru: "Статья 8 Закона Украины «О защите персональных данных» №2297-VI — право требовать удаления персональных данных",
  },
  US: {
    en: "California Consumer Privacy Act (CCPA), Cal. Civ. Code §1798.105 — Right to Delete",
    uk: "California Consumer Privacy Act (CCPA), Cal. Civ. Code §1798.105 — право на видалення",
    ru: "California Consumer Privacy Act (CCPA), Cal. Civ. Code §1798.105 — право на удаление",
  },
  RU: {
    en: "Article 14 of Federal Law No. 152-FZ “On Personal Data” — right to demand removal",
    uk: "Стаття 14 Федерального закону РФ №152-ФЗ «Про персональні дані» — право вимагати видалення",
    ru: "Статья 14 Федерального закона №152-ФЗ «О персональных данных» — право требовать удаления",
  },
  OTHER: {
    en: "Applicable national data protection law and the principles of the OECD Privacy Framework",
    uk: "Чинне національне законодавство про захист персональних даних та принципи OECD Privacy Framework",
    ru: "Применимое национальное законодательство о защите персональных данных и принципы OECD Privacy Framework",
  },
};

const RECIPIENT_LABELS: Record<RecipientType, { en: string; uk: string; ru: string }> = {
  website_admin: { en: "Website Administrator", uk: "Адміністратору сайту", ru: "Администратору сайта" },
  hosting_provider: { en: "Hosting Provider Abuse Team", uk: "Команді з порушень хостинг-провайдера", ru: "Команде по нарушениям хостинг-провайдера" },
  search_engine: { en: "Search Engine Removal Team", uk: "Команді видалення пошукової системи", ru: "Команде удаления поисковой системы" },
  social_platform: { en: "Platform Trust & Safety Team", uk: "Команді Trust & Safety платформи", ru: "Команде Trust & Safety платформы" },
  data_broker: { en: "Data Broker Privacy Officer", uk: "Офіцеру з конфіденційності data broker", ru: "Офицеру по конфиденциальности data broker" },
};

export function generateTakedownLetter(input: TakedownInput): string {
  const lang = input.language;
  const date = new Date().toISOString().slice(0, 10);
  const recipientLabel = RECIPIENT_LABELS[input.recipientType][lang];
  const legalBasis = LEGAL_BASES[input.jurisdiction][lang];
  const recipientLine = input.recipientName
    ? `${recipientLabel}: ${input.recipientName}`
    : recipientLabel;
  const requester = input.requesterName || (lang === "en" ? "Data Subject" : lang === "ru" ? "Субъект персональных данных" : "Суб'єкт персональних даних");
  const requesterContact = input.requesterEmail || "[ваш email]";
  const urlsBlock = input.urlsContainingData && input.urlsContainingData.length > 0
    ? "\n\n" + (lang === "en" ? "URLs containing the data:" : lang === "ru" ? "URL-адреса, содержащие данные:" : "URL-адреси, що містять дані:") + "\n" + input.urlsContainingData.map((u, i) => `${i + 1}. ${u}`).join("\n")
    : "";

  if (lang === "en") {
    return `Date: ${date}

To: ${recipientLine}
${input.recipientEmail ? `Email: ${input.recipientEmail}\n` : ""}
Subject: Formal Request for Erasure of Personal Data

Dear Data Protection Officer,

I am writing to formally request the erasure of personal data concerning me, in accordance with my rights under ${legalBasis}.

The personal data subject to this request is described as follows:

${input.dataDescription}${urlsBlock}

Pursuant to applicable data protection law, I hereby request that you:

1. Confirm receipt of this request within seven (7) calendar days.
2. Erase, delete, or otherwise render inaccessible all personal data identified above within thirty (30) calendar days, or such shorter period as required by applicable law.
3. Notify any third parties to whom you have disclosed the data of this erasure request, as required by Article 19 GDPR (or applicable equivalent).
4. Provide written confirmation upon completion of the erasure.

Please note that failure to comply with this request may result in:
- A formal complaint to the competent supervisory authority;
- A claim for compensation for any damage suffered;
- Public reporting of non-compliance.

I assert my identity as the data subject and am prepared to provide reasonable verification upon request, in line with Recital 64 GDPR.

Sincerely,

${requester}
Contact: ${requesterContact}

— Generated via DARKSHARE Takedown Assistant. This template is provided for informational purposes and does not constitute legal advice. Consult qualified counsel for jurisdiction-specific requirements.`;
  }

  if (lang === "ru") {
    return `Дата: ${date}

Кому: ${recipientLine}
${input.recipientEmail ? `Email: ${input.recipientEmail}\n` : ""}
Тема: Официальное требование об удалении персональных данных

Уважаемые ответственные лица,

Настоящим обращаюсь к Вам с официальным требованием об удалении моих персональных данных в соответствии с моими правами согласно ${legalBasis}.

Описание персональных данных, подлежащих удалению:

${input.dataDescription}${urlsBlock}

В соответствии с применимым законодательством о защите персональных данных, прошу:

1. Подтвердить получение настоящего требования в течение семи (7) календарных дней.
2. Удалить, стереть или иным образом сделать недоступными все указанные выше персональные данные в течение тридцати (30) календарных дней, или в более короткий срок, если это предписано применимым законом.
3. Уведомить третьих лиц, которым были переданы данные, об удалении (статья 19 GDPR или аналогичная норма).
4. Предоставить письменное подтверждение по завершении удаления.

Обращаю внимание, что невыполнение настоящего требования может повлечь:
- Подачу официальной жалобы в надзорный орган;
- Иск о возмещении причиненного ущерба;
- Публичное сообщение о неисполнении.

Подтверждаю, что являюсь субъектом персональных данных и готов(а) предоставить разумные средства верификации по запросу (Recital 64 GDPR).

С уважением,

${requester}
Контакт: ${requesterContact}

— Сгенерировано через DARKSHARE Takedown Assistant. Шаблон предоставлен в информационных целях и не является юридической консультацией. Для специфики юрисдикции обратитесь к квалифицированному юристу.`;
  }

  return `Дата: ${date}

Кому: ${recipientLine}
${input.recipientEmail ? `Email: ${input.recipientEmail}\n` : ""}
Тема: Офіційна вимога про видалення персональних даних

Шановні відповідальні особи,

Цим звертаюсь до Вас з офіційною вимогою про видалення моїх персональних даних відповідно до моїх прав згідно з ${legalBasis}.

Опис персональних даних, що підлягають видаленню:

${input.dataDescription}${urlsBlock}

Відповідно до чинного законодавства про захист персональних даних, прошу:

1. Підтвердити отримання цієї вимоги протягом семи (7) календарних днів.
2. Видалити, стерти або іншим чином зробити недоступними всі зазначені вище персональні дані протягом тридцяти (30) календарних днів, або у коротший термін, якщо це передбачено чинним законом.
3. Повідомити третіх осіб, яким було передано дані, про видалення (стаття 19 GDPR або аналогічна норма).
4. Надати письмове підтвердження по завершенні видалення.

Звертаю увагу, що невиконання цієї вимоги може спричинити:
- Подання офіційної скарги до наглядового органу;
- Позов про відшкодування завданої шкоди;
- Публічне повідомлення про невиконання.

Підтверджую, що я є суб'єктом персональних даних та готовий(а) надати розумні засоби верифікації на запит (Recital 64 GDPR).

З повагою,

${requester}
Контакт: ${requesterContact}

— Згенеровано через DARKSHARE Takedown Assistant. Шаблон надається в інформаційних цілях та не є юридичною консультацією. Для специфіки юрисдикції зверніться до кваліфікованого юриста.`;
}
