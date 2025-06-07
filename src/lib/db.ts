import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const db = {
  rfi: {
    findMany: prisma.rfi.findMany,
    findUnique: prisma.rfi.findUnique,
    create: prisma.rfi.create,
    update: prisma.rfi.update,
    delete: prisma.rfi.delete,
  },
  project: {
    findMany: prisma.project.findMany,
    findUnique: prisma.project.findUnique,
    create: prisma.project.create,
    update: prisma.project.update,
    delete: prisma.project.delete,
  },
  attachment: {
    findMany: prisma.attachment.findMany,
    findUnique: prisma.attachment.findUnique,
    create: prisma.attachment.create,
    delete: prisma.attachment.delete,
  },
}; 