# Repository Instructions

## Default Documentation Scope

- Default documentation work is Chinese-only.
- When the user asks to add, edit, sync, or generate OpenIM docs without explicitly naming a language, work under `content/zh/` first.
- Do not generate, create, rewrite, translate, or synchronize English docs under `content/docs/chat/` by default.
- Do not mirror Chinese documentation changes into `content/docs/chat/` unless the user explicitly says to generate English docs, translate the Chinese docs, or update the English version.
- If a script would automatically generate or overwrite files under `content/docs/chat/`, stop and either adjust the script scope to Chinese output only or ask for confirmation before running it.

## English Documentation Rule

- English docs are a separate explicit deliverable.
- Only touch `content/docs/chat/` when the user explicitly requests one of these:
  - English documentation.
  - Translation of a Chinese page.
  - Keeping Chinese and English versions in sync.
  - A specific edit to an existing English file.
- When English output is requested, say in the response that English docs were intentionally updated.

## Platform API Rules

- For Platform API requests, default to the Chinese docs and Chinese navigation.
- Module overview pages should be child pages titled `概述` inside module folders.
- Single top-level Platform API pages, such as `迁移到 OpenIM` and `错误码`, must keep their own page titles and must not be converted into child `概述` pages.
- Keep the Chinese Platform API navigation model aligned with the current module names: `认证`, `用户`, `关系`, `群组`, `会话`, `消息`, `日志`, `定时任务`, `会议`, `Webhooks`, `迁移到 OpenIM`, `错误码`.
- Open-source and commercial Platform APIs are maintained in the same Chinese documentation tree. Commercial-only pages must set `edition: "enterprise"`; shared open-source pages remain open-source pages and mark commercial-only request, response, resource, configuration, or Webhook fields with the inline `商业版` badge.
- Build commercial-only API pages from `/Users/gordon/GolandProjects/open-im-server-enterprise` with `npm run enterprise-api:sync`. Do not add this command to `predev`, `prebuild`, or broad default content synchronization.
- Every documented `/rtc-meeting` route is commercial, including routes without a trailing documentation marker in the enterprise router.

## Generated Files

- Generated navigation, route, structure, and search files may need updates after Chinese content changes.
- Do not use generated-file updates as a reason to create or overwrite English MDX content under `content/docs/chat/`.
- Before running broad sync or import scripts, check whether they write English docs. Prefer narrower scripts or targeted edits when the request is Chinese-only.
