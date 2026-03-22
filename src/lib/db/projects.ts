import "server-only";

import { ProjectStatus } from "@prisma/client/index";

import { prisma } from "@/lib/db/prisma";

export async function getProjectsForUser(userId: string) {
  return prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProjectForUser(
  userId: string,
  input: {
    name: string;
    description?: string;
  },
) {
  return prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      ownerId: userId,
    },
  });
}

export async function toggleProjectArchivedForUser(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  return prisma.project.update({
    where: { id: project.id },
    data: {
      status:
        project.status === ProjectStatus.ACTIVE
          ? ProjectStatus.ARCHIVED
          : ProjectStatus.ACTIVE,
    },
  });
}

export async function deleteProjectForUser(projectId: string, userId: string) {
  const deleted = await prisma.project.deleteMany({
    where: {
      id: projectId,
      ownerId: userId,
    },
  });

  if (deleted.count === 0) {
    throw new Error("Project not found.");
  }
}
