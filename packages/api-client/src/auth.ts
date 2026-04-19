import { z } from "zod";
import { BadRequestError } from "@flux/shared";
import type { RestClient } from "./rest";

/**
 * 사용자 엔티티는 Phase 1 shared에 정의가 없어 내부 스키마로 정의한다.
 * 추후 shared에 User 스키마가 추가되면 그쪽을 사용한다.
 */
export const UserSchema = z.object({
  id: z.string().min(1),
  email: z.email(),
});
export type User = z.infer<typeof UserSchema>;

export const AuthResponseSchema = z.object({
  user: UserSchema,
  token: z.string().min(1),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const RegisterInputSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export class AuthApi {
  constructor(private rest: RestClient) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const parsed = RegisterInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestError(`invalid register input: ${parsed.error.message}`);
    }
    return this.rest.request({
      method: "POST",
      path: "/auth/register",
      body: parsed.data,
      schema: AuthResponseSchema,
    });
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const parsed = LoginInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestError(`invalid login input: ${parsed.error.message}`);
    }
    return this.rest.request({
      method: "POST",
      path: "/auth/login",
      body: parsed.data,
      schema: AuthResponseSchema,
    });
  }

  me(): Promise<User> {
    return this.rest.request({
      method: "GET",
      path: "/auth/me",
      schema: UserSchema,
    });
  }
}
