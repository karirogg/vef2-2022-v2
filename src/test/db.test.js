import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import {
  createEvent,
  createSchema,
  dropSchema,
  end,
  getEvent,
} from '../lib/db';

/**
 * Hér er test gagnagrunnur búinn til og hent áður en test eru keyrð.
 * package.json sér um að nota dotenv-cli til að loada .env.test sem vísar í þann gagnagrunn
 * sem ætti *ekki* að vera sá sami og við notum „almennt“
 */

describe('db', () => {
  beforeAll(async () => {
    await dropSchema();
    await createSchema();
  });

  afterAll(async () => {
    await end();
  });

  it('creates a valid event and returns it', async () => {
    // TODO útfæra test
    const created = await createEvent({
      name: 'Test event',
      description: 'This is a test.',
    });

    expect(created).toBe(true);

    const createdEvent = await getEvent('test-event');

    expect(createdEvent.name).toBe('Test event');
    expect(createdEvent.slug).toBe('test-event');
    expect(createdEvent.description).toBe('This is a test.');
  });
});
