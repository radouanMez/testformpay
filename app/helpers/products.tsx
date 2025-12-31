

// -------------------- Types --------------------
export type Product = {
    id: string;
    title: string;
    price: number;
    handle?: string;
    featuredImage?: {
        url: string;
        altText?: string;
    };
};

export const PRODUCTS_QUERY = `
    query {
        products(first: 50) {
            edges {
                node {
                id
                title
                handle
                featuredImage { url }
                variants(first:1){edges{node{price}}}
                }
            }
        }
    }
`;