import { z } from 'zod';

const NonEmptyString = z.string().trim().min(1);

export const MatchStatusSchema = z.enum(['scheduled', 'finished', 'tbc']);

export const CreateMatchSchema = z
  .object({
    homeTeam: NonEmptyString,
    awayTeam: NonEmptyString,
    homeScore: z.coerce.number().int().min(0).nullable().optional(),
    awayScore: z.coerce.number().int().min(0).nullable().optional(),
    date: z.union([z.coerce.date(), z.null()]).optional(),
    venue: z.string().trim().min(1).nullable().optional(),
    status: MatchStatusSchema.optional(),
    round: z.string().trim().min(1).nullable().optional(),
  })
  .refine(
    (v) => (v.status ?? 'scheduled') === 'tbc' || v.date instanceof Date,
    { message: 'date is required when status is not tbc', path: ['date'] }
  );

export const CreateAnnouncementSchema = z.object({
  title: z.string().trim().min(1).nullable().optional(),
  content: NonEmptyString,
  date: z.coerce.date(),
});

export const TeamSettingsSchema = z.object({
  teamName: NonEmptyString,
  homeKitColor: NonEmptyString,
  awayKitColor: NonEmptyString,
});

export const CreatePlayerSchema = z.object({
  name: NonEmptyString,
  jerseyNumber: z.coerce.number().int().min(1).max(99),
  position: NonEmptyString,
  team: z.string().trim().min(1).optional(),
  age: z.coerce.number().int().min(16).max(50),
  nationality: z.string().trim().nullable().optional(),
  height: z.coerce.number().int().min(150).max(220).nullable().optional(),
  weight: z.coerce.number().int().min(50).max(120).nullable().optional(),
  joinedDate: z.coerce.date().optional(),
  status: z.string().trim().nullable().optional(),
  phoneNumber: z.string().trim().nullable().optional(),
  email: z.string().trim().email().nullable().optional(),
  emergencyContact: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  photoUrl: z.string().trim().url().nullable().optional(),
  identityPrefix: z.string().trim().max(10).nullable().optional(),
});

export const DeleteByIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const RegisterSchema = z.object({
  email: z.string().trim().email(),
  username: z.string().trim().min(2).max(50),
  password: z.string().min(6).max(200),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

export const ChangePasswordFirstTimeSchema = z
  .object({
    newPassword: z.string().min(8).max(200),
    confirmPassword: z.string().min(8).max(200),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const TeamPasswordSetSchema = z.object({
  team: NonEmptyString,
  password: z.string().min(8).max(200),
});

export const TeamPasswordResetSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

export const ManagerAccountsSchema = z.object({
  regenerate: z.boolean().optional(),
  mode: z.enum(['random', 'shared']).optional(),
});

export const MatchGoalsSchema = z.object({
  entries: z
    .array(
      z.object({
        playerId: z.coerce.number().int().positive(),
        goals: z.coerce.number().int().min(0).max(20),
      })
    )
    .default([]),
});
