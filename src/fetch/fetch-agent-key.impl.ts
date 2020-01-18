import { ContextUpKey, ContextUpRef, ContextValueOpts, ContextValues } from 'context-values';
import { AfterEvent, afterThe, EventKeeper, EventSender, OnEvent, onSupplied } from 'fun-events';

type FetchAgent<Res extends any[]> = (
    this: void,
    next: (this: void, request?: Request) => OnEvent<Res>,
    request: Request,
) => EventSender<Res>;

type CombinedFetchAgent<Res extends any[]> = (
    this: void,
    next: (this: void, request: Request) => OnEvent<Res>,
    request: Request,
) => OnEvent<Res>;

/**
 * @internal
 */
export class FetchAgentKey<Res extends any[]>
    extends ContextUpKey<CombinedFetchAgent<Res>, FetchAgent<Res>>
    implements ContextUpRef<CombinedFetchAgent<Res>, FetchAgent<Res>> {

  readonly upKey: ContextUpKey.UpKey<CombinedFetchAgent<Res>, FetchAgent<Res>>;

  constructor(name: string) {
    super(name);
    this.upKey = this.createUpKey(
        opts => opts.seed.keep.dig(
            (...agents) => {

              const combined = combineFetchAgents(agents);
              const fallback = opts.byDefault(
                  () => afterThe((next, request) => combined(next, request)),
              );

              return fallback || afterThe<[CombinedFetchAgent<Res>]>(defaultFetchAgent);
            },
        ),
    );
  }

  grow<Ctx extends ContextValues>(
      opts: ContextValueOpts<
          Ctx,
          CombinedFetchAgent<Res>,
          EventKeeper<FetchAgent<Res>[]> | FetchAgent<Res>,
          AfterEvent<FetchAgent<Res>[]>>,
  ): CombinedFetchAgent<Res> {

    let delegated!: CombinedFetchAgent<Res>;

    opts.context.get(this.upKey)(agent => delegated = agent);

    return (next, request) => delegated(next, request);
  }

}

/**
 * @internal
 */
function defaultFetchAgent<Res extends any[]>(
    next: (this: void, request: Request) => OnEvent<Res>,
    request: Request,
): OnEvent<Res> {
  return next(request);
}

/**
 * @internal
 */
export function combineFetchAgents<Res extends any[]>(agents: FetchAgent<Res>[]): CombinedFetchAgent<Res> {
  return (next, request) => {

    const fetch: (agentIdx: number, agentRequest: Request) => OnEvent<Res> = (agentIdx, agentRequest) => {

      const agent = agents[agentIdx];

      if (!agent) {
        return next(agentRequest);
      }

      return onSupplied(
          agent(
              (nextRequest = agentRequest) => fetch(agentIdx + 1, nextRequest),
              agentRequest,
          ),
      );
    };

    return fetch(0, request);
  };
}
