import { Some, None, Option } from '@hqoss/monads';
import { getRealtimeState, useRealtimeReducer, useRealtimeReducer2 } from '../services/compose';
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

const users13 = [
  {
    "encryptedPrivateKey": "7asdasd8asdasd8asdasd1asdasd4asdasd3asdasd3asdasd1asdasd5asdasd9asdasd5asdasd5asdasd0asdasd3asdasd3asdasd9asdasd.asdasd0",
    "publicKey": "0.13867700584931053",
    "image": null,
    "email": "steveykrouse@gmail.com",
    "bio": null,
    "username": "steve"
  },
  {
    "email": "dave@gmail.com",
    "publicKey": "0.6539307721101288",
    "encryptedPrivateKey": "5asdasd7asdasd5asdasd2asdasd8asdasd8asdasd1asdasd7asdasd6asdasd5asdasd7asdasd6asdasd3asdasd9asdasd6asdasd.asdasd0",
    "username": "dave",
    "image": null,
    "bio": null
  }
]

const usersVersion = 15
export const useUsers = () => useRealtimeReducer<User[], UserAction, GenericErrors>(`conduit-users-${usersVersion}`, (users, action, resolve) => {
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
}, users13, null)

export const useProfiles = ():Profile[] => {
  const user = useUser();
  const [ users ] = useUsers()
  const [ followers ] = useFollowers()

  return users && users.map(u => ({
    ...u, 
    following: user.isSome() && followers && !!(followers[user.unwrap().publicKey] || {})[u.publicKey]
  }))
}

export const useFollowers = () => useRealtimeReducer2({
  name: `conduit-followers-${usersVersion+3}`,
  initialState: getRealtimeState(`conduit-followers-${usersVersion+2}`),
  loadingState: null,
  reducer: (userFollowers, action, resolve) => {
    // TODO - authorization
    const { follower, leader } = action
    const following = action.type === "FollowAction"

    return {
      ...userFollowers,
      [follower]: {
        ...(userFollowers[follower] || {}),
        [leader]: following
      }
    }
  }
})

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
    wrap(users && users.find(user => user.publicKey === kp.publicKey))
  )
}
