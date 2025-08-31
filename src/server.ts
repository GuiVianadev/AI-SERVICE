import Fastify from 'fastify';
import z from 'zod';
import { aiPromptService } from './service/ai-prompt-service';
import { createResourceWithFlashcards } from './service/rag-service';
import fastifyMultipart from '@fastify/multipart';

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

    fastify.post('/upload-with-flashcards', async (request, reply) => {
      try {
        console.log('📥 Recebendo arquivo...');
        
        const data = await request.file();
        
        if (!data) {
          return reply.code(400).send({ error: 'Nenhum arquivo enviado' });
        }

        console.log(`📁 Arquivo: ${data.filename}`);
        
        // Ler o conteúdo do arquivo
        const buffer = await data.toBuffer();
        const content = buffer.toString('utf8');
        
        console.log(`📄 Conteúdo: ${content.length} caracteres`);
        
        const result = await createResourceWithFlashcards({
          content,
          fileName: data.filename || 'uploaded-file.txt'
        }, 8);
        
        return result;
      } catch (error) {
        console.error('❌ Erro no upload:', error);
        return reply.code(500).send({ error: error.message });
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