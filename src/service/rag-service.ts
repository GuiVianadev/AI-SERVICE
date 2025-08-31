// import {
//   NewResourceParams,
//   insertResourceSchema,
//   resources,
// } from '../lib/db/schema/resource';
// import { db } from '../lib/db';
// import { generateEmbeddings } from '../lib/ai/embedding'
// import { embeddings as embeddingsTable } from '../lib/db/schema/embeddings';

// export const createResource = async (input: NewResourceParams) => {
//   try {
//     const { content, fileName } = insertResourceSchema.parse(input);

//     const [resource] = await db
//       .insert(resources)
//       .values({ content, fileName })
//       .returning();

//     const embeddings = await generateEmbeddings(content);
//     await db.insert(embeddingsTable).values(
//       embeddings.map(embedding => ({
//         id: crypto.randomUUID(),
//         resourceId: resource.id,
//         ...embedding,
//       })),
//     );

//     return 'Resource successfully created and embedded.';
//   } catch (error) {
//     return error instanceof Error && error.message.length > 0
//       ? error.message
//       : 'Error, please try again.';
//   }
// };

import {
  NewResourceParams,
  insertResourceSchema,
  resources,
} from '../lib/db/schema/resource';
import { db } from '../lib/db';
import { generateEmbeddings } from '../lib/ai/embedding';
import { embeddings as embeddingsTable } from '../lib/db/schema/embeddings';
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import z from "zod";

export const createResourceWithFlashcards = async (input: NewResourceParams, quantity: number = 8) => {
  try {
    const { content, fileName } = insertResourceSchema.parse(input);

    // 1. Criar resource e embeddings
    const [resource] = await db
      .insert(resources)
      .values({ content, fileName })
      .returning();

    const embeddings = await generateEmbeddings(content);
    await db.insert(embeddingsTable).values(
      embeddings.map(embedding => ({
        id: crypto.randomUUID(),
        resourceId: resource.id,
        ...embedding,
      })),
    );

    // 2. Gerar flashcards usando o conteúdo
    const flashcardsResponse = await generateObject({
      model: openai('gpt-4o'),
      system: "Você é um especialista em criação de flashcards educacionais. Analise o conteúdo fornecido e crie flashcards que cubram os conceitos mais importantes.",
      schema: z.object({
        deck: z.array(
          z.object({
            frente: z.string(),
            verso: z.string()
          })
        )
      }),
      prompt: `Analise este conteúdo e gere ${quantity} flashcards sobre os conceitos mais importantes:

${content.slice(0, 4000)}${content.length > 4000 ? '...[conteúdo truncado para análise]' : ''}`,
    });

    return {
      success: true,
      resourceId: resource.id,
      fileName,
      chunksCount: embeddings.length,
      flashcards: flashcardsResponse.object.deck,
      message: 'Resource successfully created and embedded with flashcards.'
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error && error.message.length > 0
        ? error.message
        : 'Error, please try again.'
    };
  }
};