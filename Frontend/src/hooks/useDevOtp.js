import { useCallback } from 'react';
import { useApolloClient } from '@apollo/client';
import toast from 'react-hot-toast';
import { DEV_PEEK_OTP } from '../graphql/queries.js';

// Dev-only helper: fetch the plaintext OTP the server issued for `email` and
// hand it back so the caller can prefill the code input. Server returns null
// when NODE_ENV != 'development', so this is a no-op in production.
export function useDevOtpPeek() {
  const client = useApolloClient();

  return useCallback(
    async ({ email, onFill }) => {
      try {
        const { data } = await client.query({
          query: DEV_PEEK_OTP,
          variables: { email: email.trim().toLowerCase() },
          fetchPolicy: 'network-only',
        });
        const code = data?._devPeekOtp;
        if (code) {
          onFill(code);
          toast(`Dev mode: code ${code} auto-filled`, { icon: '🛠️', duration: 4000 });
        }
      } catch {
        // Best-effort — never block the real flow.
      }
    },
    [client]
  );
}
