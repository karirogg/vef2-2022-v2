import express from 'express';
import { body, validationResult } from 'express-validator';
import xss from 'xss';
import { catchErrors } from '../lib/catch-errors.js';
import {
  getEvent,
  getRegistrationsForEvent,
  listEvents,
  registerForEvent,
} from '../lib/db.js';

export const indexRouter = express.Router();

async function indexRoute(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/admin');
  }

  const events = await listEvents();

  return res.render('index', {
    title: 'Viðburðasíðan',
    events,
    admin: false,
    errors: [],
  });
}

indexRouter.get('/', catchErrors(indexRoute));

indexRouter.get('/:slug', async (req, res) => {
  const event = await getEvent(req.params.slug);

  try {
    const registrations = await getRegistrationsForEvent(event.id);

    res.render('event', {
      title: event.name,
      description: event.description,
      registrations,
      formData: {
        name: '',
        comment: '',
      },
      errors: [],
    });
  } catch {
    res.sendStatus(404);
  }
});

export const registrationValidationMiddleware = [
  body('name')
    .isLength({ min: 1, max: 64 })
    .withMessage('Nafn má ekki vera tómt'),
  body('comment')
    .isLength({ max: 400 })
    .withMessage('Athugasemd má vera að hámarki 400 stafir'),
];

export const xssSanitizationMiddleware = [
  body('name').trim().escape(),
  body('comment').trim().escape(),
  body('name').customSanitizer((value) => xss(value)),
  body('comment').customSanitizer((value) => xss(value)),
];

const validationResults = async (req, res, next) => {
  const { slug } = req.params;
  const displayedEvent = await getEvent(slug);

  const result = validationResult(req);

  if (!result.isEmpty()) {
    const registrations = await getRegistrationsForEvent(displayedEvent.id);

    return res.render('event', {
      title: displayedEvent.name,
      description: displayedEvent.description,
      created: displayedEvent.created,
      updated: displayedEvent.updated,
      registrations,
      formData: {
        name: '',
        comment: '',
      },
      errors: result.errors,
    });
  }

  return next();
};

const register = async (req, res) => {
  const { name, comment } = req.body;

  const correspondingEvent = await getEvent(req.params.slug);

  if (correspondingEvent === undefined) return res.send('Error!');

  const created = await registerForEvent({
    name,
    comment,
    eventID: correspondingEvent.id,
  });

  const registrations = await getRegistrationsForEvent(correspondingEvent.id);

  if (created) {
    return res.redirect(`/${req.params.slug}`);
  }

  return res.render('event', {
    title: correspondingEvent.name,
    description: correspondingEvent.description,
    registrations,
    formData: {
      name: '',
      comment: '',
    },
    errors: [{ param: '', msg: 'Gat ekki skráð þig í viðburð' }],
  });
};

indexRouter.post(
  '/:slug',
  registrationValidationMiddleware,
  validationResults,
  xssSanitizationMiddleware,
  register
);
