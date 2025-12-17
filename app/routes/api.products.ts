// app/routes/api.products.ts - بديل مباشر
import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { admin } = await authenticate.admin(request);
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit') || '20');

    console.log(`🔍 Fetching products: query="${searchQuery}", limit=${limit}`);

    // ✅ استخدام Shopify Admin GraphQL مباشرة
    const response = await admin.graphql(`
      query GetProducts($query: String, $first: Int!) {
        products(first: $first, query: $query, sortKey: TITLE) {
          edges {
            node {
              id
              title
              handle
              featuredImage {
                url
                altText
              }
              variants(first: 1) {
                edges {
                  node {
                    id
                    price {
                      amount
                      currencyCode
                    }
                    title
                  }
                }
              }
            }
          }
        }
      }
    `, {
      variables: {
        query: searchQuery || undefined,
        first: limit
      }
    });

    const result = await response.json();
    console.log('📦 GraphQL response received');

    // if (result.errors) {
    //   console.error('❌ GraphQL errors:', result.errors);
    //   throw new Error(result.errors[0]?.message || 'GraphQL error');
    // }

    if (!result.data?.products) {
      throw new Error('No products data received from GraphQL');
    }

    // ✅ تحويل البيانات
    const formattedProducts = result.data.products.edges.map((edge: any) => {
      const product = edge.node;
      const variant = product.variants.edges[0]?.node;
      
      return {
        value: product.id,
        label: product.title,
        image: product.featuredImage?.url || '',
        price: variant?.price?.amount || '0.00',
        currency: variant?.price?.currencyCode || 'USD',
        variantId: variant?.id,
        handle: product.handle
      };
    });

    console.log(`✅ Found ${formattedProducts.length} products`);

    return new Response(JSON.stringify({
      success: true,
      products: formattedProducts
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('❌ Error in products API:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products';
    
    return new Response(JSON.stringify({
      success: false,
      products: [],
      error: errorMessage
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}