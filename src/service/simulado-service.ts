import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import z from "zod";

interface Flashcard {
  frente: string;
  verso: string;
}

interface FlashcardDeck {
  deck: Flashcard[];
}


interface QuestaoSimulado {
  pergunta: string;
  alternativas: string[];
  respostaCorreta: number; 
  explicacao: string;
  topico: string;
}

export async function simuladoService(
  flashcardDeck: FlashcardDeck, 
): Promise<QuestaoSimulado[]> {
  
  const flashcardsText = flashcardDeck.deck
    .map((card, index) => `Flashcard ${index + 1}:\nFrente: ${card.frente}\nVerso: ${card.verso}`)
    .join('\n\n');

  const result = await generateObject({
    model: openai("gpt-4o"),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Você é um especialista em criação de simulados educacionais. Com base nos flashcards fornecidos abaixo, crie 15 questões de múltipla escolha para um simulado.

Flashcards disponíveis:
${flashcardsText}

Instruções:
- Crie questões variadas que testem diferentes níveis de conhecimento
- Cada questão deve ter 5 alternativas (A, B, C, D, E)
- Inclua uma explicação detalhada para cada resposta
- Varie o tipo de questão: conceitual, aplicação, análise
- Identifique o tópico principal de cada questão`
          }
        ]
      }
    ],
    schema: z.object({
      simulado: z.array(
        z.object({
          pergunta: z.string().describe("A pergunta da questão"),
          alternativas: z.array(z.string()).length(5).describe("Array com exatamente 5 alternativas"),
          respostaCorreta: z.number().min(0).max(4).describe("Índice da resposta correta (0 a 4)"),
          explicacao: z.string().describe("Explicação detalhada da resposta correta"),
          topico: z.string().describe("Tópico principal da questão")
        })
      )
    })
  });
  
  return result.object.simulado;
}

