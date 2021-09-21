import { dispatchOnCall, store } from '../../../state/store';
import { useStoreWithInitializer } from '../../../state/storeHooks';
import { buildGenericFormField } from '../../../types/genericFormField';
import { GenericForm } from '../../GenericForm/GenericForm';
import { initializeRegister, RegisterState, startSigningUp, updateErrors, updateField } from './Register.slice';
import { loadUserIntoApp, UserForRegistration } from '../../../types/user';
import { signUp } from '../../../services/conduit';
import { ContainerPage } from '../../ContainerPage/ContainerPage';
import { getRealtimeState, useRealtimeReducer } from '../../../services/compose';
import { useEffect } from 'react';

getRealtimeState("conduit-users-2").then(console.log)

export function Register() {
  const { errors, signingUp, user } = useStoreWithInitializer(
    ({ register }) => register,
    dispatchOnCall(initializeRegister())
  );

  const [users, emitUserAction] = useRealtimeReducer('conduit-users-2', (users, action) => {
    if (action.type === "SIGN_UP") {
      if (true) { // validation succeeds
        return users.concat([action.user])
      }
    }
  }, [], [])

  function onSignUp(user: UserForRegistration) {
    return (ev: React.FormEvent) => {
      ev.preventDefault();
      store.dispatch(startSigningUp());
      const publicKey = Math.random()
      emitUserAction({
        type: "SIGN_UP",
        user: {username: user.username, email: user.email, publicKey}
      })
    }
  }
  

  // also check public key
  const remoteUser = users.find(u => user.email === u.email && user.username === u.username)

  useEffect(() => {
    if (remoteUser) {
      location.hash = '#/';
      // loadUserIntoApp(user); TODO load something into app with private key
    }
  }, [remoteUser])


  return (
    <div className='auth-page'>
      <ContainerPage>
        <div className='col-md-6 offset-md-3 col-xs-12'>
          <h1 className='text-xs-center'>Sign up</h1>
          <p className='text-xs-center'>
            <a href='/#/login'>Have an account?</a>
          </p>

          <GenericForm
            disabled={signingUp}
            formObject={user as unknown as Record<string, string>}
            submitButtonText='Sign up'
            errors={errors}
            onChange={onUpdateField}
            onSubmit={onSignUp(user)}
            fields={[
              buildGenericFormField({ name: 'username', placeholder: 'Username' }),
              buildGenericFormField({ name: 'email', placeholder: 'Email' }),
              buildGenericFormField({ name: 'password', placeholder: 'Password', type: 'password' }),
            ]}
          />
        </div>
      </ContainerPage>
    </div>
  );
}

function onUpdateField(name: string, value: string) {
  store.dispatch(updateField({ name: name as keyof RegisterState['user'], value }));
}

