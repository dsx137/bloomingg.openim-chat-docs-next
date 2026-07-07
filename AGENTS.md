# Repository Instructions

## Documentation Language Scope

- By default, documentation edits must target the Chinese docs under `content/zh/`.
- Do not create, rewrite, or synchronize the English docs under `content/docs/` unless the user explicitly asks for English output or says the Chinese changes should be translated.
- When the user asks for Platform API documentation changes without specifying a language, treat it as a Chinese documentation request.
- If an English counterpart is needed, make that a separate explicit translation step and call it out in the response.

## OpenIM Chat Docs Notes

- Platform API module overview pages should use the title `概述` inside module folders.
- Single top-level Platform API pages such as `迁移到 OpenIM` and `错误码` must keep their own page titles and should not be converted into child `概述` pages.
- Keep the Platform API Chinese navigation model aligned with the current module names: `认证`, `用户`, `关系`, `群组`, `会话`, `消息`, `第三方服务`, `迁移到 OpenIM`, `错误码`.
