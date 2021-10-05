import { useReducer, useEffect, useCallback, useRef, Reducer, Dispatch, ReducerAction, ReducerState } from "react";
import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  onSnapshot,
  orderBy,
  limit,
  doc,
  getDoc,
  getDocs,
  setDoc,
  FieldValue
} from "firebase/firestore";

/*
Cleanup auth & add firebase auth (and permissions on firebase)

Comment code compose.ts file
Make a proper open source repo for firebase wrapper with a proper name
Convert below todos to issues
*/

// TODO - a la Conductor (and triple store) make each thing an ID-editable thing; & also push deeper into references
// TODO - ensure that we only pull one namespace globally so we don't double subscribe and proccess things (maybe via wrapping in memoize?)
// TODO - need a better recovery for when you accidentally overwrite the state (and want to migrate back to a state that doesn't exist semantically)
// TODO - need better handling of normalization/denormalization (relationships) & querying

// TODO - allow key-based lookup when not the whole object is needed
// TODO - allow full range of firebase querying for reduced state (otherwise pulling everything in every sub component kills composability really)
// TODO - disallow randomness (and other non-determinisim) or make it determantistic https://croquet.io/docs/croquet/tutorial-2_8_random.html

// TODO - minify reducer before caching to ignore comments and whitespace etc https://www.npmjs.com/package/uglify-js (how does croquet do this?)
// TODO - useOptimisticRealtimeReducer: optimistic updates (proccess stream events locally instead of server roundtrip; and then jumps to new server state if it's difference)
// TODO - disallow "/" in names or encode it for people
// TODO - catch all firebase errors
// TODO - garbage collect localstorage cache (and firebase cache) 

const firebaseConfig = {
  apiKey: "AIzaSyDZtMhc933h53_fbJFmyM76Mh6aRreHZE8",
  authDomain: "compose-run.firebaseapp.com",
  projectId: "compose-run",
  storageBucket: "compose-run.appspot.com",
  messagingSenderId: "685832812042",
  appId: "1:685832812042:web:9c1ff1eca82128832791f3",
  measurementId: "G-ZX4ZC2215P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
});

export const useReducerSafe = <R extends Reducer<any, any>>(
  reducer: R,
  initialState: ReducerState<R>,
): [ReducerState<R>, Dispatch<ReducerAction<R>>] => {
  const [val, dispatch] = useReducer(reducer, initialState);
  const mountedRef = useRef<boolean>();
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const safeDispatch = useCallback(
    (s) => {
      if (mountedRef.current) {
        dispatch(s);
      }
    },
    [dispatch]
  );
  return [val, safeDispatch];
};

export const emit = async (type: string, name: string, value: any, ts: { (): FieldValue; (): FieldValue; } | undefined, id) => {
  try {
    await addDoc(collection(db, type, name, "values"), {
      value,
      ts: ts || serverTimestamp(),
      id
    });
  } catch (e) {
    console.error("Error emitting event: ", e);
  }
};

window.composeResolvers = {}
export function emitWithResponse(name, value) {
  const id = Math.random()
  const promise = new Promise((resolve, reject) => window.composeResolvers[id] = resolve)
  emit("streams", name, value, undefined, id)

  return promise
}

function cacheBehaviorLocalStorage(name: string, value: any, ts: { (): FieldValue; (): FieldValue; (): FieldValue; }) {
  localStorage.setItem(
    `compose-cache-${name}`,
    JSON.stringify({
      value,
      ts
    })
  );
}

function getCachedBehaviorLocalStorage(name: string) {
  const cache = localStorage.getItem(`compose-cache-${name}`);
  if (cache) {
    return JSON.parse(cache).value; // maybe do something with ts eventually;
  }
}

// pull from localstorage
export const getRealtimeState = (name: string) => {
  const initialBehaviorFromCacheQuery = query(
    collection(db, "behaviors", name, "values"),
    orderBy("ts", "desc"),
    limit(1)
  );
  return getDocs(initialBehaviorFromCacheQuery).then((querySnapshot) => {
    let doc = querySnapshot.docs[0];
    if (doc && !doc.metadata.hasPendingWrites) {
      return doc.data().value;
    }
  });
};

// // simulated server-side function
// // cache inputs and outputs
// export const realtimeFunction = (f: (a: any) => any) => {
//   return f;
// };

// export function useRealtimeFunction(f: (a: any) => any, ...args: any) {
//   const [returnValue, setReturnValue] = useState({
//     value: null,
//     loading: true
//   });

//   useEffect(
//     () =>
//       realtimeFunction(f)(...args).then((value) =>
//         setReturnValue({
//           value,
//           loading: false
//         })
//       ),
//     [f, args]
//   );

//   return [returnValue.value, returnValue.loading];
// }

// TODO - make this work even when not in a component on the page by pulling def from firebase
// export const useRealtimeState = (name: string) => {
//   const [realtimeState, setRealtimeState] = useState({ progress: "loading", state: null });
//   useEffect(() => {
//     const behaviorFromCache = query(
//       collection(db, "behaviors", name, "values"),
//       orderBy("ts", "desc"),
//       limit(1)
//     );
//     return onSnapshot(behaviorFromCache, (querySnapshot) => {
//       let doc = querySnapshot.docs[0];
//       if (doc) {
//         setRealtimeState({ progress: "loaded", state: doc.data().value });
//       } else {
//         setRealtimeState({ progress: "loaded", state: null });
//       }
//     });
//   }, [name]);
//   return [realtimeState.state, realtimeState.progress === "loading"];
// };

function saveReducer(name: string, reducerCode: string, initial: any) {
  setDoc(doc(db, "behaviors-reducers", name), {
    reducerCode,
    initial
  });
}

interface RegisterEmitToSelf<a, b> {
  emitToSelf: (event: RealtimeEvent<a, b>) => void;
  kind: "RegisterEmitToSelf";
}

interface MismatchedReducerEvent {
  kind: "MismatchedReducerEvent";
}

interface ReductionEvent<b> {
  value: b;
  ts: typeof serverTimestamp;
  kind: "ReductionEvent";
  id: any;
}

interface CacheLoadedEvent<a> {
  currentValue: a;
  ts: typeof serverTimestamp;
  kind: "CacheLoadedEvent";
}

interface CacheEmptyEvent {
  kind: "CacheEmptyEvent";
}

interface InitialValuePromiseLoadedEvent<a> {
  currentValue: a;
  kind: "InitialValuePromiseLoadedEvent";
}

type RealtimeEvent<a, b> =
  | RegisterEmitToSelf<a, b>
  | MismatchedReducerEvent
  | CacheLoadedEvent<a>
  | CacheEmptyEvent
  | InitialValuePromiseLoadedEvent<a>
  | ReductionEvent<b>;

interface LoadingEmitToSelf<a, b> {
  currentValue: a;
  pendingEvents: ReductionEvent<b>[];
  kind: "LoadingEmitToSelf";
}

interface MismatchedReducer<a> {
  currentValue: a;
  kind: "MismatchedReducer";
}

interface LoadingFromCache<a, b> {
  currentValue: a;
  emitToSelf: (event: RealtimeEvent<a, b>) => void;
  pendingEvents: ReductionEvent<b>[];
  kind: "LoadingFromCache";
}

interface LoadingFromPromise<a, b> {
  currentValue: a;
  pendingEvents: ReductionEvent<b>[];
  kind: "LoadingFromPromise";
}

interface SetFromInitialValue<a> {
  currentValue: a;
  kind: "SetFromInitialValue";
}

interface SetFromCacheOrReduction<a> {
  currentValue: a;
  ts: typeof serverTimestamp;
  kind: "SetFromCacheOrReduction";
}

type RealtimeReducerContext<a, b> =
  | LoadingEmitToSelf<a, b>
  | MismatchedReducer<a>
  | LoadingFromCache<a, b>
  | LoadingFromPromise<a, b>
  | SetFromInitialValue<a>
  | SetFromCacheOrReduction<a>;

function getResolver(eventId) {
  const resolver = window.composeResolvers[eventId]
  if (resolver) {
    return (...args) => {
      delete window.composeResolvers[eventId]
      return resolver(...args)
    }
  } else {
    return () => void(0)
  }
}

function realtimeReducer<a, b>(
  name: string,
  reducer: (acc: a, curr: b, resolver? : (c: any) => void) => a,
  initialValue: a | Promise<a>,
  loadingValue: a,
  context: RealtimeReducerContext<a, b>,
  event: RealtimeEvent<a, b>
): RealtimeReducerContext<a, b> {
  const cacheOrLoadingValue =
    getCachedBehaviorLocalStorage(name) || loadingValue;
  if (context.kind === "MismatchedReducer") {
    return context;
  } else if (event.kind === "MismatchedReducerEvent") {
    return {
      kind: "MismatchedReducer",
      currentValue: context.currentValue
    };
  } else if (context.kind === "LoadingEmitToSelf") {
    if (event.kind === "RegisterEmitToSelf") {
      return {
        emitToSelf: event.emitToSelf,
        pendingEvents: context.pendingEvents,
        currentValue: cacheOrLoadingValue,
        kind: "LoadingFromCache"
      };
    } else if (event.kind === "ReductionEvent") {
      return {
        pendingEvents: context.pendingEvents.concat([event]),
        currentValue: cacheOrLoadingValue,
        kind: "LoadingEmitToSelf"
      };
    } else {
      return context;
    }
  } else if (event.kind === "RegisterEmitToSelf") {
    // no - op, because already registered
    return context;
  } else if (context.kind === "LoadingFromCache") {
    if (event.kind === "CacheLoadedEvent") {
      cacheBehaviorLocalStorage(name, event.currentValue, event.ts);
      return {
        currentValue: event.currentValue,
        ts: event.ts,
        kind: "SetFromCacheOrReduction"
      };
    } else if (event.kind === "CacheEmptyEvent") {
      if ("then" in initialValue) {
        initialValue.then((value) => {
          context.emitToSelf({
            currentValue: value,
            kind: "InitialValuePromiseLoadedEvent"
          });
        });
        return {
          currentValue: cacheOrLoadingValue,
          pendingEvents: context.pendingEvents,
          kind: "LoadingFromPromise"
        };
      } else {
        saveReducer(name, reducer.toString(), initialValue);
        const newContext = context.pendingEvents.reduce(
          (context: RealtimeReducerContext<a, b>, event) =>
            realtimeReducer(
              name,
              reducer,
              initialValue,
              loadingValue,
              context,
              event
            ),
          {
            currentValue: initialValue,
            kind: "SetFromInitialValue"
          }
        );
        cacheBehaviorLocalStorage(name, newContext.currentValue, newContext.ts);
        emit("behaviors", name, newContext.currentValue, newContext.ts);
        return context;
      }
    } else if (event.kind === "ReductionEvent") {
      return {
        ...context,
        pendingEvents: context.pendingEvents.concat([event])
      };
    } else {
      return context;
    }
  } else if (context.kind === "LoadingFromPromise") {
    if (event.kind === "InitialValuePromiseLoadedEvent") {
      saveReducer(name, reducer.toString(), event.currentValue);
      const newContext = context.pendingEvents.reduce(
        (context: RealtimeReducerContext<a, b>, event) =>
          realtimeReducer(
            name,
            reducer,
            initialValue,
            loadingValue,
            context,
            event
          ),
        {
          currentValue: event.currentValue,
          kind: "SetFromInitialValue"
        }
      );
      cacheBehaviorLocalStorage(name, newContext.currentValue, newContext.ts);
      emit("behaviors", name, newContext.currentValue, newContext.ts);
      return newContext;
    } else if (event.kind === "ReductionEvent") {
      return {
        currentValue: cacheOrLoadingValue,
        pendingEvents: context.pendingEvents.concat([event]),
        kind: "LoadingFromPromise"
      };
    } else {
      return context;
    }
  } else if (context.kind === "SetFromInitialValue") {
    if (event.kind === "ReductionEvent") {
      const currentValue = reducer(context.currentValue, event.value, getResolver(event.id))
      getResolver(event.id)() // delete & resolve if not done in reducer
      cacheBehaviorLocalStorage(name, currentValue, event.ts);
      emit("behaviors", name, currentValue, event.ts);
      return {
        currentValue,
        ts: event.ts,
        kind: "SetFromCacheOrReduction"
      };
    } else {
      return context;
    }
  } else if (context.kind === "SetFromCacheOrReduction") {
    if (event.kind === "ReductionEvent") {
      if (event.ts.toMillis() > context.ts.toMillis()) {
        const currentValue = reducer(context.currentValue, event.value, getResolver(event.id))
        getResolver(event.id)() // delete & resolve if not done in reducer
        cacheBehaviorLocalStorage(name, currentValue, event.ts);
        emit("behaviors", name, currentValue, event.ts);
        return {
          currentValue,
          ts: event.ts,
          kind: "SetFromCacheOrReduction"
        };
      } else {
        return context;
      }
    } else {
      return context;
    }
  } else {
    return context
  }
}

export function useRealtimeReducer<A, B, C>(
  name: string,
  reducer: (acc: A, curr: B, resolver? : (c: C) => void) => A,
  initialValue: A | Promise<A>,
  loadingValue: A
): [A, (b: B) => Promise<C>] {
  const [realtimeContext, emitEvent] = useReducerSafe(
    (context, event) =>
      realtimeReducer(
        name,
        reducer,
        initialValue,
        loadingValue,
        context,
        event
      ),
    {
      currentValue: loadingValue,
      pendingEvents: [],
      kind: "LoadingEmitToSelf"
    }
  );
  useEffect(
    () =>
      emitEvent({
        emitToSelf: emitEvent,
        kind: "RegisterEmitToSelf"
      }),
    []
  );

  // confirm reducer is the same as the initial one
  useEffect(() => {
    getDoc(doc(db, "behaviors-reducers", name)).then((snapshot) => {
      if (snapshot.exists()) {
        const { reducerCode, initial } = snapshot.data();
        if (reducerCode !== reducer.toString()) {
          emitEvent({
            kind: "MismatchedReducer"
          });
          throw new Error(
            `The reducer supplied to ${name} does not exactly match the reducer initially supplied. Bump the name and migrate over data from ${name} to create a new reducer.`
          );
        }
        if (
          !initialValue.then && // todo - find a way to provide this warning for promises
          JSON.stringify(initial) !== JSON.stringify(initialValue)
        ) {
          console.warn(
            `Initial value supplied to reducer ${name} is ignored because initial value already found`
          );
        }
      }
    });
  }, [name, initialValue, reducer, emitEvent]);

  // get initial behavior from cache
  useEffect(() => {
    const initialBehaviorFromCacheQuery = query(
      collection(db, "behaviors", name, "values"),
      orderBy("ts", "desc"),
      limit(1)
    );
    getDocs(initialBehaviorFromCacheQuery).then((querySnapshot) => {
      let doc = querySnapshot.docs[0];
      if (!doc) {
        emitEvent({ kind: "CacheEmptyEvent" });
      } else if (!doc.metadata.hasPendingWrites) {
        emitEvent({
          kind: "CacheLoadedEvent",
          currentValue: doc.data().value,
          ts: doc.data().ts
        });
      }
    });
  }, [name, emitEvent]);

  useEffect(() => {
    const newStreamEventsQuery = query(
      collection(db, "streams", name, "values"),
      orderBy("ts", "desc"),
      limit(1)
    );
    // It seems like this line might not be unsubscribing properly for React
    // sometimes it causes a memory leak warning
    return onSnapshot(newStreamEventsQuery, (querySnapshot) => {
      let doc = querySnapshot.docs[0];
      if (doc && !doc.metadata.hasPendingWrites) {
        emitEvent({
          kind: "ReductionEvent",
          value: doc.data().value,
          ts: doc.data().ts,
          id: doc.data().id
        });
      }
    });
  }, [name, emitEvent]);

  return [
    realtimeContext.currentValue,
    (value) => emitWithResponse(name, value)
  ];
}

export function useRealtimeReducer2({name, initialState, reducer, loadingState }) {
  return useRealtimeReducer(name, reducer, initialState, loadingState)
}