# Como adicionar integrantes

Cada integrante deve ser um arquivo JSON dentro da pasta `site/integrantes/`, seguindo o padrao:

- `nome-da-pessoa.json` (exemplo: `maria-silva.json`)

## Campos obrigatorios em cada arquivo

```json
{
  "Nome": "Nome da Pessoa",
  "Cargo": "Cargo no LABIIA",
  "Formação": "Formacao principal",
  "Imagem": "integrantes/img/nome-da-pessoa.jpg",
  "Minibiografia": "Resumo curto da pessoa",
  "Links importantes": [
    { "titulo": "Lattes", "url": "https://..." }
  ]
}
```

## Passo a passo

1. Crie um novo arquivo em `site/integrantes/` com o nome da pessoa (exemplo: `maria-silva.json`).
2. Coloque a foto da pessoa em `site/integrantes/img/`.
3. Preencha os campos obrigatorios (incluindo `Imagem` com o caminho da foto).
4. Abra `site/integrantes/integrantes.json` e adicione o novo arquivo na lista.

Exemplo:

```json
{
  "file": "maria-silva.json"
}
```

Pronto: o integrante aparece automaticamente na pagina `site/quemsomos.html`.

## Icones de redes dos integrantes

- O site NAO faz mais deteccao automatica por titulo/URL.
- Para mostrar icone, informe obrigatoriamente o campo `icone` (ou `icon`) no link.
- Se o campo `icone` nao existir, o link aparece em texto.
- O link de Lattes pode ficar sem `icone` para manter texto puro.

```json
{ "titulo": "Instagram", "url": "https://instagram.com/seu-perfil", "icone": "fa-brands fa-instagram" }
```

- O valor deve ser uma classe do Font Awesome (ex.: `fa-brands fa-linkedin`, `fa-brands fa-orcid`).

## Redes oficiais do LABIIA (JSON)

As redes exibidas no card principal da home e no card de `Quem somos` sao carregadas de:

- `site/redes/labiia.json`

Modelo:

```json
{
  "redes": [
    { "titulo": "Instagram", "url": "https://instagram.com/seu-perfil", "icone": "fa-brands fa-instagram" },
    { "titulo": "X", "url": "https://x.com/seu-perfil", "icone": "fa-brands fa-x-twitter" }
  ]
}
```

Para adicionar ou remover redes do LABIIA, basta editar esse arquivo.
