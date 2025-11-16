# RSTypes

Type-safe implementation of lightweight Option and Result types in TypeScript (and JavaScript).

```ts
import { Option, Some, None } from "rstypes/option";

function index_in_array<T>(array: T[], search: T): Option<number> {
    let index = array.indexOf(search);

    if(index == -1) {
        return None;
    } else {
        return Some(index);
    }
}

let idx = index_in_array([1, 2, 3], 2);

idx.match({
    Some(value) { console.log("Found at index: ", value) },
    None() { console.log("Could not find in array") }
})
```
```ts
import { Result, Ok, Err } from "rstypes/result";      // ESM
const { Result, Ok, Err } = require("rstypes/result"); // CommonJS 

function parse_int(str: string): Result<number, string> {
    let maybe_number = parseInt(str);
    if(isNaN(maybe_number)) return Err("Invalid string");
    return Ok(maybe_number);
}

let result = parse_int("333");
result.match({
    Ok(num) { console.log("Parsed number: ", num) },
    Err(msg) { console.log("Error parsing: ", msg) }
});
```

## Usage

You can install rstypes on [npm](TODO):

```sh
npm install rstypes
```

### Basic type information

Use `Option<T>` to represent an optional value, for example:
- An explicit optional parameter in a function.
- An object that may or may not have a value in its field, but should always have that field.
- A function that may or may not return a value.

Use `Result<T, E>` to represent either a succesful return value or an error that is expected and recoverable, for example:
- A parsing function that can fail with malformed input.
- A function that can error based on external state.
- A function that can fail in multiple ways that should be handled separately.


These types give you a type-safe alternative to returning `null` or `undefined` and throwing exceptions, in ways that can be handled more explicitly and are immediately clear from the function signature.

### Handling Option and Result values

`Option` and `Result` values can be handled almost identically (The examples below will focus on `Result` but will clarify differences with handling `Option`s).

Consider an example `Result` variable:

```ts
let res: Result<number, string> = /* ... */
```

Where `number` is the `Ok` type and `string` is the `Err` type.

#### match

Matching on values is exhaustive, and can be done using a more verbose Rust-like syntax using an object, or simply two arrow functions for conciseness. This is considered the default way to handle values for its expressiveness and flexibility. 

```ts
res.match({
    Ok(value) {  /* do something with value */ },
    Err(error) { console.error(error); }
})

let x = res.match({
    value => 2 * value,
    error => { console.error("There was an error"); return 0; }
});
```

> N.B. `Option` values match on the two functions `Some(value)` and `None()` instead, where the `None` case takes no arguments.

#### unwrap, expect

These two methods should **only** be used when you are sure that the value cannot be `Err`/`None` and just want immediate access to the inner value (ie. when the error case would violate a fundamental assumption of the program). These functions will hard error if called on `Err`/`None`, with `unwrap` throwing a generic error and `expect` throwing an error with the specified message:

```ts
let x: number = res.unwrap();
let y: number = res.expect("Should never error with the given inputs");
```

#### unwrap_or, unwrap_or_else

These two methods should be used when you don't care to handle the error case and want suitable default behaviour instead. 

```ts
let x: number = res.unwrap_or(0);
let y: number = res.unwrap_or_else(() => Math.random()); // the function can also depend on the error value!
```

#### is_ok, is_err

These two methods return true or false when the `Result` value is the appropriate variant. They can be used for more traditional/non-exhaustive handling.

```ts
if(res.is_ok()) {
    let x = res.unwrap(); // Guaranteed not to fail
    // ...
} else {
    console.log("There was some error");
}
```
> N.B. `Option` values have analogous predicates `is_some` and `is_none`.

#### map, map_err

These two methods can convert between `Result` values with a different `Ok` type and `Err` type respectively, propagating the alternate value otherwise. These methods can be used to perform transformations conditionally.

```ts
let s: Result<string, string> = res.map((n) => `number ${n}`);
let e: Result<number, Error> = res.map_err((e) => Error(e));
```

> N.B. `Option` values only have `map` to translate between `Option<T>` and `Option<U>`.

### Developer considerations

For additional type safety (such as not being able to call `unwrap` on directly instantiated `Err` values), the outputs of `Ok(x: T)` and `Err(e: E)` are not considered to be values of `Result<T, E>` but rather of their own individual types: `Ok<T, unknown>` and `Err<unknown, E>`. This is also due to the impossibility of inferring a `T` type from a construction of `Err<unknown, E>` and vice versa, resulting in confusing type signatures when returning both from functions.

Therefore, for best developer experience, take care to use explicit `Result<T, E>` type annotations where possible.

> N.B. Holds analogously for `Some` and `None`.
