import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import Fastify from 'fastify';
import z from 'zod';
import { aiPromptService } from './service/ai-prompt-service';
const fastify = Fastify({ logger: true });


fastify.post('/flash', async function (request, reply) {
  const FlashCardPromptRequestSchema = z.object({
  topic: z.string(),
  quantity: z.number().min(1).max(15),
})
  try {
    const {topic, quantity} = FlashCardPromptRequestSchema.parse(request.body)

    const result = await aiPromptService({topic, quantity})
    return reply.send(result.toJsonResponse());
  } catch (error) {
    if(error instanceof z.ZodError) {
      return reply.status(400).send({
        error: "Validation error",
      })
    }
    fastify.log.error(error);
    return reply.status(500).send({
      error: 'Internal server error'
    });
  }

});

fastify.listen({ port: 8080 });