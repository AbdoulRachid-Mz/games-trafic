import React from "react";
import { Typography } from "@/components/ui/typography";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  MessageSquare, 
  Github, 
  Twitter, 
  Facebook,
  Globe
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Hero Section */}
      <section className="py-20 bg-muted/20 border-b relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="container max-w-6xl mx-auto px-4 relative">
          <div className="max-w-2xl">
            <Typography variant="h1" className="text-5xl font-extrabold mb-6 tracking-tight">
              Parlons de votre <span className="text-primary italic text-6xl">projet</span>.
            </Typography>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Que vous soyez un joueur passionné, un organisateur ambitieux ou un futur partenaire, notre équipe est là pour vous accompagner.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            
            {/* Contact Info */}
            <div className="space-y-12">
              <div className="space-y-8">
                <div className="flex gap-6 items-start group">
                  <div className="p-4 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-1">Email</h4>
                    <p className="text-muted-foreground italic">support@games-trafics.com</p>
                    <p className="text-xs text-muted-foreground mt-1 underline cursor-pointer">Nous répondons sous 24h</p>
                  </div>
                </div>

                <div className="flex gap-6 items-start group">
                  <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-1">WhatsApp & Social</h4>
                    <p className="text-muted-foreground italic">+225 00 00 00 00 00</p>
                    <div className="flex gap-4 mt-3">
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted"><Twitter className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted"><Facebook className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted"><Github className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 items-start group">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-1">Localisation</h4>
                    <p className="text-muted-foreground italic">Abidjan, Côte d'Ivoire</p>
                    <p className="text-xs text-muted-foreground mt-1 italic">Siège social Games-Trafics</p>
                  </div>
                </div>
              </div>

              {/* Badge Section */}
              <div className="p-8 rounded-[2.5rem] border bg-gradient-to-br from-muted/50 to-background shadow-inner">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Présence Globale</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 italic">
                  Bien que basés en Côte d'Ivoire, nous opérons sur toute l'Afrique de l'Ouest et centrale pour dynamiser l'e-sport francophone.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Côte d'Ivoire", "Sénégal", "Bénin", "Togo", "Cameroun"].map(c => (
                    <span key={c} className="px-3 py-1 rounded-full bg-background border text-[10px] font-bold uppercase tracking-tighter opacity-70 cursor-default">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:p-10 p-6 rounded-[3rem] border bg-card shadow-2xl relative">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl animate-pulse" />
              
              <div className="mb-10">
                <h2 className="text-3xl font-extrabold mb-2 tracking-tight">Envoyez un message</h2>
                <p className="text-muted-foreground italic">Décrivez votre demande et nous reviendrons vers vous rapidement.</p>
              </div>

              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">Nom complet</label>
                    <Input placeholder="John Doe" className="rounded-xl h-12 bg-muted/30 border-muted-foreground/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">Email</label>
                    <Input type="email" placeholder="john@example.com" className="rounded-xl h-12 bg-muted/30 border-muted-foreground/20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1">Sujet</label>
                  <Input placeholder="Partenariat, Bug, Question..." className="rounded-xl h-12 bg-muted/30 border-muted-foreground/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1">Votre message</label>
                  <Textarea 
                    placeholder="Comment pouvons-nous vous aider ?" 
                    className="rounded-2xl min-h-[150px] bg-muted/30 border-muted-foreground/20 italic" 
                  />
                </div>
                <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  <Send className="w-5 h-5 mr-3" />
                  Envoyer le message
                </Button>
              </form>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
