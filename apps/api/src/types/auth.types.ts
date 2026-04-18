export interface IndividualRegisterDTO {
  role: 'USER';
  name: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
}

export interface PartnerRegisterDTO {
  role: 'PARTNER';
  businessName: string;
  contactPerson: string;
  businessEmail: string;
  phone: string;
  password: string;
  services: string[]; // PartnerType enum values
}

export type RegisterDTO = IndividualRegisterDTO | PartnerRegisterDTO;

export interface LoginDTO {
  email: string;
  password: string;
}

export interface ResetPasswordDTO {
  token: string;
  password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  status: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  role: 'USER' | 'PARTNER';
}

export interface JWTPayload {
  userId: number;
  role: string;
  iat?: number;
  exp?: number;
}
