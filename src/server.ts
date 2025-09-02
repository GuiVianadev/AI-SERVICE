import Fastify from 'fastify';
import z from 'zod';
import { aiPromptService } from './service/ai-prompt-service';
import { createResourceWithFlashcards } from './service/rag-service';
import fastifyMultipart from '@fastify/multipart';
import { pdfService } from './service/pdf-service';
import { simuladoService } from './service/simulado-service'; // Importar o novo serviço

const fastify = Fastify({ logger: true });

async function start() {
  try {
    await fastify.register(fastifyMultipart, {
      limits: {
        fieldNameSize: 100,
        fieldSize: 100,
        files: 1,
        fileSize: 5 * 1024 * 1024
      }
    });

    const FlashCardPromptRequestSchema = z.object({
      topic: z.string(),
      quantity: z.number().min(1).max(15),
    });

    const CreateResourceSchema = z.object({
      content: z.string(),
      fileName: z.string(),
      quantity: z.number().optional().default(8)
    });

    // Schema para validar o deck de flashcards
    const SimuladoRequestSchema = z.object({
      deck: z.array(
        z.object({
          frente: z.string(),
          verso: z.string()
        })
      ),
      quantity: z.number().min(1).max(20).optional().default(10)
    });

    fastify.post('/flash', async function (request, reply) {
      try {
        const { topic, quantity } = FlashCardPromptRequestSchema.parse(request.body);

        const result = await aiPromptService({ topic, quantity });
        return reply.send(result.toJsonResponse());
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: "Validation error",
          });
        }
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal server error'
        });
      }
    });

    fastify.post('/create-with-flashcards', async (request, reply) => {
      try {
        const { content, fileName, quantity } = CreateResourceSchema.parse(request.body);

        const result = await createResourceWithFlashcards({
          content,
          fileName
        }, quantity);

        return result;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: "Validation error",
          });
        }
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal server error'
        });
      }
    });

    fastify.post("/pdf/flashcards", async (request, reply) => {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({ error: "Nenhum arquivo enviado" });
      }
      const query = request.query as { quantity?: string };
      const quantity = parseInt(query.quantity || '8');

      const buffer = await data.toBuffer();
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${data.mimetype};base64,${base64}`;

      const result = await pdfService(dataUrl, quantity);

      return reply.send(result);
    });

    // Nova rota para gerar simulado a partir de flashcards
    fastify.post('/simulado', async (request, reply) => {
      try {
        const { deck, quantity } = SimuladoRequestSchema.parse(request.body);

        const result = await simuladoService({ deck }, quantity);

        return reply.send({
          simulado: result,
          totalQuestoes: result.length,
          geradoEm: new Date().toISOString()
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: "Validation error",
          });
        }
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal server error'
        });
      }
    });

    fastify.get('/health', async (request, reply) => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    await fastify.listen({ port: 8080, host: '0.0.0.0' });

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();