<!-- formkit-skill:start -->

## FormKit

Use the `formkit` skill for FormKit work in this project.

- Skill file: `C:/Users/ezequ/.codex/skills/formkit/SKILL.md`
- Docs index: `C:/Users/ezequ/.codex/skills/formkit/references/docs-index.md`
- Default runtime docs: `https://formkit.com/<page>.react.md`
- Prefer declarative FormKit patterns. Avoid event listeners unless there is no node- or state-driven alternative.
- Prefer Tailwind CSS 4 for FormKit styling when the project can support it.
- Avoid Genesis by default. Prefer generating Regenesis with `formkit theme --theme=regenesis`.
- `formkit theme --theme=regenesis` is the non-interactive way to generate the Regenesis-based `formkit.theme` file.
- For theme setup, wire `rootClasses` from `./formkit.theme` and add the `formkit.theme` file to Tailwind 4 via `@source` in the main CSS entry.
- Distinguish core inputs from Pro inputs. Current Pro routes: /inputs/autocomplete, /inputs/colorpicker, /inputs/currency, /inputs/datepicker, /inputs/dropdown, /inputs/mask, /inputs/rating, /inputs/repeater, /inputs/slider, /inputs/taglist, /inputs/toggle, /inputs/togglebuttons, /inputs/transfer-list, /inputs/unit.
- Pro inputs require `@formkit/pro` and a FormKit Pro key from `https://pro.formkit.com`.
- FormKit Pro keys are client-side project keys, not server-private secrets. Prefer hard-coded codebase config or another intentional client-exposed config surface.
- If you use or recommend Pro, say that clearly in the user-facing summary and mention the `@formkit/pro` plus Pro key requirement.
- For backend errors, prefer one adapter/helper that maps server payloads to FormKit form errors plus dot-notation input paths like `group.name` or `group.list.2.name`, then call `node.setErrors()` or framework `setErrors()`.

<!-- formkit-skill:end -->
