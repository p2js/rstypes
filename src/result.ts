import { None, Option, Some } from "./option";
/**
 * A succesful value or an expected, recoverable error.
 * 
 * ### Example
 * ```ts
 * function parse_int(n: string): Result<number, string> {
 *     let maybe = parseInt(n);
 *     if(isNaN(maybe)) return Err("Could not parse input");
 *     return Ok(maybe);
 * }
 * 
 * let result = parse_int(3);
 * result.match({
 *     Ok(value)  { console.log("Parsed number: ", value) },
 *     Err(error) { console.error("Error: ", error)}
 * });
 * ```
 */
export type Result<T, E> = Ok<T, E> | Err<T, E>;

/**
 * Wrap a function that can throw, returning `Ok(fn())` if the function returns, `Err(error)` if it throws `error`.
 * @param fn function that potentially throws
 */
export function as_result<A extends any[], T>(fn: (...args: A) => T): (...args: A) => Result<T, any> {
    return (...args) => {
        try {
            return Ok(fn(...args));
        } catch (x) {
            return Err(x);
        }
    }
}

/**
 * Common method signatures for Result types.
 */
interface ResultMethods<T, E> {
    /**
     * Returns `other` if the result is `Ok`, otherwise returns the first result's Err value.
     * @param other result to return if the result is `Ok`.
     */
    and<U>(other: Result<U, E>): Result<U, E>
    /**
     * Transforms `Result<T, E>` into an `Option<E>`, mapping `Ok(value)` to `None` discarding `value`
     * and `Err(error)` to `Some(error)`.
     */
    err(): Option<E>;
    /**
     * Return the contained `Ok` value. Will throw a hard error with the specified message if called on `Err`.
     * @param message custom message to throw if `None`
     */
    expect(message: string): T,
    /**
     * returns `true` if the result is `Ok`, `false` if `Err`.
     */
    is_ok(): this is Ok<T, E>;
    /**
     * returns `true` if the result is `Ok` and the value satisfies
     * the given predicate, `false` otherwise.
     */
    is_ok_and(predicate: (value: T) => boolean): boolean;
    /**
     * returns `false` if the result is `Ok`, `true` if `Err`.
     */
    is_err(): this is Err<T, E>;
    /**
     * returns `true` if the result is `Err` and the error satisfies
     * the given predicate, `false` otherwise.
     */
    is_err_and(predicate: (error: E) => boolean): boolean;
    /**
     * Maps a `Result<T, E>` into a `Result<U, E>`.
     * Will return `Ok(fn(value))` if the result is `Ok`, or propagate `Err`.
     * @param fn function to transform the inner value
     */
    map<U>(fn: (value: T) => U): Result<U, E>;
    /**
     * Maps a `Result<T, E>` into a `Result<T, F>`.
     * Will propagate `Ok`, or return `Err(fn(error))` if the result is `Err`.
     * @param fn function to transform the inner value
     */
    map_err<F>(fn: (error: E) => F): Result<T, F>;
    /**
     * Pattern-match on the result, running the `Ok` or `Err` function in the respective cases.
     * @param matcher object containing an `Ok(value)` and `Err(error)` function to run
     */
    match<R>(matcher: { Ok(value: T): R, Err(error: E): R }): R;
    /**
     * Pattern-match on the result, running the former or latter function
     * in the `Ok` and `Err` cases respectively.
     * 
     * @param on_ok function to run if the result is `Ok(value)`
     * @param on_err function to run if the option is `Err(error)`
     */
    match<R>(on_ok: (value: T) => R, on_err: (error: E) => R): R;
    /**
     * Transforms the `Result<T, E>` into an `Option<T>`, mapping `Ok(value)` to `Some(value)`
     * and `Err(error)` to `None`, discarding `error`.
     */
    ok(): Option<T>;
    /**
     * Returns `other` if the result is `Err`, otherwise returns the first result's `Ok` value.
     * @param other result to return if the result is `Err`.
     */
    or<F>(other: Result<T, F>): Result<T, F>;
    /**
     * Return the contained `Ok` value. Will throw a hard error if called on `Err`. 
     */
    unwrap(): T;
    /**
     * Return the contained `Ok` value, or `default_value` if called on `Err`. 
     * @param default_value value to use if the result is `Err`
     */
    unwrap_or<T>(default_value: T): T;
    /**
     * Return the contained `Ok` value, or the result of `otherwise` if called on `Err`.
     * @param otherwise function to use if the result is `Err`
     */
    unwrap_or_else<T>(otherwise: (error: E) => T): T;
}
/**
 * A succesful result.
 */
export interface Ok<T, E> extends ResultMethods<T, E> {
    err(): None<E>,
    is_err_and(predicate: (error: E) => boolean): false,
    map<U>(fn: (value: T) => U): Ok<U, E>;
    map_err<F>(fn: (error: E) => F): Ok<T, F>;
    ok(): Some<T>;
    or<F>(other: Result<T, F>): Ok<T, F>;
}
/**
 * An expected, recoverable error.
 */
export interface Err<T, E> extends ResultMethods<T, E> {
    and<U>(other: Result<U, E>): Err<U, E>;
    err(): Some<E>;
    expect(message: string): never;
    is_ok_and(predicate: (value: T) => boolean): false,
    map<U>(fn: (value: T) => U): Err<U, E>;
    map_err<F>(fn: (error: E) => F): Err<T, F>;
    ok(): None<T>;
    unwrap(): never;
}

// Implementations
const nodeInspect = Symbol.for('nodejs.util.inspect.custom');
/**
 * @param value Inner value
 */
export const Ok = <T, E>(value: T) => ({
    and(other) { return other; },
    err() { return None; },
    expect() { return value; },
    is_err(): this is Err<T, E> { return false; },
    is_err_and() { return false; },
    is_ok(): this is Ok<T, E> { return true; },
    is_ok_and(predicate) { return predicate(value); },
    map(fn) { return Ok(fn(value)); },
    map_err() { return this; },
    match<R>(matcher_or_ok: { Ok: (value: T) => R } | ((value: T) => R)) {
        if ("Ok" in matcher_or_ok) {
            return (matcher_or_ok as { Ok: (value: T) => R }).Ok(value);
        }
        return matcher_or_ok(value);
    },
    ok() { return Some(value); },
    or() { return this; },
    unwrap() { return value; },
    unwrap_or() { return value; },
    unwrap_or_else() { return value; },
    toString() { return `Ok(${value})`; },
    [nodeInspect](_depth: any, inspectOptions: any, inspect: any) {
        const green = inspectOptions.colors ? `\x1b[${inspect.colors.green[0]}m` : "";
        const reset = inspectOptions.colors ? `\x1b[${inspect.colors.reset[0]}m` : "";
        return `${green}Ok${reset}(${inspect(value, inspectOptions)})`
    }
}) as Ok<T, E>;
/**
 * @param error Inner error
 */
export const Err = <T, E>(error: E) => ({
    and() { return this; },
    err() { return Some(error); },
    expect(message) { throw Error(`${message}: ${error}`) },
    is_err(): this is Err<T, E> { return true; },
    is_err_and(predicate) { return predicate(error); },
    is_ok(): this is Ok<T, E> { return false; },
    is_ok_and() { return false; },
    map() { return this; },
    map_err(fn) { return Err(fn(error)); },
    match<R>(matcher_or_ok: { Err: (error: E) => R } | ((value: T) => R), err?: (error: E) => R) {
        if ("Err" in matcher_or_ok) {
            return (matcher_or_ok as { Err: (error: E) => R }).Err(error);
        }
        return err!(error);
    },
    ok() { return None; },
    or(other) { return other; },
    unwrap() { throw Error(`Called unwrap on an Err value: ${error}`) },
    unwrap_or(default_value) { return default_value; },
    unwrap_or_else(otherwise) { return otherwise(error); },
    toString() { return `Err(${error})`; },
    [nodeInspect](_depth: any, inspectOptions: any, inspect: any) {
        const red = inspectOptions.colors ? `\x1b[${inspect.colors.red[0]}m` : "";
        const reset = inspectOptions.colors ? `\x1b[${inspect.colors.reset[0]}m` : "";
        return `${red}Err${reset}(${inspect(error, inspectOptions)})`
    }
}) as Err<T, E>;