import React from 'react';
import { dispatchOnCall, store } from '../../../state/store';
import { useStoreWithInitializer } from '../../../state/storeHooks';
import { decryptPrivateKeyWithPassword, useUsers } from '../../../types/user';
import { buildGenericFormField } from '../../../types/genericFormField';
import { GenericForm } from '../../GenericForm/GenericForm';
import { initializeLogin, LoginState, startLoginIn, updateErrors, updateField } from './Login.slice';
import { ContainerPage } from '../../ContainerPage/ContainerPage';
import { loadKeyPair } from '../../App/App.slice';

export function Login() {
  const { errors, loginIn, credentials } = useStoreWithInitializer(({ login }) => login, dispatchOnCall(initializeLogin()));

  const [users] = useUsers()

  function signIn(ev: React.FormEvent) {
    ev.preventDefault();
  
    if (store.getState().login.loginIn) return;
    store.dispatch(startLoginIn());
  
    const user = users.find(u => u.email === credentials.email)
    if (!user) {
      store.dispatch(updateErrors({"email": ["not found"]}))
      return 
    }

    try {
      const privateKey = decryptPrivateKeyWithPassword(user.encryptedPrivateKey, credentials.password)
      store.dispatch(loadKeyPair({privateKey, publicKey: user.publicKey}))
      location.hash = '#/';
    } catch {
      // TODO throw if decryption fails
      store.dispatch(updateErrors({"password": ["is incorrect"]}))
    }
  }

  return (
    <div className='auth-page'>
      <ContainerPage>
        <div className='col-md-6 offset-md-3 col-xs-12'>
          <h1 className='text-xs-center'>Sign in</h1>
          <p className='text-xs-center'>
            <a href='/#/register'>Need an account?</a>
          </p>

          <GenericForm
            disabled={loginIn}
            formObject={credentials}
            submitButtonText='Sign in'
            errors={errors}
            onChange={onUpdateField}
            onSubmit={signIn}
            fields={[
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
  store.dispatch(updateField({ name: name as keyof LoginState['credentials'], value }));
}
