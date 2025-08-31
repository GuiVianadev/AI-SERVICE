import { index, pgTable, text, varchar, vector } from "drizzle-orm/pg-core";
import { resources } from "./resource";

export const embeddings = pgTable('embeddings', {
  id: varchar('id').primaryKey(),
  resourceId: varchar('resource_id').references(() => resources.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }).notNull(),
}, table => [
  index('embeddingIndex').using('hnsw', table.embedding.op('vector_cosine_ops')),
]);
