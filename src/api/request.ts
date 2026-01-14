import ky, { HTTPError } from 'ky';
import { getMiniProgramToken } from '@difftim/jsbridge-utils';

const TokenError = () => new Error('Failed to get token');

export const request = ky.extend({
  prefixUrl: '/',
  hooks: {
    beforeRequest: [
      async request => {
        let token: string;
        try {
          token =
            import.meta.env.VITE_TEST_TOKEN || (await getMiniProgramToken({ timeoutMs: 1000 }));
        } catch {
          throw TokenError();
        }

        const headers = new Headers(request.headers);
        headers.set('Authorization', token);

        return new Request(request, {
          headers,
        });
      },
    ],
    beforeRetry:
      typeof window !== 'undefined'
        ? [
            async ({ request, error, retryCount }) => {
              console.log(request, error.name, error.message);
              const isTokenExpired = error.message.includes("Unexpected token '<'");

              if (isTokenExpired && retryCount < 3) {
                if (retryCount < 3) {
                  try {
                    const token = await getMiniProgramToken({
                      timeoutMs: 1000,
                    });
                    request.headers.set('Authorization', token);
                  } catch {
                    throw TokenError();
                  }
                } else {
                  throw TokenError();
                }
              }
            },
          ]
        : [],
    afterResponse: [
      async (request, _op, response) => {
        const body = await response.clone().json();

        console.log('request', request, _op, response);

        if (body.status !== 0) {
          const error = new HTTPError(response, request, _op);
          error.message = body.reason;
          throw error;
        }
        return new Response(JSON.stringify(body.data));
      },
    ],
  },
});
