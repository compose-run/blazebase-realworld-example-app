import { Some, None, Option } from '@hqoss/monads';
import { Decoder, nullable, object, string } from 'decoders';
import { useRealtimeReducer } from '../services/compose';
import { useStore } from '../state/storeHooks';
import { GenericErrors } from './error';
import { Profile } from './profile';

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
export function signed(action) {
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

export const useUsers = () => useRealtimeReducer<User[], UserAction, GenericErrors>('conduit-users-13', (users, action, resolve) => {
  let errors = {}
  let returnValue = users
  if (action.type === "SIGN_UP") {
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
      returnValue = users.concat([action.user])
    }
  } else if (action.type === "UPDATE") {
    if (signed(action)) {
      returnValue = users.map(u => u.publicKey === action.publicKey ? action.newUser : u)
    } else {
      errors['unauthorized'] = 'to perform update to user'
    }
  }
  resolve(errors)
  return returnValue
}, [], [])

export const useProfiles = ():Profile[] => {
  const [ users ] = useUsers()
  return users.map(user => ({...user, following: false})) // TODO
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export function wrap<A>(a: A|null|undefined):Option<A> {
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
