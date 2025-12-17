import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
  LoginErrorType
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { shopifyApi } from "@shopify/shopify-api";
import { prisma } from "./db.server";

const HOST_NAME = process.env.HOST_NAME || "formpaycod-jkwt7.ondigitalocean.app";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(",") || ['write_products'],
  appUrl: process.env.SHOPIFY_APP_URL!,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  useOnlineTokens: false,

  hooks: {
    afterAuth: async ({ session }) => {
      if (!session?.shop) {
        console.error("❌ No shop in session during afterAuth");
        return;
      }

      try {
        const shopifyClient = shopifyApi({
          apiKey: process.env.SHOPIFY_API_KEY!,
          apiSecretKey: process.env.SHOPIFY_API_SECRET!,
          scopes: process.env.SCOPES!.split(","),
          hostName: HOST_NAME,
          apiVersion: ApiVersion.October25,
          isEmbeddedApp: true,
        });

        const graphqlClient = new shopifyClient.clients.Graphql({ session });

        // REMOVE email in params
        const query =   `
          #graphql
          query {
            shop {
              id
              name
              email
            }
          }
        `;

        const response = await graphqlClient.query({
          data: query,
        }) as any;

        if (!response?.body?.data?.shop) {
          console.error("❌ Failed to get shop info from Shopify", response);
          if (response?.body?.errors) {
            console.error("GraphQL Errors:", response.body.errors);
          }
          await createUserWithDefaultData(session);
          return;
        }

        const shopInfo = response.body.data.shop;
        const shopName = shopInfo.name || session.shop.replace('.myshopify.com', '');
        const shopEmail = shopInfo.email || `${session.shop}@shopify.com`;

        await createOrUpdateUser(session, shopName, shopEmail);

      } catch (error) {
        console.error("❌ Error in afterAuth hook:", error);
        try {
          await createUserWithDefaultData(session);
        } catch (fallbackError) {
          console.error("❌ Fallback user creation also failed:", fallbackError);
        }
      }
    },
  },
});

async function createUserWithDefaultData(session: any) {
  const shopName = session.shop.replace('.myshopify.com', '');
  const shopEmail = `${session.shop}@shopify.com`;
  return createOrUpdateUser(session, shopName, shopEmail);
}

async function createOrUpdateUser(session: any, shopName: string, shopEmail: string) {
  try {
    let user = await prisma.user.findUnique({
      where: { shop: session.shop }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: shopEmail,
          shop: session.shop,
          name: shopName
        },
      });
    } else {
      console.log("✅ Existing user found:", user.id);
    }

    const updated = await prisma.session.update({
      where: { id: session.id },
      data: { userId: user.id },
    });

    return user;
  } catch (error) {
    console.error("❌ Error in createOrUpdateUser:", error);
    throw error;
  }
}

type UserWithRelations = Awaited<ReturnType<typeof getUserWithRelations>>;

async function getUserWithRelations(shop: string) {
  return prisma.user.findUnique({
    where: { shop },
    include: {
      sessions: {
        orderBy: { expires: 'desc' }
      },
      forms: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });
}

export async function safeAuthenticateAdmin(request: Request) {
  try {
    const result = await shopify.authenticate.admin(request);

    if (result instanceof Response) {
      console.warn("⚠️ Redirect detected in authenticate.admin() — no valid session");
      return null;
    }

    if (result.session && result.session.shop) {
      return result;
    }

    console.warn("⚠️ No session.shop found in authenticate.admin()");
    return null;
  } catch (error: any) {
    console.error("❌ Error in safeAuthenticateAdmin:", error);
    return null;
  }
}

export async function ensureUserForShop(shop: string): Promise<UserWithRelations> {
  try {
    let user = await getUserWithRelations(shop);

    if (!user) {
      const newUser = await prisma.user.create({
        data: {
          email: `${shop}@shopify.com`,
          shop: shop,
          name: shop.replace('.myshopify.com', '')
        },
      });

      user = await getUserWithRelations(shop);
    }

    return user;
  } catch (error) {
    console.error("❌ Error ensuring user:", error);
    throw error;
  }
}
export async function getCurrentShop(request: Request, session?: any) {
  try {
    const auth = session ? { session } : await safeAuthenticateAdmin(request);
    const currentSession = auth?.session;

    if (!currentSession || !currentSession.shop) {
      console.warn("⚠️ No active Shopify session found in getCurrentShop()");
      return null;
    }

    return currentSession.shop;
  } catch (error: any) {
    console.error("❌ Error in getCurrentShop:", error);
    return null;
  }
}

export async function getCurrentUser(request: Request, session?: any) {
  try {
    const auth = session ? { session } : await safeAuthenticateAdmin(request);
    const currentSession = auth?.session;

    if (!currentSession || !currentSession.shop) {
      console.warn("⚠️ No active Shopify session found in getCurrentUser()");
      return null;
    }

    const user = await prisma.user.findFirst({
      where: { shop: currentSession.shop },
    });

    if (!user) {
      console.warn(`⚠️ No user found for shop ${currentSession.shop}`);
      return null;
    }

    return user;
  } catch (error: any) {
    console.error("❌ Error in getCurrentUser:", error);
    return null;
  }
}

export async function triggerAfterAuth(shop: string): Promise<UserWithRelations> {
  try {
    const session = await prisma.session.findFirst({
      where: { shop },
      orderBy: { expires: 'desc' }
    });

    if (session) {
      const user = await ensureUserForShop(shop);

      await prisma.session.update({
        where: { id: session.id },
        data: { userId: user?.id },
      });

      return user;
    }

    console.log("❌ No session found for manual trigger");
    return null;
  } catch (error) {
    console.error("❌ Error in manual trigger:", error);
    throw error;
  }
}

export async function debugSessions() {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        user: {
          select: { id: true, shop: true, email: true }
        }
      },
      orderBy: { expires: 'desc' }
    });

    sessions.forEach(session => {
      console.log(`- ${session.shop} (user: ${session.userId || 'null'})`);
    });

    return sessions;
  } catch (error) {
    console.error("❌ Error debugging sessions:", error);
    return [];
  }
}

export async function linkSessionsToUser(shop: string, userId: string) {
  try {
    const sessions = await prisma.session.findMany({
      where: {
        shop: shop,
        userId: null
      }
    });

    if (sessions.length > 0) {
      await prisma.session.updateMany({
        where: {
          shop: shop,
          userId: null
        },
        data: {
          userId: userId
        },
      });
    }

    return sessions.length;
  } catch (error) {
    console.error("❌ Error linking sessions:", error);
    return 0;
  }
}

export async function checkSessionValidity(shop: string) {
  try {
    const session = await prisma.session.findFirst({
      where: { shop },
      orderBy: { expires: 'desc' }
    });

    if (!session) {
      return { exists: false, valid: false, message: 'No session found' };
    }

    if (!session.expires) {
      return { exists: false, valid: false, message: 'No session expires found' };
    }

    const isExpired = session.expires < new Date();
    const hasAccessToken = !!session.accessToken;

    return {
      exists: true,
      valid: !isExpired && hasAccessToken,
      isExpired,
      hasAccessToken,
      expires: session.expires,
      now: new Date()
    };
  } catch (error: any) {
    return { exists: false, valid: false, message: error.message };
  }
}

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;

export function loginErrorMessage(loginErrors: any) {
  if (loginErrors?.shop === LoginErrorType.MissingShop) {
    return { shop: "Please enter your shop domain to log in" };
  } else if (loginErrors?.shop === LoginErrorType.InvalidShop) {
    return { shop: "Please enter a valid shop domain to log in" };
  }
  return {};
}

export async function debugAllSessions() {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        user: {
          select: { id: true, shop: true, email: true }
        }
      },
      orderBy: { expires: 'desc' }
    });

    console.log("=== ALL SESSIONS ===");
    sessions.forEach(session => {
      const isExpired = session.expires && session.expires < new Date();
      console.log(`- ${session.shop} | User: ${session.userId || 'NULL'} | Expired: ${isExpired} | Expires: ${session.expires}`);
    });
    console.log("====================");

    return sessions;
  } catch (error) {
    console.error("❌ Error debugging sessions:", error);
    return [];
  }
}