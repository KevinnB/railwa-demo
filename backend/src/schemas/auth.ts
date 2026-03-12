import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const ErrorSchema = z
  .object({
    error: z.string(),
  })
  .openapi("Error");

export const MessageSchema = z
  .object({
    success: z.boolean(),
  })
  .openapi("Message");

export const AuthResponseSchema = z
  .object({
    token: z.string(),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      emailVerified: z.boolean(),
    }),
  })
  .openapi("AuthResponse");

export const SessionResponseSchema = z
  .object({
    session: z.object({
      id: z.string(),
      userId: z.string(),
      token: z.string(),
      expiresAt: z.string(),
    }),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      emailVerified: z.boolean(),
      image: z.string().nullable(),
    }),
  })
  .openapi("SessionResponse");

export const SessionListItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  token: z.string(),
  expiresAt: z.string(),
});

export const SignUpSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
  })
  .openapi("SignUp");

export const SignInSchema = z
  .object({
    email: z.string().email(),
    password: z.string(),
  })
  .openapi("SignIn");

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string().min(8),
    revokeOtherSessions: z.boolean().optional(),
  })
  .openapi("ChangePassword");

export const UpdateUserSchema = z
  .object({
    name: z.string().min(1).optional(),
    image: z.string().nullable().optional(),
  })
  .openapi("UpdateUser");
