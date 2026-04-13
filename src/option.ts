import { Err, Ok, Result } from "./result";
/**
 * An optional value.
 * 
 * ### Example
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
export type Option<T> = Some<T> | None;

/**
 * Wrap a function that can return a falsy value (such as  `undefined`, `null` or `NaN`) to instead return an `Option` value,
 * which will be `None` in the above cases.
 */
export function as_option<A extends any[], T>(fn: (...args: A) => T): (...args: A) => Option<T> {
    return (...args) => {
        let out = fn(...args);
        if (out) {
            return Some(out);
        } else {
            return None;
        }
    }
}

/**
 * Common method signatures for Option types.
 */
interface OptionMethods<T> {
    /**
     * Returns `other` if the result is `Some`, or `None` otherwise.
     * @param other Option to return if the option is `Some`
     */
    and<U>(other: Option<U>): Option<U>;
    /**
     * Return the contained `Some` value. Will throw a hard error with the specified message if called on `None`.
     * @param message Custom message to throw if `None`
     */
    expect(message: string): T;
    /**
     * returns `true` if the option is `Some`, `false` if `None`.
     */
    is_some(): this is Some<T>;
    /**
     * returns `true` if the option is `Some` and the value satisfies
     * the given predicate, `false` otherwise.
     */
    is_some_and(predicate: (value: T) => boolean): boolean;
    /**
     * returns `false` if the option is `Some`, `true` if `None`.
     */
    is_none(): this is None;
    /**
     * Returns `true` if the option is `None` or the value satisfies
     * the given predicate, `false` otherwise 
     */
    is_none_or(predicate: (value: T) => boolean): boolean;
    /**
     * Maps an `Option<T>` into an `Option<U>`.
     * Will return `Some(fn(value))` if the option is `Some`, or propagate `None`.
     * @param fn Function to transform the inner `value`
     */
    map<U>(fn: (arg: T) => U): Option<U>;
    /**
     * Pattern-match on the option, running the `Some` or `None` function in the respective cases.
     * @param matcher Object containing a `Some(value)` and `None(error)` function to run
     */
    match<R>(matcher: { Some(value: T): R, None(): R }): R;
    /**
     * Pattern-match on the option, running the former or latter function
     * in the `Some` or `None` cases respectively. 
     * @param on_some Function to run if the option is `Some`
     * @param on_none Function to run if the option is `None`
     */
    match<R>(on_some: (value: T) => R, on_none: (none?: never) => R): R;
    /**
     * Transforms the Option into a Result, mapping Some(value) to Ok(value)
     * and None to Err(error).
     * @param error Err value to use if the option is `None`
     */
    ok_or<E>(error: E): Result<T, E>;
    /**
     * Returns `other` if the result is `None`, otherwise returns the first option's `Some` value.
     * @param other Option to return if the option is `Some`
     */
    or(other: Option<T>): Option<T>;
    /**
     * Return the contained `Some` value. Will throw a hard error if called on `None`. 
     */
    unwrap(): T;
    /**
     * Return the contained `Some` value, or `default_value` if called on `None`.
     * @param default_value Value to use if the option is `None`
     */
    unwrap_or(default_value: T): T;
    /**
     * Return the contained `Some` value, or the result of `otherwise` if called on `None`.
     * @param otherwise Function to run if the option is `None`
     */
    unwrap_or_else(otherwise: () => T): T;
    /**
     * Returns None if either both the option and `other` are `Some` or `None`,
     * or the single `Some(value)` otherwise.
     */
    xor(other: Option<T>): Option<T>;
}
/**
 * A present optional value.
 */
export interface Some<T> extends OptionMethods<T> {
    map<U>(fn: (value: T) => U): Some<U>;
    ok_or<E>(error: E): Ok<T, never>;
    or(other: Option<T>): Some<T>;
}

/**
 * No optional value.
 */
export interface None extends OptionMethods<never> {
    and<U>(other: Option<U>): None;
    is_some<T>(): this is Some<T>;
    is_some_and(predicate: any): false;
    is_none_or(predicate: any): true;
    map<T, U>(fn: (value: T) => U): None;
    match<R>(matcher: { Some(arg: never): R, None(): R } | ((arg: never) => R), on_none?: (arg?: never) => R): R;
    ok_or<E>(error: E): Err<never, E>;
    or<T>(other: Option<T>): None;
    unwrap_or<T>(default_value: T): T;
    unwrap_or_else<T>(otherwise: () => T): T;
    xor<T>(other: Option<T>): Option<T>;
}

// Implementations
const nodeInspect = Symbol.for('nodejs.util.inspect.custom');
/**
 * @param value Inner value
 */
export const Some = <T>(value: T) => ({
    and(other) { return other; },
    expect() { return value; },
    is_some(): this is Some<T> { return true; },
    is_some_and(predicate) { return predicate(value); },
    is_none(): this is None { return false; },
    is_none_or(predicate) { return predicate(value); },
    map(fn) { return Some(fn(value)) },
    match<R>(matcher_or_some: { Some: (value: T) => R } | ((value: T) => R)) {
        if ("Some" in matcher_or_some) {
            return (matcher_or_some as { Some: (value: T) => R }).Some(value);
        }
        return matcher_or_some(value);
    },
    ok_or() { return Ok(value); },
    or() { return this; },
    unwrap() { return value; },
    unwrap_or() { return value; },
    unwrap_or_else(_) { return value; },
    xor(other) { return other.is_none() ? this : None; },
    toString() { return `Some(${value})`; },
    [nodeInspect](_depth: any, inspectOptions: any, inspect: any) {
        const cyan = inspectOptions.colors ? `\x1b[${inspect.colors.cyan[0]}m` : "";
        const reset = inspectOptions.colors ? `\x1b[${inspect.colors.reset[0]}m` : "";
        return `${cyan}Some${reset}(${inspect(value, inspectOptions)})`;
    }
}) as Some<T>;

export const None = Object.freeze({
    and(): None { return None; },
    expect(message: string) { throw Error(message); },
    is_some<T>(): this is Some<T> { return false; },
    is_some_and() { return false; },
    is_none(): this is None { return true; },
    is_none_or() { return true; },
    map() { return None; },
    match<R>(matcher_or_some?: { None: () => R } | ((value: any) => R), none?: (arg: never) => R) {
        if ("None" in matcher_or_some!) {
            return (matcher_or_some as { None: () => R; }).None();
        }
        return (none as any)();
    },
    ok_or<E>(err: E) { return Err(err) as Err<never, E>; },
    or<T>(other: Option<T>) { return other; },
    unwrap() { throw Error("Called unwrap on a None value"); },
    unwrap_or<T>(default_value: T) { return default_value; },
    unwrap_or_else<T>(otherwise: () => T) { return otherwise(); },
    xor<T>(other: Option<T>) { return other.is_some() ? other : None; },
    toString() { return "None"; },
    [nodeInspect](_depth: any, inspectOptions: any, inspect: any) {
        const yellow = inspectOptions.colors ? `\x1b[${inspect.colors.yellow[0]}m` : "";
        const reset = inspectOptions.colors ? `\x1b[${inspect.colors.reset[0]}m` : "";
        return `${yellow}None${reset}`;
    }
}) as None;