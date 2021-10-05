import { firebaseAuth, useRealtimeReducer, useRealtimeReducer2 } from '../services/compose';
import { GenericErrors } from '../types/error';
import { Profile } from '../types/profile';
import { User } from '../types/user';
interface SignUpUserAction {
  type: "SIGN_UP";
  user: User;
}
interface UpdateUserAction {
  type: "UPDATE";
  newUser: User;
  uid: string;
}

type UserAction = SignUpUserAction | UpdateUserAction

const usersVersion = 100
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
    if (users.some(u => u.uid === action.user.uid)) {
      errors['public-key'] = "already in use"
    }
    if (!Object.keys(errors).length) {
      returnValue = users.concat([action.user])
    }
  } else if (action.type === "UPDATE") {
    if (action.uid) {
      returnValue = users.map(u => u.uid === action.uid ? action.newUser : u)
    } else {
      errors['unauthorized'] = 'to perform update to user'
    }
  }
  resolve(errors)
  return returnValue
}, [], null)

export const useProfiles = ():Profile[] => {
  const user = useUser();
  const [ users ] = useUsers()
  const [ followers ] = useFollowers()

  return users && users.map(u => ({
    ...u, 
    following: user && followers && !!(followers[user.uid] || {})[u.uid]
  }))
}

export const useFollowers = () => useRealtimeReducer2({
  name: `conduit-followers-${usersVersion}`,
  initialState: {}, //getRealtimeState(`conduit-followers-${usersVersion+2}`),
  loadingState: null,
  reducer: (userFollowers, action, resolve) => {
    const { follower, leader } = action

    if (action.uid !== follower) {
      resolve({errors: {'unauthorized': 'to perform this action'}})
      return userFollowers
    }
    
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

export const useUser = () => {
  const firebaseUser = firebaseAuth.currentUser
  const [users] = useUsers()
  
  return firebaseUser && users && users.find(user => user.uid === firebaseUser.uid)
}
