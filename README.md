# Blazebase implementation of the [RealWorld](https://github.com/gothinkster/realworld) spec

## [Live demo](https://compose-run.github.io/blazebase-realworld-example-app/#/)

This codebase was created to demonstrate a fully fledged fullstack application built with React, Typescript, and Blazebase.

For more information on how this works with other frontends/backends, head over to the [RealWorld](https://github.com/gothinkster/realworld) repo.

# How it works

The root of the application is the `src/components/App` component. The App component uses react-router's HashRouter to display the different pages. Each page is represented by a [function component](https://reactjs.org/docs/components-and-props.html).

This application is built following (as much as practicable) functional programming principles:

- Immutable Data
- No classes
- No let or var
- No side effects

The code avoids runtime type-related errors by using Typescript and decoders for data coming from the API.

This project uses prettier and eslint to enforce a consistent code syntax.

## Folder structure

- `src/components` Contains all the functional components.
- `src/components/Pages` Contains the components used by the router as pages.
- `src/state` Contains redux related code.
- `src/services` Contains the code that interacts with external systems (Blazebase).
- `src/types` Contains type definitions alongside the code related to those types.
- `src/config` Contains configuration files.

# Getting started

This project was forked from [ts-redux-react-realworld-example-app](https://github.com/angelguzmaning/ts-redux-react-realworld-example-app) by [@angelguzmaning](https://github.com/angelguzmaning), which was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.

Note: This project will run the app even if linting fails.

### `npm run lint`

Enforces the prettier and eslint rules for this project. This is what is run on the pre-commit hook.

### `npm run build`

Builds the app for production to the `build` folder.

It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.

Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

# Blazebase

_Build fullstack apps rapidly, without leaving your React Component_

Blazebase is an experimental backend-as-a-service to provide realtime persistence to React apps.

We try as much as possible to keep you in the flow of building your React frontend. There's no separate tool you have to use, build step to run, new abstractions to learn, or deploy configurations you have to write. We want it to feel like you're _programming your entire backend inside React hooks!_

The main downside is that it currently doesn't scale past what fits into your user's browser. So that's maybe 10k items? In other words, don't use this if you're building something real that needs to scale. We hope to solve this problem shortly, but we're focused on getting the DX right with small-data applications first. Think: hackathon or side project.

Blazebase is a small, open-source wrapper around Firebase. This provides many services built-in, such as Authentication, Storage, Cloud Functions and more from the Firebase and Google Cloud platforms. Why use Blazebase over Firebase? Blazebase wraps Firebase in functional and reactive abstractions that better fit the React model.

## Install

Blazebase isn't currently ready public use. Contact steve@compose.run if you're interested in giving it a spin.

## Configuring

1. No setup - run your application on our Firebase instance. The upside is you can get started immediately and we store your data for free, but the downside is that we give zero guarantees about it's privacy or availability. Read: we may delete all your data at any time. It is also 100% public.
2. Setup with your own firebase account - _Coming soon_

## API

### `useRealtimeReducer({name, initialValue, reducer}): [value, emitter]`

This is the core Blazebase function. It is a realtime and persistent version of the built-in `useReducer` React hook. Like `useReducer` it takes an `initialValue` (which can be a Promise) and a `reducer` (as keyword arguments), but it also accepts a couple of extra parameters necessary for realtime persistence: `name` to uniquely identify the persistent state and `loadingValue` to be used during the initial load of state.

```ts
useRealtimeReducer<A,B,C>({
  name: string;
  initialValue: A | Promise<A>;
  reducer: (accumulator: A, current: B, resolver?: (c: C) => void) => A;
  loadingValue: A;
}): [A, (b: B) => Promise<C>] {)
```

Like `useReducer`, the `useRealtimeReducer` hook returns an array. The first value represents the realtime, persistent state. The second is a function which allows you to emit values ("actions" in Redux terminology) to the reducer.

You can imagine the reducer "running on the server", but in reality it runs on every user's browser. This means that \_reducers **must** be deterministic. When you use `Date.now` or `Math.random()`, do it on the client and emit it to the reducer.

`userRealtimeReducer` provides a way for the action emitter and reducer to communicate directly with each other. This can useful when the frontend waits on a reducer to confirm or reject an action. For example, when a user picks a name that needs to be unique, your app can `await emitter(someAction)` to which can return a success or rejection message. You can send these messages back to emitters by having your reducer accept a third argument: a `resolver` function, which you can call when you wait to resolve the promise that the emitter is waiting on.

#### Example Usage

TODO

### `getRealtimeState<A>(name: string): Promise<A | null>`

`getRealtimeState` accepts a realtime state name and returns a Promise with it's value.

It can be useful to spy the current value of some state:

```ts
getRealtimeState('my-state-1').then(console.log);
```

It is also useful in migrations:

```ts
const myStateVersion = 8
useRealtimeReducer({
  name: `my-state-${myStateVersion}`,
  initialValue: useRealtimeState(`my-state-${myStateVersion - 1}`),
  ...
})
```

More on this in the **Migrations** sections below.

## Migrations

TODO

#### Example

## Authentication

TODO

### useFirebaseUser

### signInWithEmailAndPassword

### createUserWithEmailAndPassword

## Authorization

TODO
