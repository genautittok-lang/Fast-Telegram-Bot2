import { Shield, FileText, ScrollText, ArrowLeft, Lock, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/PageLayout";
import { MobileMenu } from "@/components/MobileMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Footer } from "@/components/Footer";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

function PrivacyContent() {
  const [, setLocation] = useLocation();

  const sections = [
    {
      title: "1. Information We Collect",
      content: "We collect the following types of information when you use the DARKSHARE platform:\n\n" +
        "\u2022 Account Information: Telegram user ID, username, first name, and profile photo URL when you authenticate via Telegram. Google account email and profile information when you authenticate via Google.\n\n" +
        "\u2022 Usage Data: Search queries, investigation targets (IP addresses, domains, usernames, blockchain addresses), timestamps, and interaction patterns with the platform.\n\n" +
        "\u2022 Technical Data: Browser type, device information, IP address, and session identifiers for security and analytics purposes.\n\n" +
        "\u2022 Payment Data: When you subscribe to a paid plan, payment processing is handled by Stripe. We do not store your full credit card details on our servers."
    },
    {
      title: "2. How We Use Information",
      content: "Your information is used for the following purposes:\n\n" +
        "\u2022 Providing and operating the OSINT analysis service, including generating risk scores, threat assessments, and intelligence reports.\n\n" +
        "\u2022 Authenticating your identity and managing your account and subscription.\n\n" +
        "\u2022 Maintaining search history and monitoring alerts as requested by you.\n\n" +
        "\u2022 Improving the accuracy of our analysis algorithms and platform features.\n\n" +
        "\u2022 Communicating important service updates, security alerts, and billing notifications.\n\n" +
        "\u2022 Detecting and preventing fraudulent or unauthorized use of the platform.\n\n" +
        "\u2022 Complying with legal obligations and responding to lawful requests from authorities."
    },
    {
      title: "3. Data Storage & Security",
      content: "We implement industry-standard security measures to protect your data:\n\n" +
        "\u2022 All data is stored in encrypted PostgreSQL databases with regular backups.\n\n" +
        "\u2022 Communication between your browser and our servers is encrypted using TLS/SSL.\n\n" +
        "\u2022 Session management uses secure, HTTP-only cookies to prevent cross-site scripting attacks.\n\n" +
        "\u2022 API keys and sensitive credentials are stored using encrypted secret management systems.\n\n" +
        "\u2022 Access to production systems is restricted and monitored. While we take extensive precautions, no method of electronic transmission or storage is 100% secure."
    },
    {
      title: "4. Third-Party Services",
      content: "DARKSHARE integrates with the following third-party services to provide OSINT analysis. Each service has its own privacy policy:\n\n" +
        "\u2022 ip-api.com \u2014 IP geolocation and ISP lookup data.\n\n" +
        "\u2022 Shodan \u2014 Internet-connected device scanning and vulnerability intelligence.\n\n" +
        "\u2022 GreyNoise \u2014 Internet background noise and threat intelligence data.\n\n" +
        "\u2022 AbuseIPDB \u2014 IP address abuse and malicious activity reports.\n\n" +
        "\u2022 Blockchain APIs \u2014 Cryptocurrency address analysis and transaction lookups (Bitcoin, Ethereum, and other networks).\n\n" +
        "\u2022 Stripe \u2014 Secure payment processing for subscriptions.\n\n" +
        "\u2022 OpenAI \u2014 AI-powered analysis and threat assessment generation.\n\n" +
        "\u2022 Telegram Bot API \u2014 User authentication and bot interaction services.\n\n" +
        "When you perform an OSINT query, relevant data may be sent to these third-party services to generate results. We only share the minimum information necessary to fulfill your request."
    },
    {
      title: "5. Telegram Data",
      content: "When you authenticate via our Telegram bot or use Telegram login:\n\n" +
        "\u2022 We receive your Telegram user ID, username, first name, and profile photo URL.\n\n" +
        "\u2022 We do not access your Telegram messages, contacts, or any private conversations.\n\n" +
        "\u2022 Bot interactions (commands, queries) are processed in real-time and investigation results are stored in your account history.\n\n" +
        "\u2022 You can revoke Telegram access at any time by blocking the bot and deleting your account."
    },
    {
      title: "6. Cookies & Sessions",
      content: "We use the following types of cookies and session data:\n\n" +
        "\u2022 Authentication Cookies: Secure, HTTP-only session cookies to maintain your logged-in state. These are essential for the Service to function.\n\n" +
        "\u2022 Preference Cookies: Local storage for language preference and UI settings (theme, layout preferences).\n\n" +
        "\u2022 We do NOT use third-party advertising or tracking cookies.\n\n" +
        "\u2022 You can clear cookies at any time through your browser settings, which will require you to log in again."
    },
    {
      title: "7. Data Retention",
      content: "We retain your data according to the following policies:\n\n" +
        "\u2022 Account Data: Retained for the duration of your account and up to 30 days after account deletion.\n\n" +
        "\u2022 Search History: Retained for 12 months, after which it is automatically archived or deleted.\n\n" +
        "\u2022 Monitoring Alerts: Active alerts are retained until you deactivate them. Historical alert data is retained for 6 months.\n\n" +
        "\u2022 Payment Records: Retained for 7 years as required by financial regulations.\n\n" +
        "\u2022 Server Logs: Retained for 90 days for security and debugging purposes."
    },
    {
      title: "8. User Rights",
      content: "Depending on your jurisdiction, you may have the following rights regarding your personal data:\n\n" +
        "\u2022 Right to Access: Request a copy of all personal data we hold about you.\n\n" +
        "\u2022 Right to Deletion: Request deletion of your account and associated data. You can initiate this from your account settings or by contacting us.\n\n" +
        "\u2022 Right to Export: Download your search history and account data in a machine-readable format.\n\n" +
        "\u2022 Right to Rectification: Update or correct inaccurate personal information through your account settings.\n\n" +
        "\u2022 Right to Object: Object to certain types of data processing.\n\n" +
        "\u2022 Right to Restrict Processing: Request limitation of how we process your data.\n\n" +
        "To exercise any of these rights, please contact us at darkshare.store@gmail.com. We will respond to requests within 30 days."
    },
    {
      title: "9. Children's Privacy",
      content: "The DARKSHARE platform is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from minors. If we become aware that a user is under 18, we will take steps to promptly delete their account and associated data. If you believe a minor has provided us with personal information, please contact us immediately at darkshare.store@gmail.com."
    },
    {
      title: "10. International Data Transfers",
      content: "Your data may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. By using the Service, you consent to such transfers. We take appropriate safeguards to ensure your data remains protected in accordance with this Privacy Policy."
    },
    {
      title: "11. Changes to This Policy",
      content: "We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. Material changes will be communicated through the Service interface or via the email associated with your account. Your continued use of the Service after any modifications indicates your acceptance of the updated Privacy Policy."
    },
    {
      title: "12. Contact Information",
      content: "For questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:\n\n" +
        "\u2022 Email: darkshare.store@gmail.com\n\n" +
        "\u2022 Telegram: @DarkShare1Bot\n\n" +
        "\u2022 Support Page: Available through the DARKSHARE platform"
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-5">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          data-testid="button-back-privacy"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1" />
      </div>

      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/10 flex items-center justify-center border border-primary/20">
          <Eye className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold" data-testid="text-privacy-title">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm">Last updated: February 2025</p>
      </div>

      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your privacy is important to us. This Privacy Policy explains how DARKSHARE collects, uses, stores, and protects your information when you use our OSINT platform and related services.
            </p>
          </div>
        </CardContent>
      </Card>

      {sections.map((section, index) => (
        <Card key={index} className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 flex-wrap">
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line" data-testid={`text-privacy-section-${index + 1}`}>
              {section.content}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Privacy() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <Shield className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <PageLayout>
        <PrivacyContent />
      </PageLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="relative z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer" onClick={() => setLocation("/")} data-testid="link-home-brand-privacy">
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
      <div className="flex-1">
        <PrivacyContent />
      </div>
      <Footer />
    </div>
  );
}
