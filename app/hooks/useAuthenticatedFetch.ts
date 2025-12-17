export function useAuthenticatedFetch() {
  async function authenticatedFetch(uri: RequestInfo | URL, options: RequestInit = {}) {
    try {
      const token = await shopify.idToken(); // ✅ الطريقة الحديثة لجلب التوكن
      const uriString = uri instanceof URL ? uri.toString() : uri;

      const response = await fetch(uriString, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          ...(options.headers || {}),
        },
      });

      if (response.status === 401) {
        shopify.redirect.reload(); // يعيد تحميل التطبيق في حال انتهاء الجلسة
      }

      return response;
    } catch (error) {
      console.error("Authenticated fetch error:", error);
      throw error;
    }
  }

  return authenticatedFetch;
}
