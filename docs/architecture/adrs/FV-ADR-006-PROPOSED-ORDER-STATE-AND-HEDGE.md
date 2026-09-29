# FV-ADR-006 | Conservative order router and two-leg recovery

**Status: PROPOSED_NOT_ADOPTED.** A future Rust/Tokio order router may consume only persisted intents with fresh independent risk admission. Store `MAY_HAVE_SENT` durably before any attempt. ACK is not fill, cancel request is not cancellation, timeout is not rejection. Maintain `UNKNOWN_NEEDS_RECONCILIATION` and freeze new exposure until authenticated venue fill/order/position evidence resolves ambiguity.

In two-leg arbitrage, one leg may partly fill while the other's status is unknown. Never blindly retry that leg or submit an unbounded hedge; reconcile first, then separately evaluate permitted recovery against live depth, fees, exact units and risk. A rejected hedge leaves outstanding exposure and incident status.

Evaluate bounded Tokio channels with explicit backpressure and a separate priority control/kill path: https://tokio.rs/tokio/tutorial/channels . Evaluate off-hot-path redacted OpenTelemetry: https://opentelemetry.io/docs/concepts/signals/ . Real FIX/REST session, execution IDs and cancellation semantics are broker-specific and require contract/API review. Later mock-broker fault injection, signed policy, FV-FOUNDATION-002 source acceptance/independent and separate activation WO are mandatory.

**Foundation amendment D-009:** the accepted Git/Node22/pinned GEF foundation in protected main replaces previous host-service prerequisites. A future pure synthetic source Work Order requires its own admitted scope and actual nonempty deterministic tests; order-capable financial deployment still requires independent security review and exact provider legal rights.
