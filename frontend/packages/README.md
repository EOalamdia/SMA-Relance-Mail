# UI Framework Interne

Ce dossier contient la source unique du framework frontend partage, sous `apps/App-Starter/frontend/packages/`.

## Packages

- `./ui-core`
: composants UI generiques (`button`, `card`, `table`, etc.), utilitaires et hooks communs.
- `./ui-shell`
: shell applicatif standard (sidebar, navigation, menu utilisateur, types de navigation).
- `./ui-tokens`
: design tokens (CSS variables), preset Tailwind partage.

## Regles

1. Toute app doit consommer ces packages via alias (`@ui-core`, `@ui-shell`, `@ui-tokens`).
2. Aucun composant UI duplique ne doit rester dans `apps/*/frontend/src/components`.
3. Toute evolution UI generique se fait d'abord dans `apps/App-Starter/frontend/packages/ui-*`, puis est consommee par les apps.
4. Les composants packages ne doivent contenir aucune logique metier.
5. Les routes/endpoints metier restent dans les apps, pas dans `apps/App-Starter/frontend/packages/ui-*`.
