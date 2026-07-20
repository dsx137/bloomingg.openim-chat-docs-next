# iOS and Flutter WASM-Mirror Documentation Design

## Goal

Replace the current Sendbird-derived iOS and Flutter documentation with OpenIM documentation that mirrors the published Simplified Chinese WASM documentation. The WASM page hierarchy, task boundaries, operation ordering, and explanatory text are the baseline. Each platform substitutes its real APIs, models, enums, events, lifecycle behavior, and examples.

Only Simplified Chinese prose is published in this phase. English pages remain deferred structural skeletons.

## Source Baselines

All evidence links and audit records use immutable commits.

| Source | Version or commit |
| --- | --- |
| OpenIM SDK documentation | `efd0f251b288167e1ca617504b10dd73986429f0` |
| OpenIM iOS SDK | `3.8.3-hotfix.12`, commit `17fb969fd3a360f00fe65f476435b81857e274f8` |
| OpenIM Flutter SDK | `3.8.3+hotfix.12`, commit `95889be7a26dce6fe896ef22096c9036cc25fc9b` |
| Published WASM documentation | Current reviewed Simplified Chinese pages in `content/zh/docs/chat/sdk/wasm/**` |

The OpenIM documentation under `/Volumes/T7/Dev/docs/docs/docs/sdks/` supplies existing Chinese explanations and cross-platform API references. Fixed iOS and Flutter SDK declarations are authoritative when the documentation and implementation disagree.

## Information Architecture

iOS and Flutter each receive an independent task-oriented documentation tree mirroring the WASM domains:

- Overview
- Getting started
- User
- Conversation
- Group
- Message
- Calling
- Events
- Logger

Shared pages preserve the WASM route suffix and operation grouping, changing only the platform segment to `/sdk/ios/**` or `/sdk/flutter/**`. Platform-specific installation, initialization, lifecycle, storage, and push configuration should be placed in the closest shared task page. A new platform-only page is added only when the capability cannot be explained coherently in an existing page.

The current Sendbird-derived iOS and Flutter pages leave navigation. Old routes with a meaningful successor receive permanent redirects. Pages representing capabilities that OpenIM does not provide are removed from publication, retain traceable audit records, and do not receive invented replacements.

## Page Adaptation Rules

Each target page is read and edited independently. The WASM page supplies the scenario, task structure, explanation order, parameter and result presentation, and state-synchronization guidance. It is not mechanically copied or rewritten in bulk.

For Flutter pages:

- Replace WASM methods with the matching Dart SDK APIs.
- Replace TypeScript types with the real Dart classes and enums.
- Replace Promise and event examples with `Future`, manager, and listener patterns from the Flutter SDK.
- Use Dart for all primary code examples.

For iOS pages:

- Replace WASM methods with the matching Objective-C APIs.
- Replace TypeScript types with the real Objective-C models and enums.
- Replace Promise and event examples with callback and delegate patterns from the iOS SDK.
- Use Objective-C as the authoritative and primary example language.
- Add Swift calls selectively when syntax or bridging differences materially help integration; do not duplicate every example in both languages.

Browser-specific descriptions such as WebAssembly assets, IndexedDB, browser lifecycle, and `OpenIM.on()` or `OpenIM.off()` are replaced with the platform's actual installation, storage, lifecycle, listener registration, and cleanup behavior.

Task pages remain organized by operations rather than reproducing raw API-reference pages. Parameter and result explanations stay with the operation they describe. State-changing operations distinguish request or callback success, event delivery, and query-based reconciliation.

## Capability Differences

For every WASM operation, the platform SDK declarations determine the disposition:

| Platform evidence | Documentation treatment |
| --- | --- |
| Equivalent API exists | Substitute the platform API, types, event behavior, and example. |
| API or model differs | Preserve the user task and rewrite the operation around the real platform flow. |
| Capability is partially supported | Document the verified limits and omit unsupported fields or events. |
| No capability or replacement exists | Do not publish the operation. If the whole page becomes empty, omit it from platform navigation and retain an audit record. |

Platform-specific capabilities are included when supported and evidenced. They do not need to match the WASM page count, and pages are never added only to keep the trees numerically identical.

## Events and State

Each platform receives explicit API and event ownership data. Every event has one full-code owner page. Non-owner pages describe the impact and link to the owner without repeating listener registration.

Examples use stable listener or delegate references and show the platform's supported cleanup mechanism. Snapshot queries establish initial state; listeners merge incremental state. Merge identifiers follow the same OpenIM domain rules as the WASM documentation, including `conversationID`, `groupID`, `groupID:userID`, `userID`, `clientMsgID`, and `roomID` where applicable.

## Structure and Traceability

The implementation adds or updates platform-specific deterministic data for:

- sidebar structure and localized navigation labels;
- API and event ownership;
- legacy redirects;
- per-page content audits;
- Simplified Chinese content packaging;
- deferred English skeletons;
- route, structure, ownership, audit, and example checks.

Every completed Chinese page receives a synchronized audit update recording its immutable sources, owned APIs and events, review status, example verification, and platform-specific notes. Generators may maintain navigation, indexes, and other deterministic derived data, but may not create, translate, copy, or rewrite final MDX prose.

## Validation

Validation covers:

- platform navigation and expected route publication;
- removal or redirection of old Sendbird routes;
- internal links and localized route resolution;
- API and event ownership uniqueness;
- complete per-page audit records;
- Simplified Chinese publication and English deferral status;
- Objective-C, optional Swift, and Dart method and type references against fixed SDK declarations;
- stable listener registration and cleanup examples;
- absence of unsupported Sendbird capabilities and fabricated OpenIM APIs.

After page-level checks, run `pnpm check` and `pnpm build`. If the build rewrites `next-env.d.ts`, restore the repository-required import:

```ts
import "./.next/dev/types/routes.d.ts";
```

## Delivery Sequence

Work proceeds platform by platform and page by page. Establish deterministic structure and audit schemas first, then complete the Simplified Chinese pages in domain-sized batches. A page is complete only after its content, evidence, ownership, links, and audit record have been reviewed together. English prose remains deferred until all Chinese iOS and Flutter pages pass publication checks.
