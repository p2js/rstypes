/**
 * Type representing an optional value.
 * 
 * ### Example
 * 
 * ```ts
 * function divide(numerator: number, denominator: number): Option<number> {
 *     if(y === 0) {
 *         return None;
 *     } else {
 *         return Some(numerator / denominator); 
 *     }
 * }
 * 
 * let result = divide(2.0, 3.0);
 * result.match({
 *     Some(n) { console.log(`Result: ${x}`); },
 *     None()  { console.log("Cannot divide by 0")}
 * })
 * ```
 */
export type Option<T> = Some<T> | None<T>;

/**
 * Wrap a function that can throw, returning `Some(fn())` if the function returns, `None` if it throws.
 * @param fn function that potentially throws
 */
export function as_option<T>(fn: () => T): Option<T> {
    try {
        return Some(fn());
    } catch (x) {
        return None as None<T>;
    }
}

export type Some<T> = {
    /**
     * Return the contained `Some` value. Will throw a hard error with the specified message if called on `None`.
     * @param message custom message to throw if `None`
     */
    expect(message: string): T;
    /**
     * returns `true` if the option is `Some`, `false` if `None`.
     */
    is_some(): this is Some<T>;
    /**
     * returns `false` if the option is `Some`, `true` if `None`.
     */
    is_none(): this is None<T>;
    /**
     * Maps an `Option<T>` into an `Option<U>`.
     * Will return `Some(fn(value))` if the option is `Some`, or propagate `None`.
     * @param fn function to transform the inner `value`
     */
    map<U>(fn: (arg: T) => U): Some<U>;
    /**
     * Pattern-match on the option, running the `Some` or `None` function in the respective cases.
     * @param matcher object containing a `Some(value)` and `None(error)` function to run
     */
    match<R>(matcher: { Some(value: T): R, None(): R }): R;
    /**
     * Pattern-match on the option, running the former or latter function
     * in the `Some` or `None` cases respectively. 
     * @param on_some function to run if the option is `Some`
     * @param on_none function to run if the option is `None`
     */
    match<R>(on_some: (value: T) => R, on_none: () => R): R;
    /**
     * Return the contained `Some` value. Will throw a hard error if called on `None`. 
     */
    unwrap(): T;
    /**
     * Return the contained `Some` value, or `default_value` if called on `None`.
     * @param default_value value to use if the option is `None`
     */
    unwrap_or(default_value: T): T;
    /**
     * Return the contained `Some` value, or the result of `otherwise` if called on `None`.
     * @param otherwise function to run if the option is `None`
     */
    unwrap_or_else(otherwise: () => T): T;
}
export type None<T = unknown> = {
    /**
     * Return the contained `Some` value. Will throw a hard error with the specified message if called on `None`.
     * @param message custom message to throw if `None`.
     */
    expect(message: string): never;
    /**
     * returns `true` if the option is `Some`, `false` if `None`.
     */
    is_some(): this is Some<T>;
    /**
     * returns `false` if the option is `Some`, `true` if `None`.
     */
    is_none(): this is None<T>;
    /**
     * Maps an `Option<T>` into an `Option<U>`.
     * Will return `Some(fn(value))` if the option is `Some`, or propagate `None`.
     * @param fn function to transform the inner `value`
     */
    map<U>(fn: (arg: T) => U): None<U>;
    /**
     * Pattern-match on the option, running the `Some` or `None` function in the respective cases.
     * 
     * @param matcher object containing a `Some(value)` and `None` function to run
     */
    match<R>(matcher: { Some(value: T): R, None(): R }): R;
    /**
     * Pattern-match on the option, running the former or latter function
     * in the `Some(value)` and `None` cases respectively.
     * 
     * @param on_some function to run if the option is `Some`
     * @param on_none function to run if the option is `None`
     */
    match<R>(on_some: (value: T) => R, on_none: () => R): R;
    /**
     * Return the contained `Some` value. Will throw a hard error if called on `None`. 
     */
    unwrap(): never;
    /**
     * Return the contained `Some` value, or `default_value` if the option is `None`.
     * 
     * @param default_value value to use if the option is `None`
     */
    unwrap_or(default_value: T): T;
    /**
     * Return the contained `Some` value, or the result of `otherwise` if the function is `None`.
     * 
     * @param otherwise function to run if the option is `None`
     */
    unwrap_or_else(otherwise: () => T): T;
};

// Implementations below

const nodeInspect = Symbol.for('nodejs.util.inspect.custom');
export const Some = <T>(value: T) => ({
    expect(_) { return value },
    is_some() { return true; },
    is_none() { return false; },
    map(fn) { return Some(fn(value)) },
    match<R>(matcher_or_some) {
        if ("Some" in matcher_or_some) {
            return (matcher_or_some as { Some: (value: T) => R }).Some(value);
        }
        return matcher_or_some(value);
    },
    unwrap() { return value; },
    unwrap_or(_) { return value; },
    unwrap_or_else(_) { return value; },
    toString() { return `Some(${value})`; },
    [nodeInspect](_depth, inspectOptions, inspect) {
        const cyan = inspectOptions.colors ? `\x1b[${inspect.colors.cyan[0]}m` : "";
        const reset = inspectOptions.colors ? `\x1b[${inspect.colors.reset[0]}m` : "";
        return `${cyan}Some${reset}(${inspect(value, inspectOptions)})`
    }
}) as unknown as Some<T>;
export const None = Object.freeze({
    expect(message) { throw Error(message); },
    is_some() { return false; },
    is_none() { return true; },
    map() { return None; },
    match<R>(matcher_or_some, none: () => R) {
        if ("None" in matcher_or_some) {
            return (matcher_or_some as { None: () => R; }).None();
        }
        return none();
    },
    unwrap(_) { throw Error("Cannot call unwrap on None"); },
    unwrap_or(default_value) { return default_value; },
    unwrap_or_else(otherwise) { return otherwise(); },
    toString() { return "None"; },
    [nodeInspect](_depth, inspectOptions, inspect) {
        const yellow = inspectOptions.colors ? `\x1b[${inspect.colors.yellow[0]}m` : "";
        const reset = inspectOptions.colors ? `\x1b[${inspect.colors.reset[0]}m` : "";
        return `${yellow}None${reset}`;
    }
}) as unknown as None;