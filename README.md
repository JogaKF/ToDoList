# ToDoList

Offline-first, Android-first aplikacja TODO zbudowana w React Native + Expo + TypeScript.

## MVP v1

- lokalna baza SQLite jako source of truth
- listy z soft delete i rename
- taski i subtaski oparte o `parentId`
- widok drzewa z expand/collapse
- `Moj dzien` jako widok oparty o `myDayDate`
- architektura feature-first pod przyszly sync

## Struktura

```text
src/
  app/
    navigation/
    providers/
  screens/
  features/
    lists/
    items/
    my-day/
  db/
    repositories/
  components/
  utils/
```

## Start

```bash
npm install
npm run start
```

## Kolejne kroki

1. Dodac kolejke zmian i modul `sync/`.
2. Wprowadzic auth dopiero po ustabilizowaniu lokalnego MVP.
3. Rozszerzyc `shopping` ponad obecny model taskow.
