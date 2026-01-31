const endpoint = import.meta.env.VITE_REGISTRATION_ENDPOINT || '/api/registrations';

const parseError = async (response) => {
  try {
    const data = await response.json();
    return data?.error || data?.message || null;
  } catch (error) {
    return null;
  }
};

export const submitRegistration = async (payload) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = (await parseError(response)) || 'Unable to submit registration.';
    throw new Error(message);
  }

  try {
    return await response.json();
  } catch (error) {
    return { success: true };
  }
};
