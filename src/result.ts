export type Result<T, E> = Ok<T, E> | Err<T, E>;

export function as_result<T>(fn: () => T): Result<T, unknown> {
    try {
        return Ok(fn());
    } catch (x) {
        return Err(x);
    }
}

type ResultMatcher<T, E, R> = {
    Ok(v: T): R;
    Err(e: E): R;
}

export type Ok<T, E> = {
    is_ok(): this is Ok<T, E>;
    is_err(): this is Err<T, unknown>;
    map<U>(fn: (arg: T) => U): Ok<U, E>;
    map_err(): Ok<T, E>;
    match<R>(matcher: ResultMatcher<T, E, R>): R;
    match<R>(on_ok: (v: T) => R, on_err: (e: E) => R): R;
    unwrap(): T;
    unwrap_or(): T;
    unwrap_or_else(): T;
}
export type Err<T, E> = {
    is_ok(): this is Ok<unknown, E>;
    is_err(): this is Err<T, E>;
    map(): Err<T, E>;
    map_err<F>(fn: (arg: E) => F): Err<T, F>;
    match<R>(matcher: ResultMatcher<T, E, R>): R;
    match<R>(on_ok: (v: T) => R, on_err: (e: E) => R): R;
    unwrap(_: never): never;
    unwrap_or<T>(default_value: T): T;
    unwrap_or_else<T>(otherwise: (err: E) => T): T;
}

export const Ok = <T, E>(value: T) => ({
    // TODO: expect
    is_ok() { return true; },
    is_err() { return false; },
    map(fn) { return Ok(fn(value)); },
    map_err() { return this; },
    unwrap() { return value; },
    unwrap_or() { return value; },
    unwrap_or_else() { return value; },
    match<R>(matcher_or_ok, err) {
        if (("Ok" in matcher_or_ok) && ("Err" in matcher_or_ok)) {
            return (matcher_or_ok as ResultMatcher<T, E, R>).Ok(value);
        }
        return matcher_or_ok(value);
    },
    toString() { return `Ok(${value})`; },
}) as Ok<T, E>;
export const Err = <T, E>(error: E) => ({
    // TODO: expect
    is_ok() { return false; },
    is_err() { return true; },
    map() { return this; },
    map_err(fn) { return Err(fn(error)); },
    unwrap(_) { throw Error("Cannot call unwrap on an Err value") },
    unwrap_or(default_value) { return default_value; },
    unwrap_or_else(otherwise) { return otherwise(error); },
    match<R>(matcher_or_ok, err) {
        if (("Ok" in matcher_or_ok) && ("Err" in matcher_or_ok)) {
            return (matcher_or_ok as ResultMatcher<T, E, R>).Err(error);
        }
        return err(error);
    },
    toString() { return `Err(${error})`; },
}) as Err<T, E>;

declare let a: Result<string, Error>;