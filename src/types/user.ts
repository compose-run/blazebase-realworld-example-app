import { Some, None, Option } from '@hqoss/monads';
import { Decoder, nullable, object, string } from 'decoders';
import { useRealtimeReducer } from '../services/compose';
import { useStore } from '../state/storeHooks';
import { GenericErrors } from './error';

export interface PublicUser {
  username: string;
  bio: string | null;
  image: string | null;
}

export interface User extends PublicUser {
  email: string;
  publicKey: string;
  encryptedPrivateKey: string;
}

// issue with decoder library incorrectly converting 
// non optional fields to optional fields
// https://github.com/nvie/decoders/issues/750
// @ts-expect-error 
export const userDecoder: Decoder<User> = object({
  email: string,
  username: string,
  publicKey: string,
  encryptedPrivateKey: string,
  bio: nullable(string),
  image: nullable(string)
});

export interface UserSettings extends PublicUser {
  email: string;
  password: string | null;
}

export interface UserForRegistration {
  username: string;
  email: string;
  password: string;
}

export function loadUserIntoApp(user: User) {
  return
}

// TODO - do this with actual crypto
export const newKeypair = () => ({publicKey: Math.random().toString(), privateKey: Math.random().toString()})

// TODO - do this with actual crypto
export function encryptPrivateKeyWithPassword(privateKey, password) {
  return privateKey.split('').reverse().join(password)
}

// TODO - do this with actual crypto
export function decryptPrivateKeyWithPassword(encryptedPrivateKey, password) {
  return encryptedPrivateKey.split(password).reverse().join('')
}

// TODO - do this with actual crypto
function verifySignature(publiKey, signature) {
  return publiKey == signature
}

// TODO - do this with actual crypto
function signed(action) {
  return verifySignature(action.publicKey, action.signature)  
}

// TODO - do this with actual crypto
export function sign(privateKey, action) {
  return { ...action, signature: action.publicKey}
}

interface SignUpUserAction {
  type: "SIGN_UP";
  user: User;
}

interface UpdateUserAction {
  type: "UPDATE";
  newUser: User;
  signature: string;
  publicKey: string;
}

type UserAction = SignUpUserAction | UpdateUserAction

export const useUsers = () => useRealtimeReducer<User[], UserAction, GenericErrors>('conduit-users-10', (users, action, resolve) => {
  if (action.type === "SIGN_UP") {
    let errors = {}
    if (users.some(u => u.email === action.user.email)) {
      errors['email'] = "already in use"
    }
    if (users.some(u => u.username === action.user.username)) {
      errors['username'] = "already in use"
    }
    if (users.some(u => u.publicKey === action.user.publicKey)) {
      errors['public-key'] = "already in use"
    }
    if (!Object.keys(errors).length) {
      users.concat([action.user])
    }
    resolve(errors)
  } else if (action.type === "UPDATE" && signed(action)) {
    return users.map(u => u.publicKey === action.publicKey ? action.newUser : u)
  } else {
    return users
  }
}, [], [])


export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

function wrap<A>(a: A|null|undefined):Option<A> {
  if (a === null || a === undefined){ 
    return None
  } else {
    return Some(a)
  }
}

export const getKeyPair = () => wrap(JSON.parse(localStorage.getItem("keypair")))
export const setKeyPair = keypair => localStorage.setItem("keypair", JSON.stringify(keypair))

export const useUser = () => {
  const [users] = useUsers()
  const { keypair } = useStore(({ app }) => app);
  
  return keypair.andThen(kp =>
    wrap(users.find(user => user.publicKey === kp.publicKey))
  )
}
