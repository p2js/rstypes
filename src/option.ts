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
export type Option<T> = Some<T> | None<T>;
/**
 * Wrap a function that can throw, returning `Some(fn())` if the function returns, `None` if it throws.
 * @param fn function that potentially throws
 */
export function as_option<T>(fn: () => T): Option<T> {
    try {
        return Some(fn());
    } catch (x) {
        return None;
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
    is_none(): this is None<T>;
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
    match<R>(on_some: (value: T) => R, on_none: () => R): R;
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
    ok_or<E>(error: E): Ok<T, E>;
    or(other: Option<T>): Some<T>;
}
/**
 * No optional value.
 */
export interface None<T = any> extends OptionMethods<T> {
    and<U>(other: Option<U>): None<U>;
    expect(message: string): never;
    map<U>(fn: (value: T) => U): None<U>;
    ok_or<E>(error: E): Err<T, E>;
    unwrap(): never;
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
    is_none(): this is None<T> { return false; },
    is_none_or(predicate) { return predicate(value); },
    map(fn) { return Some(fn(value)) },
    match<R>(matcher_or_some) {
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
    [nodeInspect](_depth, inspectOptions, inspect) {
        const cyan = inspectOptions.colors ? `\x1b[${inspect.colors.cyan[0]}m` : "";
        const reset = inspectOptions.colors ? `\x1b[${inspect.colors.reset[0]}m` : "";
        return `${cyan}Some${reset}(${inspect(value, inspectOptions)})`;
    }
}) as Some<T>;
export const None = Object.freeze({
    and() { return this; },
    expect(message) { throw Error(message); },
    is_some(): this is Some<any> { return false; },
    is_some_and() { return false; },
    is_none(): this is None<any> { return true; },
    is_none_or() { return true; },
    map() { return None; },
    match<R>(matcher_or_some, none?: () => R) {
        if ("None" in matcher_or_some) {
            return (matcher_or_some as { None: () => R; }).None();
        }
        return none();
    },
    ok_or(err) { return Err(err); },
    or(other) { return other; },
    unwrap() { throw Error("Called unwrap on a None value"); },
    unwrap_or(default_value) { return default_value; },
    unwrap_or_else(otherwise) { return otherwise(); },
    xor(other) { return other.is_some() ? other : None; },
    toString() { return "None"; },
    [nodeInspect](_depth, inspectOptions, inspect) {
        const yellow = inspectOptions.colors ? `\x1b[${inspect.colors.yellow[0]}m` : "";
        const reset = inspectOptions.colors ? `\x1b[${inspect.colors.reset[0]}m` : "";
        return `${yellow}None${reset}`;
    }
}) as None;