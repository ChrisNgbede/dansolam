// Logins without "remember me" live in sessionStorage, which new tabs don't inherit.
// Open tabs hand their session tokens to new ones over a BroadcastChannel so the
// visitor stays signed in everywhere until they log out or close the browser.

const KEYS = ['dansolam_customer_token', 'dansolam_admin_token'];
// Set while some tab holds a session-only login, so new tabs know it's worth asking.
const HINT_KEY = 'dansolam_session_hint';
const WAIT_MS = 200;

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dansolam_session') : null;

const sessionTokens = () => {
  const tokens = {};
  KEYS.forEach((key) => {
    const value = sessionStorage.getItem(key);
    if (value) tokens[key] = value;
  });
  return tokens;
};

const adopt = (tokens) => {
  let changed = false;
  KEYS.forEach((key) => {
    if (tokens?.[key] && sessionStorage.getItem(key) !== tokens[key]) {
      sessionStorage.setItem(key, tokens[key]);
      changed = true;
    }
  });
  if (changed) window.dispatchEvent(new Event('dansolam_auth_login'));
  return changed;
};

if (channel) {
  channel.addEventListener('message', ({ data }) => {
    if (data?.type === 'request') {
      const tokens = sessionTokens();
      if (Object.keys(tokens).length) channel.postMessage({ type: 'tokens', tokens });
    } else if (data?.type === 'tokens') {
      adopt(data.tokens);
    } else if (data?.type === 'logout') {
      (data.keys || KEYS).forEach((key) => sessionStorage.removeItem(key));
      window.dispatchEvent(new Event('dansolam_auth_logout'));
    }
  });
}

// Called once before the app renders. Resolves straight away unless another tab
// may hold a session login, in which case it waits briefly for that tab to answer.
export const restoreSharedSession = () => new Promise((resolve) => {
  const hasToken = KEYS.some((key) => localStorage.getItem(key) || sessionStorage.getItem(key));
  if (!channel || hasToken || !localStorage.getItem(HINT_KEY)) {
    resolve();
    return;
  }

  const onReply = ({ data }) => {
    if (data?.type !== 'tokens') return;
    clearTimeout(timer);
    channel.removeEventListener('message', onReply);
    resolve();
  };
  const timer = setTimeout(() => {
    channel.removeEventListener('message', onReply);
    // Nobody answered: the tabs holding that login were closed.
    localStorage.removeItem(HINT_KEY);
    resolve();
  }, WAIT_MS);

  channel.addEventListener('message', onReply);
  channel.postMessage({ type: 'request' });
});

// Share a fresh session-only login with the other open tabs.
export const shareSessionLogin = () => {
  localStorage.setItem(HINT_KEY, '1');
  channel?.postMessage({ type: 'tokens', tokens: sessionTokens() });
};

// Sign the other tabs out too, so a stale tab can't hand the token back out.
export const shareSessionLogout = (keys = KEYS) => {
  if (!KEYS.some((key) => !keys.includes(key) && sessionStorage.getItem(key))) {
    localStorage.removeItem(HINT_KEY);
  }
  channel?.postMessage({ type: 'logout', keys });
};
