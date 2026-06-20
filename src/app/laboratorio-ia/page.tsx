
"use client";

import { MainLayout } from "@/components/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, MessageCircle, UserSquare, Camera } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/context/analytics-context";

const tools = [
    {
        name: "Análise de Foto de Perfil",
        description: "Descubra se sua foto de perfil está otimizada para o sucesso. Receba feedback sobre iluminação, pose e mais.",
        icon: Camera,
        href: "/analise-foto",
        cta: "Analisar Foto",
        eventName: "click_ai_tool_photo"
    },
    {
        name: "Analista de Bio",
        description: "Sua bio é a sua vitrine. Deixe nossa IA analisar e sugerir uma descrição que gera mais matches.",
        icon: UserSquare,
        href: "/analise-bio",
        cta: "Analisar Bio",
        eventName: "click_ai_tool_bio"
    },
    {
        name: "Analista de Conversa",
        description: "Envie um print da sua conversa e receba uma análise da IA com sugestões para sua próxima mensagem.",
        icon: MessageCircle,
        href: "/analise-conversa",
        cta: "Analisar Conversa",
        eventName: "click_ai_tool_conversation"
    },
]

export default function LaboratorioIaPage() {
  const { trackEvent } = useAnalytics();

  return (
    <MainLayout activeTab="grupos">
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8 pb-28">
            <header className="space-y-2">
                <div className="flex items-center gap-3">
                     <Sparkles className="h-10 w-10 text-primary" />
                     <h1 className="text-4xl font-bold">Analistas de IA</h1>
                </div>
                <p className="text-lg text-muted-foreground">
                    Use nossas ferramentas de inteligência artificial para otimizar seu perfil e suas conversas, aumentando suas chances de sucesso.
                </p>
            </header>

            <div className="grid gap-6 md:grid-cols-1">
                {tools.map((tool) => (
                    <Card key={tool.name} className="flex flex-col">
                        <CardHeader className="flex-row items-start gap-4">
                            <div className="bg-primary/10 p-3 rounded-lg">
                                <tool.icon className="h-8 w-8 text-primary" />
                            </div>
                            <div className="flex-1">
                                <CardTitle>{tool.name}</CardTitle>
                                <CardDescription>{tool.description}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex items-end">
                            <Link href={tool.href} className="w-full" onClick={() => trackEvent(tool.eventName)}>
                                <Button className="w-full">
                                    {tool.cta}
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      </main>
    </MainLayout>
  );
}

    