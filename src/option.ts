export type Option<T> = Some<T> | None;

export function as_option<T>(fn: () => T): Option<T> {
    try {
        return Some(fn());
    } catch (x) {
        return None;
    }
}

export type Some<T> = {
    is_some(): this is Some<T>;
    is_none(): this is None;
    map<U>(fn: (arg: T) => U): Some<U>
    unwrap(): T,
    unwrap_or(): T,
    unwrap_or_else(): T
}
export type None = {
    is_some<T>(): this is Some<T>;
    is_none(): this is None;
    map(): None
    unwrap(_: never): never,
    unwrap_or<T>(value: T): T,
    unwrap_or_else<T>(otherwise: () => T): T
};

export const Some = <T>(value: T) => ({
    // TODO: expect
    is_some() { return true; },
    is_none() { return false; },
    map(fn) { return Some(fn(value)) },
    unwrap() { return value; },
    unwrap_or() { return value; },
    unwrap_or_else() { return value; },
    toString() { return `Some(${value})`; }
}) as Some<T>;
export const None = Object.freeze({
    is_some() { return false; },
    is_none() { return true; },
    map() { return None; },
    unwrap(_) { throw Error("Cannot call unwrap on None"); },
    unwrap_or(value) { return value; },
    unwrap_or_else(otherwise) { return otherwise() },
    toString() { return "None"; }
}) as None;