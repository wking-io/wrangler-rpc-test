# wrangler-rpc-test

Companion to https://github.com/wking-io/alchemy-rpc-tdz and
https://github.com/alchemy-run/alchemy/issues/1406.

Same Effect v4 RPC server (`RpcServer.toHttpEffect` over a `RpcGroup.make`),
this time bundled by **wrangler / esbuild** instead of **alchemy / rolldown**.

## Why this exists

The alchemy build of the same code 500s with a TDZ at request time
(`virtual_alchemy-entry.js:4:<n>` `ReferenceError: Cannot access '…' before
initialization`). This repo demonstrates that the same Effect RPC code is
fine on Cloudflare Workers when bundled by wrangler. That isolates the
TDZ as an alchemy bundler issue, not an Effect-v4-on-CF-Workers issue.

## Versions

- `effect@4.0.0-beta.65`
- `wrangler@4.90.0`
- Bun 1.3.8, macOS

## Reproduce

```sh
bun install
bunx wrangler deploy
```

A live deploy (or yours) returns the RPC server's well-formed JSON envelope
on GET, demonstrating that the bundle loaded and ran without TDZ:

```sh
$ curl https://wrangler-rpc-test.contact-1c8.workers.dev/
[{"_tag":"Defect","defect":{"message":"Unexpected end of JSON input","name":"SyntaxError"}}]
```

The Defect is the RPC server complaining that the GET had no JSON body — it
ran end-to-end through `RpcServer.toHttpEffect`. Compare with the alchemy
build (same code), which never reaches the handler at all because the
bundled `virtual_alchemy-entry.js` TDZs on the very first reference.

## What this repo does *not* claim

POST with a valid RPC envelope still fails (CF error 1101) because this
minimal worker doesn't fully reproduce alchemy's `serveWebRequest` request
adapter (specifically the `request.raw` body-stream wiring). That's a
separate adapter concern, orthogonal to the bundler TDZ this repo isolates.
