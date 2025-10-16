export function getKeyByValue(object: object, value: any) {
  if (object === null || object === undefined) return undefined;
  let result: any = undefined;
  value = value.toString();
  Object.keys(object).some((key: string): boolean => {
    if (object[key] === value) {
      result = key;
      return true;
    } else if (typeof object[key] === 'object') {
      result = getKeyByValue(object[key], value);
      return result !== undefined;
    }
  });
  return result;
}

export function truncateJSON(obj, maxLength = 1000) {
  const jsonString = JSON.stringify(obj);

  if (jsonString.length > maxLength) {
    return jsonString.slice(0, maxLength - 3) + '...';
  }
  return jsonString;
}

export const redactSensitiveData = data => {
  const sensitiveKeys = ['api_key', 'password', 'two_factor_secret', 'access_token', 'key'];
  const maskToken = token => '**********';

  const redact = obj => {
    if (Array.isArray(obj)) {
      return obj.map(redact);
    } else if (obj && typeof obj === 'object') {
      return Object.entries(obj).reduce((acc, [key, value]) => {
        acc[key] = sensitiveKeys.includes(key)
          ? typeof value === 'string' && value.length > 10
            ? maskToken(value)
            : 'REDACTED'
          : redact(value);
        return acc;
      }, {});
    }
    return obj;
  };

  return redact(data);
};

export function redactLongValues(obj, maxLength = 20) {
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      redactLongValues(obj[key], maxLength);
    } else if (typeof obj[key] === 'string' && obj[key].length > maxLength) {
      obj[key] = obj[key].slice(0, maxLength) + '...';
    }
  }
  return truncateJSON(obj);
}
