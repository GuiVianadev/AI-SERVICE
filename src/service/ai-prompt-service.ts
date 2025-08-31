import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import z from "zod";

type AiPromptServiceRequest = {
    topic: string;
    quantity: number;
}

export async function aiPromptService({topic, quantity}: AiPromptServiceRequest) {
return await generateObject({
  model: openai('gpt-4.1'),
  system: "Você é um especialista em criação de flashcards educacionais. Sua função é analisar conteúdo educacional e retornar flashcards estruturados em formato JSON válido.",
  schema: z.object({
    deck: z.array(
      z.object({
        frente: z.string(),
        verso: z.string()
      })
    )
  }),
  prompt: `Generate ${quantity} flashcards sobre ${topic}`,
 
});
}