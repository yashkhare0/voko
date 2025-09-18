import { z } from 'zod';
import { ConfigSchema } from './schema';

export type Config = z.infer<typeof ConfigSchema>;
