import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as HttpServerRequest from "effect/unstable/http/HttpServerRequest";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
import {
  Rpc,
  RpcGroup,
  RpcSerialization,
  RpcServer,
} from "effect/unstable/rpc";

class HelloFailed extends Schema.TaggedClass<HelloFailed>()("HelloFailed", {
  message: Schema.String,
}) {}

const hello = Rpc.make("hello", {
  success: Schema.String,
  error: HelloFailed,
  payload: { name: Schema.String },
});

const HelloRpcs = RpcGroup.make(hello);

const handlers = HelloRpcs.toLayer({
  hello: ({ name }) => Effect.succeed(`Hello, ${name}!`),
});

export default {
  async fetch(request: Request): Promise<Response> {
    const req = HttpServerRequest.fromWeb(request);
    // Match alchemy's serveWebRequest: expose the underlying body stream
    // as `raw` so the RPC handler can read it without hanging.
    Object.defineProperty(req, "raw", {
      get: () => Object.assign(req.stream, { raw: request.body }),
    });

    const program = Effect.scoped(
      RpcServer.toHttpEffect(HelloRpcs).pipe(
        Effect.flatMap((innerHandler) => innerHandler),
        Effect.provide(handlers),
        Effect.provide(RpcSerialization.layerJson),
        Effect.provideService(HttpServerRequest.HttpServerRequest, req),
      ),
    );
    const response = await Effect.runPromise(program);
    return HttpServerResponse.toWeb(response);
  },
};
