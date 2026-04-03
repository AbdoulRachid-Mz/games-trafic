import React from "react";
import { Typography } from "@/components/ui/typography";
import { 
  Search, 
  LifeBuoy, 
  MessageCircle, 
  FileQuestion, 
  ShieldCheck, 
  CreditCard, 
  Trophy,
  ArrowRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

const faqs = [
  {
    category: "Paiements & Wallet",
    icon: <CreditCard className="w-5 h-5" />,
    questions: [
      { q: "Comment recharger mon wallet GTC ?", a: "Vous pouvez recharger votre wallet via Mobile Money (Orange, MTN, Moov) ou carte bancaire dans la section Portefeuille." },
      { q: "Quels sont les frais de retrait ?", a: "Les frais de retrait varient entre 1% et 2% selon le mode de retrait choisi." },
    ]
  },
  {
    category: "Tournois",
    icon: <Trophy className="w-5 h-5" />,
    questions: [
      { q: "Comment m'inscrire à un tournoi ?", a: "Allez sur la page du tournoi, cliquez sur 'S'inscrire' et suivez les étapes de configuration de votre équipe." },
      { q: "Que faire en cas de litige sur un match ?", a: "Utilisez le bouton 'Signaler un problème' sur la page du match pour qu'un modérateur intervienne." },
    ]
  },
  {
    category: "Compte & Sécurité",
    icon: <ShieldCheck className="w-5 h-5" />,
    questions: [
      { q: "Mon compte est bloqué, que faire ?", a: "Contactez notre support technique via le formulaire de contact en précisant votre pseudo et l'adresse email associée." },
    ]
  }
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden border-b bg-muted/30">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:40px_40px]" />
        <div className="container relative max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
            <LifeBuoy className="w-3.5 h-3.5" />
            Centre d'assistance
          </div>
          <Typography variant="h1" className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
            Comment pouvons-nous vous <span className="text-primary italic">aider</span> ?
          </Typography>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Recherchez dans notre base de connaissances ou contactez notre équipe de support.
          </p>
          <div className="max-w-xl mx-auto relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Rechercher une question, un article..." 
              className="pl-12 h-14 rounded-2xl shadow-lg border-muted bg-background text-lg"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Quick Links */}
            <div className="md:col-span-1 space-y-6">
              <div className="p-6 rounded-3xl border bg-card shadow-sm hover:shadow-md transition-all group">
                <MessageCircle className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Support Direct</h3>
                <p className="text-muted-foreground text-sm mb-4">Besoin d'une réponse rapide ? Échangez avec nous sur WhatsApp ou Discord.</p>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="w-full justify-between rounded-xl group-hover:border-primary/50" asChild>
                    <Link href="/contact">
                      WhatsApp <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="p-6 rounded-3xl border bg-primary text-primary-foreground shadow-lg group overflow-hidden relative">
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <FileQuestion className="w-32 h-32" />
                </div>
                <h3 className="text-xl font-bold mb-2">Documentation</h3>
                <p className="text-primary-foreground/80 text-sm mb-6">Explorez nos guides détaillés sur le fonctionnement de la plateforme.</p>
                <Button variant="secondary" className="w-full rounded-xl" asChild>
                  <Link href="/docs">Consulter les docs</Link>
                </Button>
              </div>
            </div>

            {/* FAQs */}
            <div className="md:col-span-2 space-y-12">
              {faqs.map((category) => (
                <div key={category.category} className="space-y-6">
                  <div className="flex items-center gap-3 border-b pb-4">
                    <div className="p-2 rounded-lg bg-muted text-primary">{category.icon}</div>
                    <h2 className="text-2xl font-bold tracking-tight">{category.category}</h2>
                  </div>
                  <div className="grid gap-4">
                    {category.questions.map((faq, i) => (
                      <div key={i} className="p-6 rounded-2xl border bg-card hover:bg-muted/30 transition-colors group">
                        <h4 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{faq.q}</h4>
                        <p className="text-muted-foreground leading-relaxed italic">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer Support */}
      <section className="py-20 bg-muted/30 border-t">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <Typography variant="h2" className="text-3xl font-bold mb-6">Vous ne trouvez pas votre bonheur ?</Typography>
          <p className="text-muted-foreground mb-10">Notre équipe est disponible 7j/7 pour répondre à vos questions les plus complexes.</p>
          <Link href="/contact">
            <Button size="lg" className="rounded-full px-8 h-12 text-lg shadow-xl hover:scale-105 transition-transform">
              Contactez-nous maintenant
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
