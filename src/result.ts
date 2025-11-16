/**
 * Type used to represent either a succesful value or an expected, recoverable error.
 * 
 * ### Example
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
 */
export type Result<T, E> = Ok<T, E> | Err<T, E>;

/**
 * Wrap a function that can throw, returning `Ok(fn())` if the function returns, `Err(error)` if it throws `error`.
 * @param fn function that potentially throws
 */
export function as_result<T>(fn: () => T): Result<T, unknown> {
    try {
        return Ok(fn());
    } catch (x) {
        return Err(x);
    }
}

export type Ok<T, E> = {
    /**
     * Return the contained `Ok` value. Will throw a hard error with the specified message if called on `Err`.
     * @param message custom message to throw if `None`
     */
    expect(message: string): T,
    /**
     * returns `true` if the option is `Ok`, `false` if `Err`.
     */
    is_ok(): this is Ok<T, E>;
    /**
     * returns `false` if the option is `Ok`, `true` if `Err`.
     */
    is_err(): this is Err<T, E>;
    /**
     * Maps a `Result<T, E>` into a `Result<U, E>`.
     * Will return `Ok(fn(value))` if the result is `Ok`, or propagate `Err`.
     * @param fn function to transform the inner value
     */
    map<U>(fn: (arg: T) => U): Ok<U, E>;
    /**
     * Maps a `Result<T, E>` into a `Result<T, F>`.
     * Will propagate `Ok`, or return `Err(fn(error))` if the result is `Err`.
     * @param fn function to transform the inner value
     */
    map_err(): Ok<T, E>;
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
    unwrap_or_else<T>(otherwise: (err: E) => T): T;
}

export type Err<T, E> = {
    /**
     * Return the contained `Ok` value. Will throw a hard error with the specified message if called on `Err`.
     * @param message custom message to throw if `None`
     */
    expect(message: string): never,
    /**
     * returns `true` if the option is `Ok`, `false` if `Err`.
     */
    is_ok(): this is Ok<T, E>;
    /**
     * returns `false` if the option is `Ok`, `true` if `Err`.
     */
    is_err(): this is Err<T, E>;
    /**
     * Maps a `Result<T, E>` into a `Result<U, E>`.
     * Will return `Ok(fn(value))` if the result is `Ok`, or propagate `Err`.
     * @param fn function to transform the inner value
     */
    map(): Err<T, E>;
    /**
     * Maps a `Result<T, E>` into a `Result<T, F>`.
     * Will propagate `Ok`, or return `Err(fn(error))` if the result is `Err`.
     * @param fn function to transform the inner value
     */
    map_err<F>(fn: (arg: E) => F): Err<T, F>;
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
     * Return the contained `Ok` value. Will throw a hard error if called on `Err`. 
     */
    unwrap(): never;
    /**
     * Return the contained `Ok` value, or `default_value` if called on `Err`. 
     * @param default_value value to use if the result is `Err`
     */
    unwrap_or<T>(default_value: T): T;
    /**
     * Return the contained `Ok` value, or the result of `otherwise` if called on `Err`.
     * @param otherwise function to use if the result is `Err`
     */
    unwrap_or_else<T>(otherwise: (err: E) => T): T;
}

// Implementations below

const nodeInspect = Symbol.for('nodejs.util.inspect.custom');
export const Ok = <T, E>(value: T) => ({
    expect(_) { return value; },
    is_ok() { return true; },
    is_err() { return false; },
    map(fn) { return Ok(fn(value)); },
    map_err() { return this; },
    unwrap() { return value; },
    unwrap_or(_) { return value; },
    unwrap_or_else(_) { return value; },
    match<R>(matcher_or_ok) {
        if ("Ok" in matcher_or_ok) {
            return (matcher_or_ok as { Ok: (value: T) => R }).Ok(value);
        }
        return matcher_or_ok(value);
    },
    toString() { return `Ok(${value})`; },
    [nodeInspect](_depth, inspectOptions, inspect) {
        const green = inspectOptions.colors ? "\x1b[32m" : "";
        const reset = inspectOptions.colors ? "\x1b[0m" : "";
        return `${green}Ok${reset}(${inspect(value, inspectOptions)})`
    }
}) as unknown as Ok<T, E>;
export const Err = <T, E>(error: E) => ({
    expect(message) { throw Error(message) },
    is_ok() { return false; },
    is_err() { return true; },
    map() { return this; },
    map_err(fn) { return Err(fn(error)); },
    unwrap() { throw Error("Cannot call unwrap on an Err value") },
    unwrap_or(default_value) { return default_value; },
    unwrap_or_else(otherwise) { return otherwise(error); },
    match<R>(matcher_or_ok, err) {
        if ("Err" in matcher_or_ok) {
            return (matcher_or_ok as { Err: (error: E) => R }).Err(error);
        }
        return err(error);
    },
    toString() { return `Err(${error})`; },
    [nodeInspect](_depth, inspectOptions, inspect) {
        const red = inspectOptions.colors ? "\x1b[31m" : "";
        const reset = inspectOptions.colors ? "\x1b[0m" : "";
        return `${red}Err${reset}(${inspect(error, inspectOptions)})`
    }
}) as unknown as Err<T, E>;