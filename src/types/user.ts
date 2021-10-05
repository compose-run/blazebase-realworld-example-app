export interface PublicUser {
  username: string;
  bio: string | null;
  image: string | null;
  publicKey: string;
}

export interface User extends PublicUser {
  email: string;
  encryptedPrivateKey: string;
}

export interface UserSettings extends PublicUser {
  email: string;
  password: string | null;
}

export interface UserForRegistration {
  username: string;
  email: string;
  password: string;
}