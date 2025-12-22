import { createAuthClient } from "better-auth/react";
import { organizationClient, magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [organizationClient(), magicLinkClient()],
  fetchOptions: {
    onRequest: (context) => {
      return {
        ...context,
        headers: {
          ...context.headers,
          "Content-Type": "application/json",
        },
      };
    },
  },
});
