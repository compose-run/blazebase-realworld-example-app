import { dispatchOnCall, store } from '../../../state/store';
import { useStoreWithInitializer } from '../../../state/storeHooks';
import { buildGenericFormField } from '../../../types/genericFormField';
import { GenericForm } from '../../GenericForm/GenericForm';
import { initializeRegister, RegisterState, startSigningUp, updateErrors, updateField } from './Register.slice';
import { newKeypair, UserForRegistration, useUsers, encryptPrivateKeyWithPassword } from '../../../types/user';
import { ContainerPage } from '../../ContainerPage/ContainerPage';
import { useEffect, useState } from 'react';
import { loadKeyPair } from '../../App/App.slice';

export function Register() {
  const { errors, signingUp, user } = useStoreWithInitializer(
    ({ register }) => register,
    dispatchOnCall(initializeRegister())
  );

  const [users, emitUserAction] = useUsers();

  function onSignUp(user: UserForRegistration) {
    return async (ev: React.FormEvent) => {
      ev.preventDefault();
      store.dispatch(startSigningUp());

      const keypair = newKeypair()

      const { errors } = await emitUserAction({
        type: "SIGN_UP",
        user: {
          username: user.username, 
          email: user.email, 
          publicKey: keypair.publicKey, 
          encryptedPrivateKey: encryptPrivateKeyWithPassword(temporaryKeypair.privateKey, user.password)
        }
      })
    
      if (errors.length) {
        store.dispatch(updateErrors(errors))
      } else {
        store.dispatch(loadKeyPair(keypair))
        location.hash = '#/';
      }
      
    }
  }

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