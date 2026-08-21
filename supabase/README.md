# Supabase

Proyecto: `https://rdvmkdsthquvddgmzlqj.supabase.co`

Regla: **todo SQL va en migrations**. Nunca SQL ad-hoc.

P0 no incluye schema. Cuando se cree, versionar aquí:

```
migrations/
  001_initial_schema.sql
  ...
  008_rls.sql
```

RLS es obligatorio. El frontend no implementa ni sustituye políticas.

`functions/` queda reservado para Edge Functions si el backend las necesita. El cliente PWA no las llama como atajo a la base de datos.
