"use server";
import { UserSubscriptionPlan } from "@/types";
import { cancelSubscription } from "@lemonsqueezy/lemonsqueezy.js";
import type { User, UserCategory } from "@prisma/client";
import type * as z from "zod";
import { db } from "../db";
import { addDomain, removeDomain } from "../domains";
import { encrypt } from "../encryption";
import type { updateUserSchema } from "../validations/user";
import {
  workExperienceFormSchema,
  workExperiencePatchSchema,
} from "../validations/work-experience";

type UpdateUserSchema = z.infer<typeof updateUserSchema>;

export async function updateUser(
  userId: string,
  data: UpdateUserSchema,
  plan: UserSubscriptionPlan,
) {
  const { showBranding, category, beehiivKey, beehiivPublicationId, ...rest } =
    data;

  const encryptedBeehiivKey =
    beehiivKey && beehiivKey !== null ? encrypt(beehiivKey) : beehiivKey;
  const encryptedPublicationId =
    beehiivPublicationId && beehiivPublicationId !== null
      ? encrypt(beehiivPublicationId)
      : beehiivPublicationId;

  await db.user.update({
    where: {
      id: userId,
    },
    data: {
      ...rest,
      ...(showBranding !== undefined && {
        showBranding: plan.isPro ? showBranding : true,
      }),
      ...(category && { category: category as UserCategory }),
      beehiivKey: encryptedBeehiivKey,
      beehiivPublicationId: encryptedPublicationId,
    },
  });
}

export async function updateDomain(
  user: Pick<User, "id" | "domain">,
  domain?: string | null,
) {
  if (domain === null) {
    await Promise.all([
      db.user.update({
        where: {
          id: user.id,
        },
        data: {
          domain: null,
        },
      }),
      removeDomain(user.domain as string),
    ]);

    return new Response(null, { status: 200 });
  }

  if (domain) {
    if (domain !== user.domain) {
      await removeDomain(user.domain as string);
    }
    await Promise.all([
      db.user.update({
        where: {
          id: user.id,
        },
        data: {
          domain,
        },
      }),
      addDomain(domain),
    ]);

    return new Response(null, { status: 200 });
  }
}

export async function deleteUser(userId: string, lsId: string | null) {
  await Promise.all([
    lsId ? cancelSubscription(lsId) : null,
    db.user.delete({
      where: {
        id: userId,
      },
    }),
  ]);
}

type CreateWorkExperienceSchema = z.infer<typeof workExperienceFormSchema>;
type UpdateWorkExperienceSchema = z.infer<typeof workExperiencePatchSchema>;

export async function createWorkExperience(
  userId: string,
  data: CreateWorkExperienceSchema,
) {
  return await db.workExperience.create({
    data: {
      userId,
      ...data,
    },
  });
}

export async function updateWorkExperience(
  workExperienceId: string,
  userId: string,
  data: UpdateWorkExperienceSchema,
) {
  return await db.workExperience.update({
    where: {
      id: workExperienceId,
      userId,
    },
    data,
  });
}

export async function deleteWorkExperience(
  workExperienceId: string,
  userId: string,
) {
  return await db.workExperience.delete({
    where: {
      id: workExperienceId,
      userId,
    },
  });
}
