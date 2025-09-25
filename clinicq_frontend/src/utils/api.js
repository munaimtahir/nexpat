export const unwrapListResponse = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.results)) {
    return payload.results;
  }

  return [];
};

export const firstFromListResponse = (payload) => {
  const [first] = unwrapListResponse(payload);
  return first ?? null;
};
