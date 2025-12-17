// app/api/products/route.ts
// import { authenticate } from "../../shopify.server";

// export async function GET(request: Request) {
//     const { admin } = await authenticate.admin(request);

//     try {
//         const products = await admin.rest.resources.Product.all({
//             session: admin.session,
//             fields: "id,title,featuredImage"
//         });

//         return Response.json({ products });
//     } catch (error) {
//         return Response.json({ error: "Failed to fetch products" }, { status: 500 });
//     }
// }