

// -------------------- Types --------------------
export type Product = {
    id: string;
    title: string;
    price: number;
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
                featuredImage { url }
                variants(first:1){edges{node{price}}}
                }
            }
        }
    }
`;