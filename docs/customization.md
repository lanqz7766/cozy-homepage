# Customization / 自定义

The sample profile is fictional. `data/content.js` is a JavaScript object, not JSON: preserve `window.SITE_CONTENT =` and the final semicolon. No HTML is needed in its text fields. Strings render as text; `linkMap` turns named phrases into links.

示例资料为虚构内容。保留文件首尾的 JavaScript 结构即可，正文不用写 HTML。

| Field | What to edit / 用途 |
| --- | --- |
| `siteMeta` | Update date and number of selected publications shown before the archive |
| `profile` | Name, role, affiliation, email, avatar, and link list |
| `about`, `collaboration` | Bio paragraphs and optional collaboration note |
| `researchInterests` | Topic title, description, icon (`brain`, `nodes`, `chip`, `eye`, `activity`, `zap`), links |
| `news` | Year groups containing month labels and text; older items collapse automatically |
| `selectedPublications` | Title, authors, venue, local image, optional note, resource links |
| `otherPublications` | Year groups with compact publication entries |
| `education` | Period, degree/title, organization, location, details; optional logo |
| `teachingMentoring` | Plain text paragraphs |
| `awards` | Set `featured: true` on one entry to feature it first |
| `recognitionHighlights` | Other recognition items; optional `link` or `detail` |
| `serviceGroups` | First group: workshop role and linked items. Following groups: review column titles and items |

Publication `id` values can be linked from Research or Awards using `#your-id`. Use unique IDs. Links labelled `Paper` also become the publication title link. Oral and Spotlight notes get the small blue recognition treatment.

Optional WeChat: add `profile.wechat` with `label`, `qr`, `displayName`, and `note`, then supply your own QR image. Omit the object to keep it hidden. For a CV, add a real PDF and a profile link labelled `CV`; no CV is bundled.

To omit a whole section, leave its corresponding data array empty. Empty sections and navigation links are hidden automatically. `serviceGroups` can be empty; if used, its first group always represents organization. To repurpose the site for a non-academic portfolio, rename the matching static headings and navigation labels in `index.html`; data fields keep their names.

不需要某个栏目时，把对应数组设为空，栏目和导航会自动隐藏。`serviceGroups` 使用时第一组是组织工作，后续组是审稿分类；不要把审稿组单独挪到第一组。非学术主页可以直接改 HTML 里的栏目名称。

## Appearance / 外观

- `src/styles.css`: base typography, responsive sections, navigation, image dialog.
- `src/theme.css`: near-white background, charcoal text, deep-blue links, stepped awards.
- `src/station.css`: desktop scene placement and mobile sizing.
- `src/academic-service.css`: workshop hierarchy and reviewing columns.

Change text and surface colors together, and check contrast on the actual page. Keep the original CSS files rather than stacking additional theme overrides. No remote fonts are requested.

## Animal companion / 动物伙伴

Choose `bear`, `cat`, `bunny`, or `panda` using `data-companion` in `index.html`. Remove `.companion-picker` to keep one animal. Update the initial poster and accessibility labels as described in [the companion guide](companions.md).

## Interaction / 交互

Dragging the scene rotates the camera. Horizontal touch drags rotate; vertical swipes allow page scrolling. Tab to the scene and use left/right keys for keyboard rotation. Typing stops offscreen, on hidden tabs, and with `prefers-reduced-motion: reduce`.

Publication illustrations open in a dialog; Escape closes it. News and the publication archive expand with accessible buttons/native details.

## Before sharing / 分享前

Run `npm run check`, inspect both desktop and mobile, replace the example URLs, and remove the demo publication legend once all entries are your own. Update the poster after model edits. The metadata and initial HTML name are separate from the JavaScript profile, so update both.
