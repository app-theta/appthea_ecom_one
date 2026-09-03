/**
 * The backend returns two different error shapes:
 *
 *  Laravel validation (422):
 *    { status:false, message:'Validation failed.', errors:{ field:['msg'] }, code:422 }
 *
 *  Business logic (checkout, coupon, …):
 *    { status:false, message:'…', data:{ errors:['…'] }, code:422|403|… }
 *
 * parseApiError normalises both into one object.
 */
export function parseApiError(err, fallback = 'Something went wrong. Please try again.') {
  const body = err?.response?.data;
  const status = err?.response?.status ?? body?.code ?? 0;

  if (!body || typeof body !== 'object') {
    const offline = err?.code === 'ERR_NETWORK' || err?.message === 'Network Error';
    return {
      status,
      message: offline ? 'Cannot reach the server. Check your connection.' : (err?.message || fallback),
      fields: {},
      list: [],
    };
  }

  const fields = {};
  if (body.errors && !Array.isArray(body.errors) && typeof body.errors === 'object') {
    for (const [k, v] of Object.entries(body.errors)) fields[k] = Array.isArray(v) ? v[0] : String(v);
  }
  if (body.data?.errors && !Array.isArray(body.data.errors) && typeof body.data.errors === 'object') {
    for (const [k, v] of Object.entries(body.data.errors)) fields[k] = Array.isArray(v) ? v[0] : String(v);
  }

  const list = [];
  if (Array.isArray(body.errors)) list.push(...body.errors.map(String));
  if (Array.isArray(body.data?.errors)) list.push(...body.data.errors.map(String));

  return {
    status,
    message: body.message || list[0] || Object.values(fields)[0] || fallback,
    fields,
    list,
  };
}

/** True when the backend rejected checkout because a line price drifted. */
export function isPriceMismatch(parsed) {
  const hay = [parsed.message, ...parsed.list].join(' ').toLowerCase();
  return hay.includes('price has changed') || hay.includes('price mismatch');
}

/** True when checkout wants phone OTP verification first. */
export function needsOtp(parsed) {
  const hay = [parsed.message, ...parsed.list].join(' ').toLowerCase();
  return hay.includes('otp') || hay.includes('verify your phone');
}

export default parseApiError;
