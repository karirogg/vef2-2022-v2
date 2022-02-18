import express from 'express';
import { body, validationResult } from 'express-validator';
import xss from 'xss';
import { catchErrors } from '../lib/catch-errors.js';
import {
  createEvent,
  editEvent,
  getEvent,
  getRegistrationsForEvent,
  listEvents,
} from '../lib/db.js';
import passport, { ensureLoggedIn } from '../login.js';

export const adminRouter = express.Router();

async function adminRoute(req, res) {
  const events = await listEvents();

  res.render('index', {
    title: 'Viðburðalistinn',
    events,
    admin: true,
    errors: [],
  });
}

adminRouter.get('/', ensureLoggedIn, catchErrors(adminRoute));

adminRouter.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/admin');
  }

  let message = '';

  // Athugum hvort einhver skilaboð séu til í session, ef svo er birtum þau
  // og hreinsum skilaboð
  if (req.session.messages && req.session.messages.length > 0) {
    message = req.session.messages.join(', ');
    req.session.messages = [];
  }

  return res.render('login', { message, title: 'Innskráning' });
});

export const eventValidationMiddleware = [
  body('name')
    .isLength({ min: 1, max: 64 })
    .withMessage('Nafn má ekki vera tómt'),
  body('description')
    .isLength({ max: 400 })
    .withMessage('Athugasemd má vera að hámarki 400 stafir'),
];

export const xssSanitizationEventMiddleware = [
  body('name').trim().escape(),
  body('description').trim().escape(),
  body('name').customSanitizer((value) => xss(value)),
  body('description').customSanitizer((value) => xss(value)),
];

const validationResults = async (req, res, next) => {
  const { name = '', description = '', created = '', updated = '' } = req.body;

  const result = validationResult(req);

  if (!result.isEmpty()) {
    const events = await listEvents();

    return res.render('index', {
      title: 'Viðburðalistinn',
      events,
      admin: true,
      errors: result.errors,
      data: { name, description, created, updated },
    });
  }

  return next();
};

const postEvent = async (req, res) => {
  const { name, description } = req.body;

  const created = await createEvent({ name, description });

  if (created) {
    return res.redirect('/admin');
  }

  const events = await listEvents();

  return res.render('index', {
    title: 'Formið mitt',
    events,
    admin: true,
    errors: [{ param: '', msg: 'Gat ekki búið til viðburð' }],
    data: { name, description },
  });
};

const patchEvent = async (req, res) => {
  const { name, description } = req.body;

  const created = await editEvent({
    name,
    description,
    oldSlug: req.params.slug,
  });

  if (created) {
    return res.redirect('/admin');
  }

  const events = await listEvents();

  return res.render('index', {
    title: 'Formið mitt',
    events,
    admin: true,
    errors: [{ param: '', msg: 'Gat ekki búið til viðburð' }],
    data: { name, description },
  });
};

adminRouter.post(
  '/',
  eventValidationMiddleware,
  validationResults,
  xssSanitizationEventMiddleware,
  postEvent
);

adminRouter.post(
  '/login',

  // Þetta notar strat að ofan til að skrá notanda inn
  passport.authenticate('local', {
    failureMessage: 'Notandanafn eða lykilorð vitlaust.',
    failureRedirect: '/admin/login',
  }),

  // Ef við komumst hingað var notandi skráður inn, senda á /admin
  (req, res) => {
    res.redirect('/admin');
  }
);

adminRouter.get('/logout', (req, res) => {
  // logout hendir session cookie og session
  req.logout();
  res.redirect('/');
});

adminRouter.get('/:slug', async (req, res) => {
  const event = await getEvent(req.params.slug);
  const registrations = await getRegistrationsForEvent(event.id);

  try {
    res.render('edit-event', {
      title: event.name,
      description: event.description,
      registrations,
      errors: [],
      formData: {
        name: event.name,
        description: event.description,
      },
    });
  } catch {
    res.sendStatus(404);
  }
});

adminRouter.post(
  '/:slug',
  ensureLoggedIn,
  eventValidationMiddleware,
  validationResults,
  xssSanitizationEventMiddleware,
  patchEvent
);
