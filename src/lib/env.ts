import {z } from "zod"

const envSchema = z.object({
    DATABASE_URL: z.string(),
})

const _env = envSchema.safeParse(process.env)

if(_env.success === false) {
    console.error(z.treeifyError(_env.error));

    throw new Error('Invalid enviroment variables.');
}

export const env = _env.data;