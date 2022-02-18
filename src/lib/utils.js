export function createSlug(name) {
  // Deep copy of string
  let slug = `${name}`;

  const specialCharacters = {
    á: 'a',
    é: 'e',
    ð: 'd',
    ó: 'o',
    í: 'i',
    ý: 'y',
    ö: 'o',
    æ: 'ae',
    ' ': '-',
  };

  for (const [c, replacement] of Object.entries(specialCharacters)) {
    slug = slug.toLowerCase().replaceAll(c, replacement);
  }

  return slug;
}
