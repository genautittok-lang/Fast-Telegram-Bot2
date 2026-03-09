import { Shield, FileText, ScrollText, ArrowLeft, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/PageLayout";
import { MobileMenu } from "@/components/MobileMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Footer } from "@/components/Footer";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

function TermsContent() {
  const [, setLocation] = useLocation();

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: "By accessing or using the DARKSHARE OSINT platform (\"Service\"), you agree to be bound by these Terms of Service (\"Terms\"). If you do not agree to these Terms, you must not access or use the Service. These Terms constitute a legally binding agreement between you and DARKSHARE."
    },
    {
      title: "2. Service Description",
      content: "DARKSHARE provides an Open Source Intelligence (OSINT) analysis platform that enables users to perform security research, risk scoring, and generate intelligence reports. The Service includes IP address analysis, domain reconnaissance, blockchain address lookups, Telegram user investigations, and related cybersecurity intelligence tools. All data is gathered from publicly available sources."
    },
    {
      title: "3. Acceptable Use Policy",
      content: "The Service is provided exclusively for legitimate purposes including educational research, cybersecurity analysis, threat intelligence, security auditing, and authorized penetration testing. You agree NOT to use the Service for: (a) any illegal activities; (b) harassment, stalking, or targeting individuals; (c) unauthorized surveillance or privacy violations; (d) any activity that violates applicable local, national, or international law; (e) competitive intelligence gathering against DARKSHARE; (f) automated scraping or bulk data extraction without authorization. Violation of this policy may result in immediate account termination."
    },
    {
      title: "4. User Responsibilities",
      content: "You are solely responsible for: (a) maintaining the confidentiality of your account credentials; (b) all activities that occur under your account; (c) ensuring your use of the Service complies with all applicable laws and regulations; (d) obtaining any necessary permissions or authorizations before conducting OSINT investigations; (e) the accuracy of information you provide to us. You must be at least 18 years of age to use this Service."
    },
    {
      title: "5. Data Accuracy Disclaimer",
      content: "DARKSHARE aggregates data from multiple public sources and third-party APIs. While we strive for accuracy, we make NO WARRANTY regarding the completeness, accuracy, reliability, or timeliness of any information provided through the Service. OSINT data may be outdated, incomplete, or inaccurate. Risk scores and threat assessments are algorithmic estimations and should not be the sole basis for security decisions. Users should independently verify all critical information."
    },
    {
      title: "6. Payment & Refund Policy",
      content: "Certain features of the Service require a paid subscription (PRO or Enterprise tier). All payments are processed securely through Stripe. Subscription fees are billed in advance on a recurring basis. You may cancel your subscription at any time, and cancellation will take effect at the end of the current billing period. Refunds are generally not provided for partial billing periods. In cases of Service unavailability exceeding 48 hours, pro-rata credits may be issued at our discretion."
    },
    {
      title: "7. Account Termination",
      content: "We reserve the right to suspend or terminate your account at any time, with or without notice, for conduct that we determine, in our sole discretion: (a) violates these Terms; (b) is harmful to other users, third parties, or the Service; (c) constitutes illegal activity. Upon termination, your right to access the Service will immediately cease. You may also delete your account at any time through the account settings page."
    },
    {
      title: "8. Intellectual Property",
      content: "The Service, including its original content, features, functionality, design, and branding, is owned by DARKSHARE and is protected by international copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works of any part of the Service without our express written permission. OSINT reports generated through the Service may be used by you for your legitimate purposes, but the underlying algorithms and methodologies remain our proprietary property."
    },
    {
      title: "9. Limitation of Liability",
      content: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, DARKSHARE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU TO DARKSHARE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF CERTAIN WARRANTIES OR LIMITATION OF LIABILITY, SO SOME OF THE ABOVE MAY NOT APPLY TO YOU."
    },
    {
      title: "10. Indemnification",
      content: "You agree to indemnify, defend, and hold harmless DARKSHARE, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including reasonable attorneys' fees) arising out of or related to: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any rights of another party; (d) any OSINT investigation conducted using your account."
    },
    {
      title: "11. Changes to Terms",
      content: "We reserve the right to modify these Terms at any time. Material changes will be communicated through the Service interface or via email. Your continued use of the Service after such modifications constitutes your acceptance of the revised Terms. We encourage you to review these Terms periodically."
    },
    {
      title: "12. Governing Law",
      content: "These Terms shall be governed by and construed in accordance with applicable international laws. Any disputes arising under these Terms shall be resolved through binding arbitration, unless otherwise required by applicable law."
    },
    {
      title: "13. Contact Information",
      content: "For questions about these Terms of Service, please contact us at darkshare.store@gmail.com or through our Telegram bot @DarkShare1Bot."
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-5">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          data-testid="button-back-terms"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1" />
      </div>

      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/10 flex items-center justify-center border border-primary/20">
          <ScrollText className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold" data-testid="text-terms-title">Terms of Service</h1>
        <p className="text-muted-foreground text-sm">Last updated: February 2025</p>
      </div>

      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Please read these Terms of Service carefully before using the DARKSHARE OSINT platform. By using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms.
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
            <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-terms-section-${index + 1}`}>
              {section.content}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Terms() {
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
        <TermsContent />
      </PageLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="relative z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer" onClick={() => setLocation("/")} data-testid="link-home-brand-terms">
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
        <TermsContent />
      </div>
      <Footer />
    </div>
  );
}
