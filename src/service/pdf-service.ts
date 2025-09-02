import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import z from "zod";

export async function pdfService(pdfDataUrl: string, quantity: number) {
    const result = await generateObject({
    model: openai("gpt-4o"),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "file",
            data: pdfDataUrl,
            mediaType: "application/pdf"
          },
          {
            type: "text", 
            text: `Você é um especialista em criação de flashcards educacionais. analise este PDF e gere ${quantity} flashcards educacionais de alta qualidade baseados no conteúdo. Extraia conceitos principais, definições importantes e informações essenciais.`
          }
        ]
      }
    ],
    schema: z.object({
      deck: z.array(
        z.object({
          frente: z.string(),
          verso: z.string(),
        })
      ),
    }),
  });
  
  return result.object.deck;
}