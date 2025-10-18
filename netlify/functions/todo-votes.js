import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  TODO_VOTES_TABLE = 'todo_votes',
  TODO_VOTES_ALLOWED_ORIGINS = '',
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing Supabase configuration. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const allowedOrigins = TODO_VOTES_ALLOWED_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const normalizeOrigin = (origin) => {
  if (!origin) return '';
  try {
    const url = new URL(origin);
    return `${url.protocol}//${url.host}`;
  } catch (error) {
    return origin;
  }
};

const originIsAllowed = (origin) => {
  if (!allowedOrigins.length) return true;
  const normalized = normalizeOrigin(origin);
  return allowedOrigins.includes(normalized);
};

const buildCorsHeaders = (origin) => {
  const normalizedOrigin = normalizeOrigin(origin);
  const allowOrigin = originIsAllowed(normalizedOrigin)
    ? normalizedOrigin || '*'
    : allowedOrigins[0] || '*';

  const headers = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-User-Id',
  };

  if (allowOrigin !== '*') {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
};

const jsonResponse = (statusCode, body = {}, origin = '') => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    ...buildCorsHeaders(origin),
  },
  body: JSON.stringify(body),
});

const getUserIdentifier = (event) => {
  const headerId = event.headers?.['x-user-id'] || event.headers?.['X-User-Id'];
  if (headerId) return String(headerId);

  const ip =
    event.headers?.['x-client-ip'] ||
    event.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    event.headers?.['client-ip'] ||
    event.ip ||
    '';
  const userAgent = event.headers?.['user-agent'] || '';

  const toHash = `${ip}|${userAgent}`;
  if (!toHash.trim()) {
    return null;
  }

  return crypto.createHash('sha256').update(toHash).digest('hex');
};

const parseVotePayload = (body) => {
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error('Invalid JSON body');
  }
};

const validateVote = ({ todoId, vote }) => {
  if (!todoId || typeof todoId !== 'string') {
    return 'The "todoId" field is required and must be a string.';
  }

  const allowedVotes = new Set([-1, 0, 1]);
  if (!allowedVotes.has(vote)) {
    return 'The "vote" field must be one of -1, 0, or 1.';
  }

  return null;
};

const aggregateVotes = (records = []) => {
  return records.reduce((acc, record) => {
    const { todo_id: todoId, value } = record;
    if (!acc[todoId]) {
      acc[todoId] = { score: 0, voters: 0 };
    }
    acc[todoId].score += value || 0;
    if (value !== 0) {
      acc[todoId].voters += 1;
    }
    return acc;
  }, {});
};

export const handler = async (event) => {
  const origin = event.headers?.origin;

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: buildCorsHeaders(origin),
    };
  }

  if (!originIsAllowed(origin)) {
    return jsonResponse(403, { error: 'Origin not allowed' }, origin);
  }

  if (event.httpMethod === 'GET') {
    const { data, error } = await supabase
      .from(TODO_VOTES_TABLE)
      .select('todo_id,value');

    if (error) {
      console.error('Error fetching votes:', error);
      return jsonResponse(500, { error: 'Failed to fetch votes' }, origin);
    }

    const aggregated = aggregateVotes(data || []);

    return jsonResponse(200, { votes: aggregated }, origin);
  }

  if (event.httpMethod === 'POST') {
    if (!event.body) {
      return jsonResponse(400, { error: 'Request body is required' }, origin);
    }

    let payload;
    try {
      payload = parseVotePayload(event.body);
    } catch (error) {
      return jsonResponse(400, { error: error.message }, origin);
    }

    const validationError = validateVote(payload);
    if (validationError) {
      return jsonResponse(400, { error: validationError }, origin);
    }

    const userId = payload.userId ? String(payload.userId) : getUserIdentifier(event);
    if (!userId) {
      return jsonResponse(400, { error: 'Unable to determine a user identifier for this vote.' }, origin);
    }

    const { todoId, vote } = payload;

    const { error } = await supabase
      .from(TODO_VOTES_TABLE)
      .upsert(
        {
          todo_id: todoId,
          user_id: userId,
          value: vote,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'todo_id,user_id' }
      );

    if (error) {
      console.error('Error saving vote:', error);
      return jsonResponse(500, { error: 'Failed to save vote' }, origin);
    }

    return jsonResponse(
      200,
      {
        message: 'Vote recorded',
        todoId,
        vote,
      },
      origin
    );
  }

  return jsonResponse(405, { error: 'Method not allowed' }, origin);
};
