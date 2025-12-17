// app/api/collections/route.ts
// import { authenticate } from "../../shopify.server";

// export async function GET(request: Request) {
//   const { admin } = await authenticate.admin(request);

//   try {
//     const collections = await admin.rest.resources.Collection.all({
//       session: admin.session,
//       fields: "id,title"
//     });

//     return Response.json({ collections });
//   } catch (error) {
//     return Response.json({ error: "Failed to fetch collections" }, { status: 500 });
//   }
// }