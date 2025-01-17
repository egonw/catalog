# Contributing

You are of course welcome to help improve the catalog. You can do this in a number of ways,
including

  1. [Suggesting new keys or other resources to add to the catalog.](https://github.com/identification-resources/catalog/issues/new?assignees=&labels=untriaged%2C+untriaged%3A+addition&template=addition-to-the-catalog.md&title=)
  2. [Reporting errors in the metadata of already added resources.](https://github.com/identification-resources/catalog/issues/new?assignees=&labels=untriaged%2C+untriaged%3A+error&template=catalog-error.md&title=)
  3. [Adding or improving resources yourself by editing the catalog file and making a pull request.](#adding-resources)

## Adding resources

When adding new resources, the following principles should be considered.

  - The entry should not already be in the registry, except if
    - it is a translation published separately from the original, i.e. not in the same article/book/webpage; or
    - it has a different edition number, version number, or ISBN (not counting ISBN-10/ISBN-13), even if the content is the same.
  - The entry should aid in the identification of an organism, by being
    - an identification key;
    - a multi-access key (matrix key);
    - a reference, listing one or more of: descriptions, distribution notes, images, differences to other species;
    - a gallery, listing images of several species in a group, if and only if it is recommended for identification;
    - a checklist, listing the (sub)species in a certain group and area;
    - a supplement, including supplemental info and corrections, of any entry in the catalog; and/or
    - a collection, listing and/or describing several such entries.
  - The entry has some sort of legitimacy, as there is no way to encode such information in the catalog yet.

Three pieces of information about the new entries are requested, one required and
two optional:

  - The metadata of the entry should be added to `catalog.csv`. [The format for this is described below](#catalog).
  - Optionally, any authors, publishers and places in that metadata can be linked
    to Wikidata in `authors.csv` ([docs](#authors)), `publishers.csv`
    ([docs](#publishers)), and `places.csv` ([docs](#places)).
  - Additionally, if possible a checklist in Darwin Core-format is appreciated
    in `checklists/ID.csv` where `ID` is the ID of the entry (`B###`).

## Catalog

"Multiple values" are delimited by semicolons (`Value 1; Value 2`).

| Field        | Required | Multiple values | Description | Format |
|--------------|:--------:|:---------------:|-------------|--------|
| `id`         | ✔        | ❌               | Unique ID for this entry | `B` followed by any number of digits (no leading zero) |
| `title`      | ✔        | ✔ if the entry is multilingual | Full title of the work | Plain text, no HTML/RTF/Markdown. Subtitles delimited with full stops (`.`), or a colon (`:`) if appropriate |
| `author`     | ❌        | ✔               | Any author(s) that would be cited | Not in reversed order, so "Firstname Lastname" |
| `url`        | ❌        | ❌               | Info page, from the publisher or an archived copy (or a DOI URL, if available) | [URL](https://url.spec.whatwg.org/) |
| `fulltext_url` | ❌      | ✔ if neither URL is preferred | Full text, preferably HTML/PDF as opposed to viewer pages | [URL](https://url.spec.whatwg.org/) |
| `archive_url` | ❌       | ✔               | Link to a copy of the full text page in the [Internet Archive](https://web.archive.org) | [URL](https://url.spec.whatwg.org/) |
| `entry_type` | ✔        | ❌               | `print` and `cd` take precedence over `online` in the case of archived copies. | One of `print`, `online` and `cd`. |
| `date`       | ❌        | ❌               | Date of publication. Allows for date ranges | [EDTF](http://www.loc.gov/standards/datetime/) Level 0 and the feature "Open end time interval" of Level 1 |
| `publisher`  | ❌        | ✔               | Name of publisher(s), as it would be cited | Plain text, no place names |
| `series`     | ❌        | ❌               | Main series that the entry is in (book series, journal, etc.) | Plain text |
| `ISSN`       | ❌        | ❌               | Linking ISSN for the series | [ISSN-L](https://www.issn.org/understanding-the-issn/assignment-rules/the-issn-l-for-publications-on-multiple-media/) |
| `ISBN`       | ❌        | ✔ if for ISBN-10/ISBN-13 | ISBN(s) of the entry. | [ISBN](https://www.isbn-international.org/) of 13 or 10 digits, no grouping/hyphens |
| `DOI`        | ❌        | ❌               | DOI of the entry | [DOI](https://www.doi.org/), not the full URL |
| `QID`        | ❌        | ❌               | [Wikidata ID](https://wikidata.org) of the entry | [QID](https://www.wikidata.org/wiki/Wikidata:Glossary#QID) |
| `volume`     | ❌        | ❌               | The volume or series number | Often a number |
| `issue`      | ❌        | ❌               | The issue | Often a number |
| `pages`      | ❌        | ❌               | The number of pages, a page range, or an eprint page number | A single number, two numbers delimited by a hyphen (`-`), or any string respectively |
| `edition`    | ❌        | ❌               | The edition or version number | Plain text |
| `language`   | ✔        | ✔               | The language(s) in which a majority of the entry is written, not just the title and/or abstract | [IETF BCP 47 language tag](https://en.wikipedia.org/wiki/IETF_language_tag) |
| `license`    | ❌        | ✔               | The license or copyright information | An [SPDX license identifier](https://spdx.dev/ids/), `<public domain>`, or a very short comment between angle brackets (e.g. `<CC-BY-NC-SA?>`) |
| `key_type`   | ✔        | ✔               | The types of resources within the entry | `key`, `matrix`, `reference`, `gallery`, `checklist`, `supplement`, `collection` ([definitions](#adding-resources)) |
| `scope`      | ❌        | ✔               | Any notes limiting the scope of the resource | Plain text |
| `taxon`      | ✔        | ✔               | The higher-level groups  | Taxon names |
| `region`     | ✔        | ✔               | The area for which the resource is intended to be used, or a smaller area if the resource is only complete for a part of that area | For [realms](https://en.wikipedia.org/wiki/Biogeographic_realm) just the name, for the entire world a hyphen (`-`), when unknown a question mark (`?`), otherwise `Continent, Country, Region`, `Continent, Country`, or `Continent`, whichever level of precision is applicable |
| `complete`   | ❌        | ❌               | Whether the resources where thought to be complete at the time | `TRUE` or `FALSE` |
| `target_taxa` | ❌       | ✔               | To what level the key distinguishes, for example. Leave empty for `collection`s etc. | Taxon ranks |
| `listed_of`  | ❌        | ✔               | Entries that this entry is listed in | `B` followed by any number of digits (no leading zero) |
| `part_of`    | ❌        | ✔               | Entries that this entry is correcting or part of | `B` followed by any number of digits (no leading zero) |
| `version_of` | ❌        | ✔               | Entries that this entry is a version of | `B` followed by any number of digits (no leading zero) |

## Authors

"Multiple values" are delimited by semicolons (`Value 1; Value 2`).

| Field        | Required | Multiple values | Description | Format |
|--------------|:--------:|:---------------:|-------------|--------|
| `name`       | ✔        | ❌               | The author name | Exactly as in the catalog |
| `qid`        | ❌        | ❌               | [Wikidata ID](https://wikidata.org) of the author | [QID](https://www.wikidata.org/wiki/Wikidata:Glossary#QID) |
| `main_full_name` | ❌    | ❌               | The preferred name of the author, usually the author name as in the catalog but with initials expanded | Not in reversed order, so "Firstname Lastname" |
| `full_names` | ❌        | ✔               | Any other names used by the author | Not in reversed order, so "Firstname Lastname" |

## Publishers

"Multiple values" are delimited by semicolons (`Value 1; Value 2`).

| Field        | Required | Multiple values | Description | Format |
|--------------|:--------:|:---------------:|-------------|--------|
| `name`       | ✔        | ❌               | The publisher name | Exactly as in the catalog |
| `qid`        | ❌        | ❌               | [Wikidata ID](https://wikidata.org) of the publisher | [QID](https://www.wikidata.org/wiki/Wikidata:Glossary#QID) |
| `full_name`  | ❌        | ❌               | The preferred name of the publisher, as used when citing | |
| `long_name`  | ❌        | ✔               | Any other names used by the publisher, including the full name | |

## Places

"Multiple values" are delimited by semicolons (`Value 1; Value 2`).

| Field          | Required | Multiple values | Description | Format |
|----------------|:--------:|:---------------:|-------------|--------|
| `name`         | ✔        | ❌               | The place name | Exactly as in the catalog |
| `qid`          | ❌        | ❌               | [Wikidata ID](https://wikidata.org) of the place | [QID](https://www.wikidata.org/wiki/Wikidata:Glossary#QID) |
| `display_name` | ❌        | ❌               | The display name of the place | `[Region], [Country]`, `[Country]`, `[Continent]`, `[Realm] realm` |
