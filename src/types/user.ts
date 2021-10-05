export interface PublicUser {
  username: string;
  bio: string | null;
  image: string | null;
  uid: string;
}

export interface User extends PublicUser {
  email: string;
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