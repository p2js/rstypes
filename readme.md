# RSTypes

Type-safe implementation of lightweight `Option` and `Result` types for TypeScript and JavaScript.

```ts
import { Option, Some, None } from "rstypes/option";

function findIndex<T>(array: T[], search: T): Option<number> {
    const index = array.indexOf(search);
    return index === -1 ? None : Some(index);
}

const idx = findIndex([1, 2, 3], 2);

idx.match({
    Some(value) { console.log("Found at index:", value) },
    None() { console.log("Not found") }
});
```

```ts
import { Result, Ok, Err } from "rstypes/result";

function parseIntSafe(str: string): Result<number, string> {
    const num = parseInt(str);
    return isNaN(num) ? Err("Invalid string") : Ok(num);
}

const result = parseIntSafe("333");
result.match({
    Ok(num) { console.log("Parsed:", num) },
    Err(msg) { console.error("Error:", msg) }
});
```

## Table of Contents

- [Why is this useful?](#why-is-this-useful)
- [Usage](#usage)
  - [Basic Types](#basic-types)
  - [Handling Values](#handling-values)
  - [Utilities](#utilities)

## Why is this useful?

`rstypes` can help you build clearer APIs for your libraries and code that allow for more explicit handling and type checking.

* No more hidden `null`/`undefined`. `Option` provides a structured way to handle missing values rather than just finding an `undefined` where you expected a string.

* Explicit error handling. Unlike exceptions, which can be ignored or go unnoticed, `Result` forces you to acknowledge and handle error cases at the type level. The type also explicitly encodes what errors the function will return, making APIs clear.

* Extra type safety. TypeScript ensures that you've handled both success and failure branches when using `match`, and supports type narrowing on different cases, providing compile-time guarantees for your logic.

* Fast, declarative operations. Transformations can be chained with `map`, `or` etc. which will automatically propagate the alternate cases. This keeps logic flat and readable and avoids a branching check for performance (the correct cases get called directly by each value object).

## Usage

```sh
npm install rstypes
```

### Basic Types

`Option<T>` Represents an optional value (which may be `Some(value: T)` or `None`). Use it where `null` or `undefined` would go: explicit optional parameters, nullable fields, or functions that might not return a result.

`Result<T, E>` Represents a success (`Ok(value: T)`) or a recoverable error (`Err(error: E)`). Use it for operations that can fail, like parsing or network requests.

> Note: When making functions that return these values, take care to explicitly annotate return types as `Option<T>` or `Result<T, E>` to maximise clarity in your API. Typescript will by default infer the values as `Some<T> | None` and `Ok<T> | Err<E>`, which are equivalent in function but will have messier definitions for some methods.

### Handling Values

In the below examples, consider example `Option` and `Result` variables

```ts
let opt: Option<number> = /* ... */
let res: Result<number, string> = /* ... */
```

Where `number` is the `Ok`/`Some` type and `string` is the `Err` type of the result.

#### match
Exhaustive pattern matching. Supports both verbose object syntax and concise functional syntax.

```ts
// Object syntax
const val opt.match({
    Some(value) { return value; }
    None() { return 0; }
})

res.match({
    Ok(value) { console.log(value) },
    Err(error) { console.error(error) }
});

// Functional syntax
opt.match(
    value => console.log(value),
    () => console.error("There was no value")
);

const val2 = res.match(
    value => value * 2,
    error => 0
);
```

#### unwrap & expect
Use only when an inner value certainly exists. Throws an error if called on `None` or `Err`. `expect` allows a custom message.

```ts
const val = opt.unwrap();
const val2 = res.expect("Data should be present");
```

the `Result` type has additional methods `unwrap_err` and `expect_err` for the error case.

#### unwrap_or & unwrap_or_else
Provide defaults when a value is missing or an error occurs. `unwrap_or` takes a value, `unwrap_or_else` takes a function.

```ts
const val = opt.unwrap_or(0);
const val2 = res.unwrap_or_else((err) => computeFallback(err));
```

#### Predicates
Check the variant and narrow types.

- `is_ok()` / `is_err()` (Result)
- `is_some()` / `is_none()` (Option)

```ts
if(res.is_err()) {
    // res gets narrowed to Err<string>, so calling unwrap() returns never!
}
```

Additional predicates can be used to verify a condition on the value, or evaluating to `false` on the wrong case.

- `is_some_and(predicate)` / `is_none_or(predicate)` (Option)
- `is_ok_and(predicate)` / `is_err_and(predicate)` (Result)

```ts
const greater_than_3 = opt.is_some_and(x => x > 3); // false if Some(x <= 3) or None
```

#### Mapping
Transform inner values while propagating `None` or `Err`.

```ts
const doubled = opt.map(n => n * 2);               // Option<number>
const wrappedErr = res.map_err(e => new Error(e)); // Result<number, Error>
```

the `Result` type has the additional method `map_err` for the error case.

#### Conversion
Move between `Option` and `Result`.

- `res.ok()` converts `Result<T, E>` to `Option<T>`.
- `res.err()` converts `Result<T, E>` to `Option<E>`.
- `opt.ok_or(err: E)` converts `Option<T>` to `Result<T, E>`.

#### and, or, xor
Perform logical operations on the values.

- `res1.and(res2)` / `opt1.and(opt2)`: Evaluate to the alternative on the success case, or the first on the error case.
- `res1.or(res2)` / `opt1.or(opt2)`: Evaluate to the first on the success case, and the alternative on the error case.
- `opt1.xor(opt2)`: Evaluate to `None` if both or neither are `None`, and the only `Some` otherwise.

### Utilities

Convert standard JS functions to return `Option` or `Result`:

- `as_result` Wraps a throwing function.
- `as_option` Wraps a function returning falsy values (like `null`, `undefined` or `NaN`).

```ts
import { as_result } from "rstypes/result";
const safeParse = as_result(JSON.parse);

import { as_option } from "rstypes/option";
const safeSqrt = as_option(Math.sqrt);
```

calls to `as_option` may also specify an additional predicate for when the returned value should be `None`, rather than on all falsy values.

```ts
// Concise implementation of index_in_array supplying a none predicate
const index_in_array = as_option(
    (array, search) => array.indexOf(search), 
    value => value === -1
);
```