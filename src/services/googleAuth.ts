export type GoogleAuthCode = { code: string; codeVerifier: string; redirectUri: string };

function randomUrlSafeString(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function requestGoogleAuthCode(): Promise<GoogleAuthCode> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('Login com Google não configurado.');

  // Open immediately on the click, before awaiting crypto, to avoid popup blockers.
  const popup = window.open('', 'google-login', 'width=500,height=650,left=200,top=100');
  if (!popup) throw new Error('Permita popups para entrar com Google.');

  const redirectUri = `${window.location.origin}/google-callback`;
  const codeVerifier = randomUrlSafeString();
  const state = randomUrlSafeString();
  let challenge: string;
  try {
    challenge = await challengeFor(codeVerifier);
  } catch (error) {
    popup.close();
    throw error;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error, code?: string) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onMessage);
      clearTimeout(timeout);
      popup.close();
      if (error) reject(error);
      else resolve({ code: code!, codeVerifier, redirectUri });
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== popup) return;
      if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        finish(new Error('Autenticação com Google cancelada.'));
      } else if (event.data?.type === 'GOOGLE_AUTH_CODE') {
        if (event.data.state !== state || typeof event.data.code !== 'string') {
          finish(new Error('Sessão Google inválida. Tente novamente.'));
        } else {
          finish(undefined, event.data.code);
        }
      }
    };
    const timeout = setTimeout(() => finish(new Error('O login com Google expirou. Tente novamente.')), 120000);
    window.addEventListener('message', onMessage);
    popup.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  });
}
