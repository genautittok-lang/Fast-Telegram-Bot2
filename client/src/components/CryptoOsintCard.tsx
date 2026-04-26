import { Wallet, Coins, ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, Activity, FileCode2, Hash, ArrowDownLeft, ArrowUpRight, Skull, Zap } from "lucide-react";
import { SiBitcoin, SiEthereum, SiSolana } from "react-icons/si";
import { useTranslation } from "@/lib/i18n";

type Lang = "en" | "uk" | "ru" | "es" | "de";
const SUPPORTED: Lang[] = ["en", "uk", "ru", "es", "de"];

const labels: Record<Lang, Record<string, string>> = {
  en: {
    title: "Crypto Wallet Trace",
    subtitle: "Chain · balance · activity · sanctions · contract status",
    chain: "Chain",
    balance: "Balance",
    txCount: "Transactions",
    tokenCount: "Tokens",
    contract: "Smart contract",
    verified: "Verified",
    unverified: "Unverified",
    eoa: "EOA wallet",
    sanctioned: "SANCTIONED ADDRESS",
    burnAddress: "Burn / null address",
    vanity: "Vanity address",
    totalIn: "Total received",
    totalSent: "Total sent",
    riskFlags: "Risk indicators",
    noFlags: "No risk indicators detected",
    sources: "Data sources",
    topTokens: "Top tokens",
    address: "Address",
    unknownChain: "Unknown chain",
  },
  uk: {
    title: "Трасування крипто-гаманця",
    subtitle: "Мережа · баланс · активність · санкції · статус контракту",
    chain: "Мережа",
    balance: "Баланс",
    txCount: "Транзакції",
    tokenCount: "Токени",
    contract: "Smart contract",
    verified: "Верифіковано",
    unverified: "Не верифіковано",
    eoa: "EOA гаманець",
    sanctioned: "АДРЕСА ПІД САНКЦІЯМИ",
    burnAddress: "Burn / null адреса",
    vanity: "Vanity адреса",
    totalIn: "Всього отримано",
    totalSent: "Всього відправлено",
    riskFlags: "Індикатори ризику",
    noFlags: "Індикатори ризику не виявлено",
    sources: "Джерела даних",
    topTokens: "Топ токени",
    address: "Адреса",
    unknownChain: "Невідома мережа",
  },
  ru: {
    title: "Трассировка крипто-кошелька",
    subtitle: "Сеть · баланс · активность · санкции · статус контракта",
    chain: "Сеть",
    balance: "Баланс",
    txCount: "Транзакции",
    tokenCount: "Токены",
    contract: "Smart contract",
    verified: "Верифицирован",
    unverified: "Не верифицирован",
    eoa: "EOA кошелёк",
    sanctioned: "АДРЕС ПОД САНКЦИЯМИ",
    burnAddress: "Burn / null адрес",
    vanity: "Vanity адрес",
    totalIn: "Всего получено",
    totalSent: "Всего отправлено",
    riskFlags: "Индикаторы риска",
    noFlags: "Индикаторы риска не обнаружены",
    sources: "Источники данных",
    topTokens: "Топ токены",
    address: "Адрес",
    unknownChain: "Неизвестная сеть",
  },
  es: {
    title: "Rastreo de billetera cripto",
    subtitle: "Cadena · saldo · actividad · sanciones · estado del contrato",
    chain: "Cadena",
    balance: "Saldo",
    txCount: "Transacciones",
    tokenCount: "Tokens",
    contract: "Smart contract",
    verified: "Verificado",
    unverified: "No verificado",
    eoa: "Billetera EOA",
    sanctioned: "DIRECCIÓN SANCIONADA",
    burnAddress: "Dirección burn / null",
    vanity: "Dirección vanity",
    totalIn: "Total recibido",
    totalSent: "Total enviado",
    riskFlags: "Indicadores de riesgo",
    noFlags: "No se detectaron riesgos",
    sources: "Fuentes de datos",
    topTokens: "Top tokens",
    address: "Dirección",
    unknownChain: "Cadena desconocida",
  },
  de: {
    title: "Krypto-Wallet-Verfolgung",
    subtitle: "Chain · Guthaben · Aktivität · Sanktionen · Contract-Status",
    chain: "Chain",
    balance: "Guthaben",
    txCount: "Transaktionen",
    tokenCount: "Tokens",
    contract: "Smart Contract",
    verified: "Verifiziert",
    unverified: "Nicht verifiziert",
    eoa: "EOA-Wallet",
    sanctioned: "SANKTIONIERTE ADRESSE",
    burnAddress: "Burn-/Null-Adresse",
    vanity: "Vanity-Adresse",
    totalIn: "Empfangen gesamt",
    totalSent: "Gesendet gesamt",
    riskFlags: "Risikoindikatoren",
    noFlags: "Keine Risikoindikatoren erkannt",
    sources: "Datenquellen",
    topTokens: "Top-Tokens",
    address: "Adresse",
    unknownChain: "Unbekannte Chain",
  },
};

interface WalletData {
  chain?: string;
  hasChecksum?: boolean;
  sanctioned?: boolean;
  sanctionReason?: string;
  possibleBurnAddress?: boolean;
  isVanity?: boolean;
  isContract?: boolean;
  isVerified?: boolean;
  txCount?: number;
  tokenTransfers?: number;
  balanceETH?: string;
  balanceBTC?: string;
  ethTxCount?: number;
  totalInETH?: string | null;
  totalReceived?: string;
  totalSent?: string;
  tokenCount?: number;
  topTokens?: Array<{ name: string; symbol: string; balance: string }>;
}

interface Props {
  data: WalletData;
  target: string;
  findings?: string[];
  sources?: string[];
  lang?: string;
}

export default function CryptoOsintCard({ data, target, findings = [], sources = [], lang: langProp }: Props) {
  const { lang: ctxLang } = useTranslation();
  const lang = langProp || ctxLang;
  const safeLang: Lang = SUPPORTED.includes(lang as Lang) ? (lang as Lang) : "en";
  const t = labels[safeLang];

  const rawChain = (data.chain || "").toLowerCase();
  const isEvm = rawChain.includes("eth") || rawChain.includes("evm");
  const isBtc = rawChain.includes("bitcoin") || rawChain.includes("btc");
  const isSol = rawChain.includes("solana") || rawChain.includes("sol");
  const isTron = rawChain.includes("tron") || rawChain.includes("trx");
  const chainKnown = isEvm || isBtc || isSol || isTron;
  const chainLabel = chainKnown ? (data.chain || "") : t.unknownChain;

  const ChainIcon = isBtc ? SiBitcoin : isEvm ? SiEthereum : isSol ? SiSolana : isTron ? Zap : Coins;
  const chainColor = isBtc ? "text-orange-400" :
                     isEvm ? "text-cyan-300" :
                     isSol ? "text-purple-400" :
                     isTron ? "text-red-400" : "text-zinc-400";
  const chainBadgeBorder = isBtc ? "border-orange-500/40 bg-orange-500/10" :
                           isEvm ? "border-cyan-500/40 bg-cyan-500/10" :
                           isSol ? "border-purple-500/40 bg-purple-500/10" :
                           isTron ? "border-red-500/40 bg-red-500/10" :
                           "border-zinc-700 bg-zinc-800/40";

  const balance = data.balanceBTC ? `${data.balanceBTC} BTC` :
                  data.balanceETH ? `${data.balanceETH} ETH` : "—";

  const txCountValue = data.txCount != null ? data.txCount : (data.ethTxCount != null ? data.ethTxCount : null);

  return (
    <div
      data-testid="card-crypto-osint"
      className={`relative rounded-2xl border ${data.sanctioned ? "border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.25)]" : "border-cyan-500/30 shadow-[0_0_40px_rgba(34,211,238,0.15)]"} bg-gradient-to-br from-zinc-950 via-zinc-900/80 to-zinc-950 backdrop-blur-xl overflow-hidden`}
    >
      <div className={`absolute inset-0 ${data.sanctioned ? "bg-gradient-to-br from-red-500/[0.06] via-transparent to-red-500/[0.03]" : "bg-gradient-to-br from-cyan-500/[0.04] via-transparent to-cyan-500/[0.02]"} pointer-events-none`} />
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px bg-gradient-to-r from-transparent ${data.sanctioned ? "via-red-400" : "via-cyan-400"} to-transparent`} />

      <div className="relative p-4 lg:p-5">
        {data.sanctioned && (
          <div role="alert" aria-live="assertive" data-testid="banner-sanctioned" className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/40 flex items-start gap-2.5">
            <Skull className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-red-300 uppercase tracking-wider">{t.sanctioned}</div>
              {data.sanctionReason && (
                <div className="text-[11px] text-red-200/90 mt-0.5">{data.sanctionReason}</div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 mb-4">
          <div className={`w-11 h-11 rounded-xl ${data.sanctioned ? "bg-gradient-to-br from-red-500/30 to-red-700/10 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]" : "bg-gradient-to-br from-cyan-500/30 to-cyan-700/10 border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.3)]"} border flex items-center justify-center flex-shrink-0`}>
            <Wallet className={`w-5 h-5 ${data.sanctioned ? "text-red-300" : "text-cyan-300"}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm lg:text-base font-display font-bold text-cyan-300 leading-tight">
              {t.title}
            </h3>
            <p className="text-[11px] lg:text-xs text-zinc-400 leading-snug mt-0.5">{t.subtitle}</p>
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900/60 border border-zinc-800 max-w-full">
              <Hash className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              <span className="text-[10px] font-mono text-zinc-300 truncate" data-testid="text-wallet-address">{target}</span>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0 ${chainColor} ${chainBadgeBorder}`} data-testid="badge-chain">
            <ChainIcon className="w-3 h-3" />
            <span>{chainLabel}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          <DataCell icon={Coins} label={t.balance} value={balance} highlight />
          <DataCell icon={Activity} label={t.txCount} value={txCountValue != null ? String(txCountValue) : "—"} />
          <DataCell
            icon={FileCode2}
            label={t.contract}
            value={data.isContract ? (data.isVerified ? t.verified : t.unverified) : t.eoa}
            highlight={data.isContract && !data.isVerified}
          />
          <DataCell icon={Coins} label={t.tokenCount} value={data.tokenCount != null ? String(data.tokenCount) : "—"} />
        </div>

        {(data.totalReceived || data.totalSent || data.totalInETH) && (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-cyan-500/[0.06] to-transparent border border-cyan-500/20 space-y-2">
            {(data.totalReceived || data.totalInETH) && (
              <Row icon={ArrowDownLeft} label={t.totalIn} value={
                <span className="font-mono text-cyan-200">{data.totalReceived ? `${data.totalReceived} BTC` : `${data.totalInETH} ETH`}</span>
              } />
            )}
            {data.totalSent && (
              <Row icon={ArrowUpRight} label={t.totalSent} value={
                <span className="font-mono text-zinc-300">{data.totalSent} BTC</span>
              } />
            )}
          </div>
        )}

        {data.topTokens && data.topTokens.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-3.5 h-3.5 text-cyan-300" />
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">{t.topTokens}</h4>
            </div>
            <div className="space-y-1.5">
              {data.topTokens.slice(0, 5).map((tok, i) => (
                <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/60 text-[11px]">
                  <span className="text-cyan-400 font-mono font-semibold flex-shrink-0">{tok.symbol}</span>
                  <span className="text-zinc-400 truncate flex-1">{tok.name}</span>
                  <span className="text-zinc-200 font-mono text-[10px]">{tok.balance}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-2">
            {findings.length > 0 ? <ShieldAlert className="w-3.5 h-3.5 text-cyan-300" /> : <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />}
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">{t.riskFlags}</h4>
          </div>
          {findings.length > 0 ? (
            <div className="space-y-1.5">
              {findings.slice(0, 10).map((f, i) => {
                const isCritical = /КРИТИЧНО|CRITICAL|sanction|САНКЦ/i.test(f);
                return (
                  <div
                    key={i}
                    data-testid={`finding-crypto-${i}`}
                    className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] ${isCritical ? "bg-red-500/10 border-red-500/30 text-red-200" : "bg-zinc-900/50 border-zinc-800/60 text-zinc-300"}`}
                  >
                    {isCritical && <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />}
                    <span className="leading-snug">{f}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-[11px] text-cyan-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>{t.noFlags}</span>
            </div>
          )}
        </div>

        {sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider mr-1">{t.sources}:</span>
            {sources.map((s, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900/60 border border-zinc-800 text-zinc-400">{s}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DataCell({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`p-2.5 rounded-lg border ${highlight ? "bg-cyan-500/10 border-cyan-500/30" : "bg-zinc-900/50 border-zinc-800/60"}`}>
      <div className="flex items-center gap-1 mb-1">
        <Icon className={`w-3 h-3 ${highlight ? "text-cyan-300" : "text-cyan-400"}`} />
        <span className="text-[9px] uppercase tracking-wider text-zinc-500">{label}</span>
      </div>
      <div className={`text-xs ${highlight ? "text-cyan-100" : "text-zinc-200"} font-medium truncate`}>{value}</div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <Icon className="w-3 h-3 text-cyan-400 flex-shrink-0" />
      <span className="text-zinc-500 uppercase text-[9px] tracking-wider">{label}</span>
      <span className="text-zinc-200 truncate flex-1 text-right">{value}</span>
    </div>
  );
}
