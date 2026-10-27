// Begriffe, die nicht in Repo und Seiten auftauchen dürfen. Zerlegt, damit diese Datei sich nicht selbst trifft.
export const BANNED = new RegExp([["thai", "land"], ["pat", "taya"], ["UTC", "\\+", "7"], ["\\b", "IC", "T\\b"]].map((a) => a.join("")).join("|"), "i");
