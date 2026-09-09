import type { Build } from '../../data/types'
import { LABELS_ELEMENT } from '../../components/elementLabels'
import { LABELS_ROLE } from '../equipe/composeurEquipe'

function diviser<T>(a: T[], b: T[]): { communes: T[]; uniquesA: T[]; uniquesB: T[] } {
  const communes = a.filter((x) => b.includes(x))
  return {
    communes,
    uniquesA: a.filter((x) => !communes.includes(x)),
    uniquesB: b.filter((x) => !communes.includes(x)),
  }
}

function minuscule(s: string): string {
  return s.length > 0 ? s.charAt(0).toLowerCase() + s.slice(1) : s
}

/** Élision de "que" devant un nom de build commençant par une voyelle (Ensorceleur, Occultiste...)
 * — sinon "que Ensorceleur" heurte l'oreille au lieu de "qu'Ensorceleur". */
function que(nom: string): string {
  return /^[aeiouyàâäéèêëîïôöùûü]/i.test(nom) ? `qu'${nom}` : `que ${nom}`
}

function listerFr(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`
}

/** Nom court pour la prose : coupe au premier "(" ou "—" (ex. "Ensorceleur Feu (Lignée
 * draconique rouge)" → "Ensorceleur Feu") — sinon les phrases générées deviennent illisibles à
 * force de répéter le nom complet. */
function tronquerNom(nom: string): string {
  return nom.split(/\s[(—]/)[0].trim()
}

/** Si les deux noms tronqués sont identiques (variantes d'un même nom de base), retombe sur le
 * nom complet des deux côtés pour ne pas générer une prose ambiguë. */
function nomsAffichage(a: Build, b: Build): [string, string] {
  const courtA = tronquerNom(a.nom)
  const courtB = tronquerNom(b.nom)
  return courtA !== courtB ? [courtA, courtB] : [a.nom, b.nom]
}

function analyseRoles(a: Build, b: Build, nomA: string, nomB: string): string | null {
  const { communes, uniquesA, uniquesB } = diviser(a.roles, b.roles)
  if (uniquesA.length === 0 && uniquesB.length === 0) return null

  const communesLabels = listerFr(communes.map((r) => minuscule(LABELS_ROLE[r])))
  const labelsA = listerFr(uniquesA.map((r) => minuscule(LABELS_ROLE[r])))
  const labelsB = listerFr(uniquesB.map((r) => minuscule(LABELS_ROLE[r])))

  if (communes.length > 0) {
    if (uniquesA.length > 0 && uniquesB.length > 0) {
      return `${nomA} et ${nomB} misent tous deux sur ${communesLabels}, mais ${nomA} ajoute ${labelsA} quand ${nomB} apporte ${labelsB}.`
    }
    if (uniquesA.length > 0) {
      return `${nomA} et ${nomB} misent tous deux sur ${communesLabels}, mais ${nomA} ajoute un vrai volet ${labelsA} ${que(nomB)} n'a pas.`
    }
    return `${nomA} et ${nomB} misent tous deux sur ${communesLabels}, mais ${nomB} ajoute un vrai volet ${labelsB} ${que(nomA)} n'a pas.`
  }
  return `${nomA} et ${nomB} n'occupent pas le même rôle : ${nomA} plutôt ${labelsA}, ${nomB} plutôt ${labelsB}.`
}

function analyseForces(a: Build, b: Build, nomA: string, nomB: string): string[] {
  const { communes, uniquesA, uniquesB } = diviser(a.forces, b.forces)
  const phrases: string[] = []

  if (uniquesA.length > 0 && uniquesB.length > 0) {
    phrases.push(
      `${nomA} se distingue par ${listerFr(uniquesA.map(minuscule))}, quand ${nomB} mise plutôt sur ${listerFr(uniquesB.map(minuscule))}.`,
    )
  } else if (uniquesA.length > 0) {
    phrases.push(`${nomA} ajoute ${listerFr(uniquesA.map(minuscule))}, un atout ${que(nomB)} n'a pas.`)
  } else if (uniquesB.length > 0) {
    phrases.push(`${nomB} ajoute ${listerFr(uniquesB.map(minuscule))}, un atout ${que(nomA)} n'a pas.`)
  }

  if (communes.length > 0) {
    phrases.push(`Les deux partagent ${listerFr(communes.map(minuscule))}.`)
  }

  return phrases
}

function analyseFaiblesses(a: Build, b: Build, nomA: string, nomB: string): string[] {
  const { communes, uniquesA, uniquesB } = diviser(a.faiblesses, b.faiblesses)
  const phrases: string[] = []

  if (communes.length > 0) {
    phrases.push(`Ils partagent aussi la même limite : ${listerFr(communes.map(minuscule))}.`)
  }

  if (uniquesA.length > 0 && uniquesB.length > 0) {
    phrases.push(
      `Côté points faibles propres à chacun : ${nomA} doit gérer ${listerFr(uniquesA.map(minuscule))}, ${nomB} plutôt ${listerFr(uniquesB.map(minuscule))}.`,
    )
  } else if (uniquesA.length > 0) {
    phrases.push(`Attention : ${nomA} doit composer avec ${listerFr(uniquesA.map(minuscule))}, un problème ${que(nomB)} n'a pas.`)
  } else if (uniquesB.length > 0) {
    phrases.push(`Attention : ${nomB} doit composer avec ${listerFr(uniquesB.map(minuscule))}, un problème ${que(nomA)} n'a pas.`)
  }

  return phrases
}

function analyseElements(a: Build, b: Build, nomA: string, nomB: string): string | null {
  if (a.elements.length === 0 && b.elements.length === 0) return null
  const { communes, uniquesA, uniquesB } = diviser(a.elements, b.elements)
  const nomsA = a.elements.map((e) => LABELS_ELEMENT[e])
  const nomsB = b.elements.map((e) => LABELS_ELEMENT[e])

  if (a.elements.length === 0) {
    return `${nomA} n'inflige pas de dégâts élémentaires marqués, contrairement à ${nomB} (${listerFr(nomsB)}).`
  }
  if (b.elements.length === 0) {
    return `${nomB} n'inflige pas de dégâts élémentaires marqués, contrairement à ${nomA} (${listerFr(nomsA)}).`
  }
  if (uniquesA.length === 0 && uniquesB.length === 0) return null // profil élémentaire identique

  // Priorité au risque de résistance (mono vs multi-élément) — l'insight le plus utile en jeu —
  // avant le simple constat "types différents", qui s'applique presque toujours sinon.
  if (a.elements.length === 1 && b.elements.length >= 2) {
    return `${nomA} ne mise que sur un seul type de dégâts (${nomsA[0]}), donc plus exposé aux résistances/immunités ${que(nomB)}, qui diversifie avec ${listerFr(nomsB)}.`
  }
  if (b.elements.length === 1 && a.elements.length >= 2) {
    return `${nomB} ne mise que sur un seul type de dégâts (${nomsB[0]}), donc plus exposé aux résistances/immunités ${que(nomA)}, qui diversifie avec ${listerFr(nomsA)}.`
  }
  if (communes.length === 0) {
    return `${nomA} et ${nomB} ne tapent pas dans le même type de dégâts (${listerFr(nomsA)} contre ${listerFr(nomsB)}) — utile à savoir si l'un des deux tombe sur des ennemis résistants.`
  }
  return `${nomA} couvre ${listerFr(nomsA)}, ${nomB} plutôt ${listerFr(nomsB)}.`
}

/** Génère une analyse comparative en croisant les forces/faiblesses/rôles/éléments déjà écrits à
 * la main pour chaque build — pas de nouveau texte à rédiger par paire, mais un résultat qui
 * parle du contenu réel plutôt que de comparer des étiquettes génériques. */
export function genererAnalyseComparative(a: Build, b: Build): string[] {
  const [nomA, nomB] = nomsAffichage(a, b)
  const paragraphes: string[] = []

  const roles = analyseRoles(a, b, nomA, nomB)
  if (roles) paragraphes.push(roles)

  paragraphes.push(...analyseForces(a, b, nomA, nomB))

  const elements = analyseElements(a, b, nomA, nomB)
  if (elements) paragraphes.push(elements)

  paragraphes.push(...analyseFaiblesses(a, b, nomA, nomB))

  if (paragraphes.length === 0) {
    return [
      'Ces deux builds ont un profil très proche sur le papier — la différence se jouera surtout dans le style de jeu et l\'équipement.',
    ]
  }

  return paragraphes
}
