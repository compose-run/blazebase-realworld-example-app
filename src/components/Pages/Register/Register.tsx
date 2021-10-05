import { buildGenericFormField } from '../../../types/genericFormField';
import { GenericForm } from '../../GenericForm/GenericForm';
import { newKeypair, useUsers, encryptPrivateKeyWithPassword, setKeyPair } from '../../../types/user';
import { ContainerPage } from '../../ContainerPage/ContainerPage';
import { useState } from 'react';

export function Register() {

  const [errors, setErrors] = useState({})
  const [signingUp, setSigningUp] = useState(false)
  const [user, setUser] = useState({username: '', email: '', password: ''})

  const [users, emitUserAction] = useUsers();

  function onUpdateField(name: string, value: string) {
    setUser({...user, [name]: value})
  }

  async function onSignUp(ev: React.FormEvent) {
    ev.preventDefault();
    setSigningUp(true)

    const keypair = newKeypair()

    const errors = await emitUserAction({
      type: "SIGN_UP",
      user: {
        username: user.username, 
        email: user.email, 
        publicKey: keypair.publicKey, 
        encryptedPrivateKey: encryptPrivateKeyWithPassword(keypair.privateKey, user.password),
        bio: null,
        image: null
      }
    })

    setSigningUp(false)
  
    if (Object.keys(errors).length) {
      setErrors(errors)
    } else {
      setKeyPair(keypair)
      location.hash = '#/';
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
            onSubmit={onSignUp}
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