import type { z } from 'zod';
import type { ConfigSchema } from './schema';

export type Config = z.infer<typeof ConfigSchema>;
