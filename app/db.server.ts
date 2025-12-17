// app/db.server.ts
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

declare global {
  var __db__: PrismaClient;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.__db__;
}

export { prisma };


export async function deleteShopData(shop: string) {
  return await prisma.$transaction(async (tx) => {
    await tx.session.deleteMany({ where: { shop } });

    const user = await tx.user.findUnique({ where: { shop } });

    if (user) {
      const userId = user.id;

      await tx.googleSheetsIntegration.deleteMany({ where: { userId } });
      await tx.shippingSettings.deleteMany({ where: { userId } });
      await tx.order.deleteMany({ where: { userId } });

      await tx.formSubmission.deleteMany({ where: { userId } });
      await tx.formLogs.deleteMany({ where: { userId } });
      await tx.formField.deleteMany({
        where: {
          formConfig: {
            userId
          }
        }
      });
      await tx.formConfig.deleteMany({ where: { userId } });
      await tx.form.deleteMany({ where: { userId } });

      await tx.user.delete({ where: { id: userId } });
    }

    await tx.formSubmission.deleteMany({ where: { shop } });
    await tx.formLogs.deleteMany({ where: { shop } });
    await tx.form.deleteMany({ where: { shop } });
    await tx.formConfig.deleteMany({ where: { shop } });
    await tx.order.deleteMany({ where: { shop } });
    await tx.shippingSettings.deleteMany({ where: { shop } });
    await tx.googleSheetsIntegration.deleteMany({ where: { shop } });
  });
}